const objectId = require('mongodb').ObjectID

const main = require('./main')
const utils = require('../utils/utils')
const transformers = require('../utils/transformers')
const HandledError = require('../models/HandledError')

const collection = 'user'

const user = {
  register: async function (req, res, injected) {
    const {config, db} = injected
    const data = req.body || {}

    const {login, password} = data
    if (!login || !password) {
      throw new HandledError('login and pass required', 422)
    }

    data._id = new objectId()
    data.id = data._id
    data.token = utils.getGeneratedToken()
    data.passHash = utils.getPassHashByPass(password, config.SALT)
    data.login = data.login.toString().trim()
    delete data.password

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
  },
  login: async function (req, res, injected) {
    const {config, db} = injected
    const data = req.body || {}

    const {login, password} = data
    const passHash = utils.getPassHashByPass(password, config.SALT)

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
  },
  update:  async function (req, res, injected) {
    const {config, auth, db} = injected
    const {id} = req.params

    const data = req.body || {}
    delete data._id
    delete data.id
    delete data.token
    delete data.passHash
    delete data.login

    await auth.isLoggedUser()

    const item = await db.collection(collection).findOne({
      _id: objectId(id)
    })
    if (!item) {
      throw new HandledError('User not found', 404)
    }

    if (auth.token !== item.token) {
      throw new HandledError('You cant edit foreign profile', 403)
    }

    if (data.password) {
      data.passHash = utils.getPassHashByPass(data.password, config.SALT)
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
  },
  view: async function (req, res, injected) {
    const {db, auth} = injected
    const {id} = req.params

    await auth.isLoggedUser()

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
  },
  list: async function (req, res, injected) {
    const {db, auth} = injected
    const {sort, mongoSort} = utils.getSort(req.query)

    await auth.isLoggedUser()

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
  },
  delete: async function (req, res) {
    main.handleError(new HandledError('You cant do that', 405), res, req)
  }
}

module.exports = user
module.exports.collection = collection
