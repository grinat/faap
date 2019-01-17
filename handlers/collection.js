const objectId = require('mongodb').ObjectID

const utils = require('../utils/utils')
const transformers = require('../utils/transformers')
const HandledError = require('../models/HandledError')

const collection = {
  create: async function (req, res, injected) {
    const {collection} = req.params
    const {config, db, auth} = injected

    await auth.isLoggedUser()

    const data = req.body || {}
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

    res.status(201).send(
      transformers.transformItem(data, collection, req)
    )
  },
  update: async function (req, res, injected) {
    const {collection, id} = req.params
    const {config, db, auth} = injected

    await auth.isLoggedUser()

    const data = req.body || {}
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

    res.send(
      transformers.transformItem(update.value, collection, req)
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
    const {db, auth} = injected
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

    res.send(
      transformers.transformList(
        utils.buildGridData(collection, items, req.query, count),
        collection,
        req
      )
    )
  },
  viewItem: async function (req, res, injected) {
    const {collection, id} = req.params
    const {db, auth} = injected

    await auth.isLoggedUser()

    const item = await db.collection(collection).findOne({
      _id: objectId(id)
    })
    if (!item) {
      throw new HandledError('Not found', 404)
    }

    res.send(transformers.transformItem(item, collection, req))
  }
}

module.exports = collection
