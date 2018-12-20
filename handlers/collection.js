const mongoClient = require('mongodb').MongoClient
const objectId = require('mongodb').ObjectID

const utils = require('../utils/utils')
const main = require('./main')
const transformers = require('../utils/transformers')
const HandledError = require('../models/HandledError')
const user = require('./user')

const collection = {
  create: async function (req, res, {config}) {
    const {collection} = req.params
    let db = null
    try {
      const data = req.body || {}
      if (!data.id && data._id) {
        data._id = new objectId(data.id.toString())
        data.id = data._id
      } else if (data.id && !data._id) {
        data.id = new objectId(data.id.toString())
        data._id = data.id
      } else {
        data._id = new objectId()
        data.id = data._id
      }
      db = await mongoClient.connect(config.MONGO_URL)
      await user.checkAuth(db, req, {config})
      await db.collection(collection).insertOne(data, {
        forceServerObjectId: true
      })
      config.SHOW_DEBUG_MSG && console.debug('Created item with id', data._id.toString())
      res.status(201).send(
        transformers.transformItem(data, collection, req)
      )
    } catch (e) {
      main.handleError(e, res, req)
    } finally {
      db && db.close()
    }
  },
  update: async function (req, res, {config}) {
    const {collection, id} = req.params
    let db = null
    try {
      const data = req.body || {}
      delete data._id
      delete data.id
      db = await mongoClient.connect(config.MONGO_URL)
      await user.checkAuth(db, req, {config})
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
    } catch (e) {
      main.handleError(e, res, req)
    } finally {
      db && db.close()
    }
  },
  delete: async function (req, res, {config}) {
    const {collection, id} = req.params
    let db = null
    try {
      db = await mongoClient.connect(config.MONGO_URL)
      await user.checkAuth(db, req, {config})
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
    } catch (e) {
      main.handleError(e, res, req)
    } finally {
      db && db.close()
    }
  },
  viewItems: async function (req, res, {config}) {
    const {collection} = req.params
    let {sort, mongoSort} = utils.getSort(req.query)
    let db = null
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
  viewItem: async function (req, res, {config}) {
    const {collection, id} = req.params
    let db = null
    try {
      db = await mongoClient.connect(config.MONGO_URL)
      await user.checkAuth(db, req, {config})
      const item = await db.collection(collection).findOne({
        _id: objectId(id)
      })
      if (!item) {
        throw new HandledError('Not found', 404)
      }
      res.send(transformers.transformItem(item, collection, req))
    } catch (e) {
      main.handleError(e, res, req)
    } finally {
      db && db.close()
    }
  }
}

module.exports = collection
