const chai = require('chai')
const chaiHttp = require('chai-http')
const path = require('path')
const fs = require('fs')
const expect = chai.expect
chai.should()
chai.use(chaiHttp)

const config = require('../config')

const user = {
  login: +new Date(),
  password: '123456',
  title: 'baka'
}
let userId = null
let token = ''

const item = {
  title: "三体",
  author: "刘慈欣",
  year: 2006
}
const itemDb = 'book'
let createdId = null

let app = null
let server = null

describe(`Test user and collection, inner auth ${config.INNER_AUTH_ENABLED ? 'enabled' : 'disabled'}`, () => {
  before(async () => {
    app = require('../server')
    server = require('../server').initAndRun(config)
  })

  after(async () => {
    await new Promise(resolve => server.close(resolve))
  })

  config.INNER_AUTH_ENABLED && describe('User', () => {
    it('register user', (done) => {
      chai.request(app)
        .post('/faap/v1/user/register')
        .send(user)
        .end((err, res) => {
          res.should.have.status(201)
          res.body.should.be.a('object')
          res.body.should.have.property('login')
          res.body.should.have.property('token')
          res.body.should.have.property('id')
          userId = res.body.id
          done()
        })
    })

    it('login', (done) => {
      chai.request(app)
        .post('/faap/v1/user/login')
        .send(user)
        .end((err, res) => {
          res.should.have.status(200)
          res.body.should.be.a('object')
          res.body.should.have.property('login')
          res.body.should.have.property('token')
          token = res.body.token
          done()
        })
    })

    it('guest cant view profile', (done) => {
      chai.request(app)
        .get('/faap/v1/user/' + userId)
        .end((err, res) => {
          res.should.have.status(401)
          done()
        })
    })

    it('user view profile', (done) => {
      chai.request(app)
        .get('/faap/v1/user/' + userId)
        .set('Authorization', token)
        .end((err, res) => {
          res.should.have.status(200)
          res.body.should.be.a('object')
          res.body.should.have.property('login')
          done()
        })
    })

    it('user update profile', (done) => {
      const updatedUser = Object.assign({}, user)
      updatedUser.title = 'changed'
      chai.request(app)
        .patch('/faap/v1/user/' + userId)
        .set('Authorization', token)
        .send(updatedUser)
        .end((err, res) => {
          res.should.have.status(200)
          res.body.should.be.a('object')
          res.body.should.have.property('login')
          res.body.should.have.property('title').eql(updatedUser.title)
          res.body.should.have.property('token').not.eql(token)
          token = res.body.token
          done()
        })
    })

    it('users list', (done) => {
      chai.request(app)
        .get('/faap/v1/user')
        .set('Authorization', token)
        .send()
        .end((err, res) => {
          res.should.have.status(200)
          res.body.should.be.a('object')
          res.body.should.have.property('data')
          res.body.should.have.property('_meta')
          res.body.data.should.be.a('array')
          res.body.should.to.have.nested.property('data[0].login')
          res.body.should.to.not.have.nested.property('data[0].token')
          res.body.should.to.not.have.nested.property('data[0].passHash')
          done()
        })
    })
  })

  describe('Collection', () => {
    it('created item', (done) => {
      chai.request(app)
        .post('/faap/v1/' + itemDb)
        .set('Authorization', token)
        .send(item)
        .end((err, res) => {
          res.should.have.status(201)
          res.body.should.be.a('object')
          res.body.should.have.property('title')
          res.body.should.have.property('id')
          res.body.should.have.property('_id')
          createdId = res.body.id
          done()
        })
    })

    it('view item', (done) => {
      chai.request(app)
        .get('/faap/v1/' + itemDb + '/' + createdId)
        .set('Authorization', token)
        .end((err, res) => {
          res.should.have.status(200)
          res.body.should.be.a('object')
          res.body.should.have.property('title')
          res.body.should.have.property('id')
          res.body.should.have.property('_id')
          done()
        })
    })

    it('edit item', (done) => {
      const updatedItem = Object.assign(item, {
        title: item.title + 'updated'
      })
      chai.request(app)
        .patch('/faap/v1/' + itemDb + '/' + createdId)
        .set('Authorization', token)
        .send(updatedItem)
        .end((err, res) => {
          res.should.have.status(200)
          res.body.should.be.a('object')
          res.body.should.have.property('title').eql(updatedItem.title)
          res.body.should.have.property('id')
          res.body.should.have.property('_id')
          done()
        })
    })

    it('list of items', (done) => {
      chai.request(app)
        .get('/faap/v1/' + itemDb)
        .set('Authorization', token)
        .end((err, res) => {
          res.should.have.status(200)
          res.body.should.be.a('object')
          res.body.should.have.property('data')
          res.body.should.have.property('_meta')
          res.body.data.should.be.a('array')
          res.body.should.to.have.nested.property('data[0].title')
          done()
        })
    })

    it('remove item', (done) => {
      chai.request(app)
        .delete('/faap/v1/' + itemDb + '/' + createdId)
        .set('Authorization', token)
        .end((err, res) => {
          res.should.have.status(204)
          done()
        })
    })
  })

  describe('Upload', () => {
    it('upload file with wrong mime type', (done) => {
      chai.request(app)
        .post('/faap/v1/upload/file')
        .set('Authorization', token)
        .attach('foo', path.join(__dirname, 'test.js'), 'test.js')
        .end((err, res) => {
          res.should.have.status(422)
          res.body.should.have.nested.property('_meta.fields.foo')
          done()
        })
    })

    it('upload file', async () => {
      const testFilePath = path.join(__dirname, 'test.txt')

      fs.writeFileSync(testFilePath, 'Test')

      const res = await chai.request(app)
        .post('/faap/v1/upload/file')
        .set('Authorization', token)
        .attach('bar', testFilePath, 'test.txt')

      res.should.have.status(201)
      res.body.should.be.a('object')
      res.body.should.have.nested.property('bar.relativeFilePath')

      const uploadedTo = path.join(config.UPLOADS_DIR, res.body.bar.relativeFilePath)

      expect(fs.existsSync(uploadedTo), 'file uploaded and exist').to.be.true

      fs.unlinkSync(testFilePath)
      fs.unlinkSync(uploadedTo)
    })
  })

})
