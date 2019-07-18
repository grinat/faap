const mongoClient = require('mongodb').MongoClient

const Auth = require('../models/Auth')
const main = require('../handlers/main')
const HandledError = require('../models/HandledError')

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
        main.handleError(e, res, req, config)
        return
      }

      // create auth instance
      const auth = new Auth({config, db, req, checkIdentify: callbacks.checkIdentify})

      // validate response
      if (callbacks.validateRequest) {
        try {
          await callbacks.validateRequest(req, config, db, auth)
        } catch (e) {
          db.close()

          // if in validateRequest await auth.isLoggedUser() failed
          // returned e instanceof HandledError with code 401
          if (e instanceof HandledError) {
            main.handleError(e, res, req, config)
          } else {
            const err = new HandledError('Validation request failed', 422)
            err.meta = e
            main.handleError(err, res, req, config)
          }
          return
        }
      }

      // execute handler
      try {
        await func(req, res, {config, auth, db, callbacks})
      } catch (e) {
        main.handleError(e, res, req, config)
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
