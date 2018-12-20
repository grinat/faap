const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors')
const router = express.Router()

const pkg = require('./package')

const swaggerUi = require('swagger-ui-express')
const YAML = require('yamljs')
const swaggerDocument = YAML.load('./docs/api.swagger.yaml')
swaggerDocument.info.version = pkg.version
swaggerDocument.info.title = pkg.name
swaggerDocument.info.description = pkg.description
if (process.env.HEROKU_APP_NAME) {
  // set https scheme as default
  swaggerDocument.schemes.unshift('https')
}

const defaultConfig = require('./config')
const collection = require('./handlers/collection')
const user = require('./handlers/user')
const utils = require('./utils/utils')

module.exports = function (opts) {
  const config = Object.assign({}, defaultConfig, opts)
  router.use(cors({origin: '*'}))
  const jsonParser = bodyParser.json({limit: config.BODY_SIZE_LIMIT})

  swaggerDocument.basePath = config.BASE_API_PATH
  router.use(config.BASE_API_PATH + 'docs/swagger', swaggerUi.serve, swaggerUi.setup(swaggerDocument))

  router.post(config.BASE_API_PATH + 'user/register', jsonParser, utils.passRouterFuncParams(user.register, {config}))
  router.post(config.BASE_API_PATH + 'user/login', jsonParser, utils.passRouterFuncParams(user.login, {config}))
  router.patch(config.BASE_API_PATH + 'user/:id', jsonParser, utils.passRouterFuncParams(user.update, {config}))
  router.put(config.BASE_API_PATH + 'user/:id', jsonParser, utils.passRouterFuncParams(user.update, {config}))
  router.delete(config.BASE_API_PATH + 'user/:id', jsonParser, utils.passRouterFuncParams(user.delete, {config}))
  router.get(config.BASE_API_PATH + 'user/:id', jsonParser, utils.passRouterFuncParams(user.view, {config}))
  router.get(config.BASE_API_PATH + 'user', jsonParser, utils.passRouterFuncParams(user.list, {config}))

  router.post(config.BASE_API_PATH + ':collection', jsonParser, utils.passRouterFuncParams(collection.create, {config}))
  router.patch(config.BASE_API_PATH + ':collection/:id', jsonParser, utils.passRouterFuncParams(collection.update, {config}))
  router.put(config.BASE_API_PATH + ':collection/:id', jsonParser, utils.passRouterFuncParams(collection.update, {config}))
  router.delete(config.BASE_API_PATH + ':collection/:id', utils.passRouterFuncParams(collection.delete, {config}))
  router.get(config.BASE_API_PATH + ':collection', utils.passRouterFuncParams(collection.viewItems, {config}))
  router.get(config.BASE_API_PATH + ':collection/:id', utils.passRouterFuncParams(collection.viewItem, {config}))

  return router
}
