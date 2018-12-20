const mongoClient = require('mongodb').MongoClient
const objectId = require('mongodb').ObjectID
const axios = require('axios')

const main = require('./main')
const utils = require('../utils/utils')
const transformers = require('../utils/transformers')
const HandledError = require('../models/HandledError')

const collection = 'user'

const user = {
  getAuthKey: function (req) {
    let key = ''
    if (req.headers.authorization) {
      if (req.headers.authorization.indexOf('Bearer') > -1) {
        let m = req.headers.authorization.match(/Bearer (\w*)/i)
        if (m !== null && m[1]) {
          key = m[1]
        }
      } else {
        key = req.headers.authorization
      }
    }
    return key
  },
  checkAuth: async function (db, req, {config}) {
    if (config.USE_INNER_AUTH) {
      const item = await db.collection(collection).findOne({
        token: user.getAuthKey(req).toString().trim()
      })
      if (!item) {
        throw new HandledError('Need auth', 401)
      }
      return item
    } else if (config.CHECK_AUTH_URL) {
      await axios.get(config.CHECK_AUTH_URL, {
        headers: req.headers || {}
      })
    }
  },
  register: async function (req, res, {config}) {
    let db = null
    try {
      const data = req.body || {}
      const {login, password} = data
      if (!login || !password) {
        throw new HandledError('login and pass required', 422)
      }
      data._id = new objectId()
      data.id = data._id
      data.token = utils.getGeneratedToken()
      data.passHash = utils.getPassHashByPass(password)
      data.login = data.login.toString().trim()
      delete data.password
      db = await mongoClient.connect(config.MONGO_URL)
      const item = await db.collection(collection).findOne({
        login: data.login
      })
      if (item) {
        throw new HandledError('User already registered', 422)
      }
      await db.collection(collection).insertOne(data, {
        forceServerObjectId: true
      })
      config.SHOW_DEBUG_MSG && console.debug('Created user with id', data._id.toString())
      res.status(201).send(
        transformers.transformItem(data, collection, req)
      )
    } catch (e) {
      main.handleError(e, res, req)
    } finally {
      db && db.close()
    }
  },
  login: async function (req, res, {config}) {
    let db = null
    try {
      const data = req.body || {}
      const {login, password} = data
      const passHash = utils.getPassHashByPass(password)
      db = await mongoClient.connect(config.MONGO_URL)
      const item = await db.collection(collection).findOne({
        login: login.toString().trim(),
        passHash
      })
      if (!item) {
        throw new HandledError('Wrong login or pass', 422)
      }
      res.send(
        transformers.transformItem(item, collection, req)
      )
    } catch (e) {
      main.handleError(e, res, req)
    } finally {
      db && db.close()
    }
  },
  update:  async function (req, res, {config}) {
    const {id} = req.params
    let db = null
    try {
      const data = req.body || {}
      delete data._id
      delete data.id
      delete data.token
      delete data.passHash
      delete data.login
      db = await mongoClient.connect(config.MONGO_URL)
      const auth = await user.checkAuth(db, req, {config})
      const item = await db.collection(collection).findOne({
        _id: objectId(id)
      })
      if (!item) {
        throw new HandledError('Not found', 404)
      }
      if (!auth) {
        throw new HandledError('Signup first', 401)
      }
      if (auth.token !== item.token) {
        throw new HandledError('You cant edit foreign profile', 403)
      }
      if (data.password) {
        data.passHash = utils.getPassHashByPass(data.password)
        data.token = utils.getGeneratedToken()
        delete data.password
      }
      const update = await db.collection(collection).findOneAndUpdate(
        {_id: objectId(id)},
        {$set: data},
        {returnOriginal: false}
      )
      config.SHOW_DEBUG_MSG && console.debug('Updated item with id', update.value._id.toString())
      res.send(
        transformers.transformItem(update.value, collection, req)
      )
    } catch (e) {
      main.handleError(e, res, req)
    } finally {
      db && db.close()
    }
  },
  view: async function (req, res, {config}) {
    const {id} = req.params
    let db = null
    try {
      db = await mongoClient.connect(config.MONGO_URL)
      const auth = await user.checkAuth(db, req, {config})
      const item = await db.collection(collection).findOne({
        _id: objectId(id)
      })
      if (!item) {
        throw new HandledError('Not found', 404)
      }
      if (!auth || auth.token !== item.token) {
        delete item.token
        delete item.passHash
      }
      res.send(
        transformers.transformItem(item, collection, req)
      )
    } catch (e) {
      main.handleError(e, res, req)
    } finally {
      db && db.close()
    }
  },
  list: async function (req, res, {config}) {
    let db = null
    let {sort, mongoSort} = utils.getSort(req.query)
    try {
      db = await mongoClient.connect(config.MONGO_URL)
      await user.checkAuth(db, req, {config})
      const findQ = utils.buildSearchObject(collection, req.query)
      let count = await db.collection(collection)
        .find(findQ)
        .count()
      let {perPage, skip} = utils.buildPaginateData(req.query, count)
      let items = await db.collection(collection)
        .find(findQ)
        .sort({[sort]: mongoSort})
        .skip(+skip)
        .limit(+perPage)
        .toArray()
      items = items.map(u => {
        delete u.token
        delete u.passHash
        return u
      })
      res.send(
        transformers.transformList(
          utils.buildGridData(collection, items, req.query, count),
          collection,
          req
        )
      )
    } catch (e) {
      main.handleError(e, res, req)
    } finally {
      db && db.close()
    }
  },
  delete: async function (req, res) {
    main.handleError(new HandledError('You cant do that', 405), res, req)
  }
}

module.exports = user
