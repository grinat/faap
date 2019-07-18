const objectId = require('mongodb').ObjectID
const utils = require('../utils/utils')
const HandledError = require('../models/HandledError')
const faker = require('faker')

const toolsHandlers = {
  listCollections: async function (req, res, injected) {
    const {db, auth, callbacks} = injected
    const collName = 'list-collections'

    await auth.isLoggedUser()

    const items = await db.listCollections().toArray()
    const count = items.length

    let gridData = utils.buildGridData(collName, items, req.query, count)

    res.send(
      callbacks.transformList
        ? callbacks.transformList(gridData, collName, req)
        : gridData
    )
  },
  generateFakeData: async function (req, res, injected) {
    const {collection} = req.params
    const {count = 0, 'faker.fake': fakerFake = {}} = req.body
    const {db, auth, callbacks} = injected

    await auth.isLoggedUser()

    const items = []
    for (let i = 0; i < count; i++) {
      const id = new objectId()
      const item = {
        id,
        _id: id,
        searchBody: ''
      }

      for (let fName in fakerFake) {
        item[fName] = faker.fake(fakerFake[fName])
        item.searchBody += ` ${item[fName]} `
      }

      items.push(item)
    }

    await db.collection(collection).insertMany(
      items,
      {
        forceServerObjectId: true
      }
    )

    const gridData = utils.buildGridData(collection, items, req.query, count)

    res.status(201).send(
      callbacks.transformList
        ? callbacks.transformList(gridData, collection, req)
        : gridData
    )
  },
  truncate: async function (req, res, injected) {
    const {collection} = req.params
    const {db, auth} = injected

    await auth.isLoggedUser()

    await db.collection(collection).deleteMany({})

    res.status(204).end()
  }
}

module.exports = toolsHandlers
