const chai = require('chai')
const chaiHttp = require('chai-http')
const expect = chai.should()
chai.use(chaiHttp)

const mongoClient = require('mongodb').MongoClient

const config = require('../config')

let isLogged = true
let mongoUrl = config.MONGO_URL

const callbacks = {
  getDB: async (config) => await mongoClient.connect(mongoUrl),
  checkIdentify: async (request, config, db) => isLogged ? true : Promise.reject(new Error('Not authorized'))
}

let app = null
let server = null

describe('Test callbacks', () => {
  before(async () => {
    app = require('../server')
    server = require('../server').initAndRun(config, callbacks)
  })

  after(async () => {
    server.close()
  })

  it('check db and identify', (done) => {
    chai.request(app)
      .get('/faap/v1/foo')
      .end((err, res) => {
        res.should.have.status(200)
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

  it('check failed db', (done) => {
    isLogged = true
    mongoUrl = 'fail'
    chai.request(app)
      .get('/faap/v1/foo')
      .end((err, res) => {
        res.should.have.status(500)
        done()
      })
  })

})
