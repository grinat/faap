const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors')
const router = express.Router()

const defaultConfig = require('./config')
const collection = require('./handlers/collection')
const user = require('./handlers/user')
const decorators = require('./utils/decorators')

/**
 * @param {defaultConfig} opts - see config.js for details
 * @param {Object} callbacks - object with promises functions:
 * getDB(config) - must return mongodb or reject err
 * checkIdentify(request, config, db) - reject err on auth failed
 * @returns {Router} router
 */
module.exports = function (opts = {}, callbacks = {}) {
  /** @alias {defaultConfig} */
  const config = decorators.readOnlyObj(Object.assign({}, defaultConfig, opts))

  router.use(cors({origin: '*'}))
  const jsonParser = bodyParser.json({limit: config.BODY_SIZE_LIMIT})

  // swagger ui
  if (config.ENABLE_SWAGGER_UI === true) {
    require('./utils/initSwaggerUi')(config, router)
  }

  const params = {config, callbacks}

  // user routes
  if (config.USE_INNER_AUTH === true) {
    router.post(config.BASE_API_PATH + 'user/register', jsonParser, decorators.injectParamsForHandlers(user.register, params))
    router.post(config.BASE_API_PATH + 'user/login', jsonParser, decorators.injectParamsForHandlers(user.login, params))
    router.patch(config.BASE_API_PATH + 'user/:id', jsonParser, decorators.injectParamsForHandlers(user.update, params))
    router.put(config.BASE_API_PATH + 'user/:id', jsonParser, decorators.injectParamsForHandlers(user.update, params))
    router.delete(config.BASE_API_PATH + 'user/:id', jsonParser, decorators.injectParamsForHandlers(user.delete, params))
    router.get(config.BASE_API_PATH + 'user/:id', jsonParser, decorators.injectParamsForHandlers(user.view, params))
    router.get(config.BASE_API_PATH + 'user', jsonParser, decorators.injectParamsForHandlers(user.list, params))
  }

  // collection
  router.post(config.BASE_API_PATH + ':collection', jsonParser, decorators.injectParamsForHandlers(collection.create, params))
  router.patch(config.BASE_API_PATH + ':collection/:id', jsonParser, decorators.injectParamsForHandlers(collection.update, params))
  router.put(config.BASE_API_PATH + ':collection/:id', jsonParser, decorators.injectParamsForHandlers(collection.update, params))
  router.delete(config.BASE_API_PATH + ':collection/:id', decorators.injectParamsForHandlers(collection.delete, params))
  router.get(config.BASE_API_PATH + ':collection', decorators.injectParamsForHandlers(collection.viewItems, params))
  router.get(config.BASE_API_PATH + ':collection/:id', decorators.injectParamsForHandlers(collection.viewItem, params))

  return router
}
