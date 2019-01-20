const objectId = require('mongodb').ObjectID

const main = require('./main')
const utils = require('../utils/utils')
const HandledError = require('../models/HandledError')

const userHandlers = {
  register: async function (req, res, injected) {
    const {config, db, callbacks} = injected
    const data = req.body || {}
    const collection = config.INNER_AUTH_COLLECTION

    const {login, password} = data
    if (!login || !password) {
      throw utils.createErrWithInvalidFields({
        login: !login ? 'Login required' : null,
        password: !password ? 'Password required' : null,
      })
    }

    data._id = new objectId()
    data.id = data._id
    data.token = utils.getGeneratedToken()
    data.passHash = utils.getPassHashByPass(password, config.INNER_AUTH_SALT)
    data.login = data.login.toString().trim()
    delete data.password

    const item = await db.collection(collection).findOne({
      login: data.login
    })
    if (item) {
      throw utils.createErrWithInvalidFields({
        login: 'User with that login already registered'
      })
    }

    await db.collection(collection).insertOne(data, {
      forceServerObjectId: true
    })
    config.SHOW_DEBUG_MSG && console.debug('Created user with id', data._id.toString())

    res.status(201).send(callbacks.transformItem
      ? callbacks.transformItem(data, collection, req)
      : data
    )
  },
  login: async function (req, res, injected) {
    const {config, db, callbacks} = injected
    const data = req.body || {}
    const collection = config.INNER_AUTH_COLLECTION

    const {login, password} = data
    const passHash = utils.getPassHashByPass(password, config.INNER_AUTH_SALT)

    const item = await db.collection(collection).findOne({
      login: login.toString().trim(),
      passHash
    })
    if (!item) {
      throw utils.createErrWithInvalidFields({
        login: 'Wrong login or pass',
        password: 'Wrong login or pass'
      })
    }

    res.send(callbacks.transformItem
      ? callbacks.transformItem(item, collection, req)
      : item
    )
  },
  update:  async function (req, res, injected) {
    const {config, auth, db, callbacks} = injected
    const {id} = req.params
    const data = req.body || {}
    const collection = config.INNER_AUTH_COLLECTION

    // remove vars, which can broke logic
    delete data._id
    delete data.id
    // remove portintialy unsdafe vars
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

    // change hashes if password provided
    if (data.password) {
      data.passHash = utils.getPassHashByPass(data.password, config.INNER_AUTH_SALT)
      data.token = utils.getGeneratedToken()
      delete data.password
    }

    const update = await db.collection(collection).findOneAndUpdate(
      {_id: objectId(id)},
      {$set: data},
      {returnOriginal: false}
    )
    config.SHOW_DEBUG_MSG && console.debug('Updated item with id', update.value._id.toString())

    res.send(callbacks.transformItem
      ? callbacks.transformItem(update.value, collection, req)
      : update.value
    )
  },
  view: async function (req, res, injected) {
    const {db, auth, callbacks, config} = injected
    const {id} = req.params
    const collection = config.INNER_AUTH_COLLECTION

    await auth.isLoggedUser()

    const item = await db.collection(collection).findOne({
      _id: objectId(id)
    })
    if (!item) {
      throw new HandledError('Not found', 404)
    }

    // show token for owners only
    if (auth.token !== item.token) {
      delete item.token
    }
    delete item.passHash

    res.send(callbacks.transformItem
      ? callbacks.transformItem(item, collection, req)
      : item
    )
  },
  list: async function (req, res, injected) {
    const {db, auth, callbacks, config} = injected
    const {sort, mongoSort} = utils.getSort(req.query)
    const collection = config.INNER_AUTH_COLLECTION

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

    let gridData = utils.buildGridData(collection, items, req.query, count)

    res.send(
      callbacks.transformList
        ? callbacks.transformList(gridData, collection, req)
        : gridData
    )
  },
  delete: async function (req, res, {config}) {
    main.handleError(new HandledError('You cant do that', 405), res, req, config)
  }
}

module.exports = userHandlers
