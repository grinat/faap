const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors')
const router = express.Router()

const defaultConfig = require('./config')
const collection = require('./handlers/collection')
const user = require('./handlers/user')
const decorators = require('./utils/decorators')

module.exports = function (opts) {
  /** @alias {defaultConfig} */
  const config = decorators.readOnlyObj(Object.assign({}, defaultConfig, opts))

  router.use(cors({origin: '*'}))
  const jsonParser = bodyParser.json({limit: config.BODY_SIZE_LIMIT})

  // swagger ui
  if (config.ENABLE_SWAGGER_UI === true) {
    require('./utils/initSwaggerUi')(config, router)
  }

  // user routes
  if (config.USE_INNER_AUTH === true) {
    router.post(config.BASE_API_PATH + 'user/register', jsonParser, decorators.injectParamsForHandlers(user.register, {config}))
    router.post(config.BASE_API_PATH + 'user/login', jsonParser, decorators.injectParamsForHandlers(user.login, {config}))
    router.patch(config.BASE_API_PATH + 'user/:id', jsonParser, decorators.injectParamsForHandlers(user.update, {config}))
    router.put(config.BASE_API_PATH + 'user/:id', jsonParser, decorators.injectParamsForHandlers(user.update, {config}))
    router.delete(config.BASE_API_PATH + 'user/:id', jsonParser, decorators.injectParamsForHandlers(user.delete, {config}))
    router.get(config.BASE_API_PATH + 'user/:id', jsonParser, decorators.injectParamsForHandlers(user.view, {config}))
    router.get(config.BASE_API_PATH + 'user', jsonParser, decorators.injectParamsForHandlers(user.list, {config}))
  }

  // collection
  router.post(config.BASE_API_PATH + ':collection', jsonParser, decorators.injectParamsForHandlers(collection.create, {config}))
  router.patch(config.BASE_API_PATH + ':collection/:id', jsonParser, decorators.injectParamsForHandlers(collection.update, {config}))
  router.put(config.BASE_API_PATH + ':collection/:id', jsonParser, decorators.injectParamsForHandlers(collection.update, {config}))
  router.delete(config.BASE_API_PATH + ':collection/:id', decorators.injectParamsForHandlers(collection.delete, {config}))
  router.get(config.BASE_API_PATH + ':collection', decorators.injectParamsForHandlers(collection.viewItems, {config}))
  router.get(config.BASE_API_PATH + ':collection/:id', decorators.injectParamsForHandlers(collection.viewItem, {config}))

  return router
}
