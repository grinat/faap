const mongoClient = require('mongodb').MongoClient

const Auth = require('../models/Auth')
const main = require('../handlers/main')

let callbacks

const decorators = {
  injectParamsForHandlers: function (func, options) {
    callbacks = options.callbacks
    return async function (req, res) {
      const {config} = options
      let db = null

      // get db connection
      try {
        if (callbacks.getDB) {
          db = await callbacks.getDB(config)
        } else {
          db = await mongoClient.connect(config.MONGO_URL)
        }
      } catch (e) {
        main.handleError(e, res, req)
        return
      }

      // create auth instance
      const auth = new Auth({config, db, req, checkIdentify: callbacks.checkIdentify})

      // execute handler
      try {
        await func(req, res, {config, auth, db})
      } catch (e) {
        main.handleError(e, res, req)
      } finally {
        db.close()
      }
    }
  },
  /**
   * @param {Object} obj
   * @returns {Object}
   */
  readOnlyObj: function (obj) {
    return (function (input) {
      return Object.freeze(input)
    })(obj)
  }
}

module.exports = decorators
