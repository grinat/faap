const objectId = require('mongodb').ObjectID

const utils = require('../utils/utils')
const HandledError = require('../models/HandledError')

const collectionHandlers = {
  create: async function (req, res, injected) {
    const {collection} = req.params
    const {config, db, auth, callbacks} = injected

    await auth.isLoggedUser()

    const data = req.body || {}
    // for compatibility with front which is configured to work with id
    if (!data.id && data._id) {
      data._id = new objectId(data._id.toString())
      data.id = data._id
    } else if (data.id && !data._id) {
      data.id = new objectId(data.id.toString())
      data._id = data.id
    } else {
      data._id = new objectId()
      data.id = data._id
    }

    await db.collection(collection).insertOne(data, {
      forceServerObjectId: true
    })
    config.SHOW_DEBUG_MSG && console.debug('Created item with id', data._id.toString())

    res.status(201).send(callbacks.transformItem
      ? callbacks.transformItem(data, collection, req)
      : data
    )
  },
  update: async function (req, res, injected) {
    const {collection, id} = req.params
    const {config, db, auth, callbacks} = injected

    await auth.isLoggedUser()

    const data = req.body || {}
    // remove vars, which can broke logic
    delete data._id
    delete data.id

    const item = await db.collection(collection).findOne({
      _id: objectId(id)
    })
    if (!item) {
      throw new HandledError('Not found', 404)
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
  delete: async function (req, res, injected) {
    const {collection, id} = req.params
    const {config, db, auth} = injected

    await auth.isLoggedUser()

    const item = await db.collection(collection).findOne({
      _id: objectId(id)
    })
    if (!item) {
      throw new HandledError('Not found', 404)
    }

    await db.collection(collection).findOneAndDelete({
      _id: objectId(id)
    })
    config.SHOW_DEBUG_MSG && console.debug('Deleted item with id', id)

    res.status(204).end()
  },
  viewItems: async function (req, res, injected) {
    const {collection} = req.params
    const {db, auth, callbacks} = injected
    let {sort, mongoSort} = utils.getSort(req.query)

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

    let gridData = utils.buildGridData(collection, items, req.query, count)

    res.send(
      callbacks.transformList
        ? callbacks.transformList(gridData, collection, req)
        : gridData
    )
  },
  viewItem: async function (req, res, injected) {
    const {collection, id} = req.params
    const {db, auth, callbacks} = injected

    await auth.isLoggedUser()

    const item = await db.collection(collection).findOne({
      _id: objectId(id)
    })
    if (!item) {
      throw new HandledError('Not found', 404)
    }

    res.send(callbacks.transformItem
      ? callbacks.transformItem(item, collection, req)
      : item
    )
  }
}

module.exports = collectionHandlers
