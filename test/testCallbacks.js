const chai = require('chai')
const chaiHttp = require('chai-http')
chai.should()
chai.use(chaiHttp)

const mongoClient = require('mongodb').MongoClient

const config = require('../serverConfig')

let isLogged = true
let mongoUrl = config.MONGO_URL
let enableValidate = false

const callbacks = {
  getDB: async (config) => await mongoClient.connect(mongoUrl),
  checkIdentify: async (request, config, db) => isLogged ? true : Promise.reject(new Error('Not authorized')),
  transformList: ({data, _meta, _links}, collectionName, req) => ({
    data: data.map(v => callbacks.transformItem(v, collectionName)),
    included: [],
    meta: _meta,
    links: _links
  }),
  transformItem: (item, collectionName, req) => ({
    type: collectionName,
    id: item.id,
    attributes: item,
    relationships: {}
  }),
  validateRequest: async (request, config, db, auth) => {
    await auth.isLoggedUser()
    return enableValidate === false || (auth.user && auth.user.foo === request.body.foo)
      ? true
      : Promise.reject({foo: 'you cant change foo'})
  }
}

let app = null
let server = null

describe('Test callbacks', () => {
  before(async () => {
    app = require('../server')
    server = require('../server').initAndRun(config, callbacks)
  })

  after(async () => {
    await new Promise(resolve => server.close(resolve))
  })

  it('check db and identify', (done) => {
    chai.request(app)
      .get('/faap/v1/foo')
      .end((err, res) => {
        res.should.have.status(200)
        done()
      })
  })

  it('check transform item', (done) => {
    isLogged = true
    chai.request(app)
      .post('/faap/v1/foo')
      .send({})
      .end((err, res) => {
        res.status.should.to.be.below(300)
        res.body.should.be.a('object')
        res.body.should.have.property('type')
        res.body.should.have.property('attributes')
        done()
      })
  })

  it('check transform items', (done) => {
    isLogged = true
    chai.request(app)
      .get('/faap/v1/foo?sort=-id')
      .end((err, res) => {
        res.status.should.to.be.below(300)
        res.body.should.be.a('object')
        res.body.should.have.property('data')
        res.body.should.have.property('included')
        res.body.data.should.be.a('array')
        res.body.should.to.have.nested.property('data[0].id')
        done()
      })
  })

  it('check failed login', (done) => {
    isLogged = false
    chai.request(app)
      .get('/faap/v1/foo')
      .end((err, res) => {
        res.should.have.status(401)
        done()
      })
  })

  it('check validate request failed', (done) => {
    isLogged = true
    enableValidate = true
    chai.request(app)
      .post('/faap/v1/foo')
      .send({foo: 'invalid foo'})
      .end((err, res) => {
        res.should.have.status(422)
        res.body.should.be.a('object')
        res.body.should.have.property('_meta')
        res.body.should.to.have.nested.property('_meta.foo')
        done()
      })
  })

  it('check failed db', (done) => {
    isLogged = true
    enableValidate = false
    mongoUrl = 'fail'
    chai.request(app)
      .get('/faap/v1/foo')
      .end((err, res) => {
        res.should.have.status(500)
        done()
      })
  })

})
