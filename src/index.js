const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors')
const fileUpload = require('express-fileupload')
const router = express.Router()
const fs = require('fs')

const collection = require('./handlers/collection')
const user = require('./handlers/user')
const upload = require('./handlers/upload')
const decorators = require('./utils/decorators')
const tools = require('./handlers/tools')

const defaultConfig = {
  // for example: 'mongodb://localhost:27017/test'
  MONGO_URL: null,

  // set url, faap send GET response to that url
  // with all headers and if credentials invalid, send any http code out of the range of 2xx
  CHECK_AUTH_URL: null,
  // if true, you can login/register/edit profile at site
  INNER_AUTH_ENABLED: false,
  // where save users data
  INNER_AUTH_COLLECTION: 'user',
  INNER_AUTH_SALT: 'w@N:X+nG Fhu!N~PW|>,Wyl1M8)4[&so1-=&Pd8aO+wkIn;,:;gi4n<+aZGH-|.Q',

  // max size of json content which sended my client
  BODY_SIZE_LIMIT: '4mb',

  BASE_API_PATH: '/faap/v1/',

  // show in console.log('Created collection with id...')
  SHOW_DEBUG_MSG: false,

  // if true on /faap/v1/docs/swagger you can see swagger ui
  SWAGGER_UI_ENABLED: false,

  // enable upload files
  UPLOADS_ENABLED: false,
  // where saved uploaded files
  // for example: path.join(__dirname, 'uploads')
  UPLOADS_DIR: null,
  UPLOADS_ACCEPTED_MIMES: ['image/png', 'image/jpeg', 'image/pjpeg', 'image/gif', 'text/plain'],
  UPLOADS_SIZE_LIMIT: 4 * 1024 * 1024,

  // enable tools for admin collections (truncate, gen fake data and etc)
  ENABLE_TOOLS: false
}

/**
 * @param {defaultConfig} opts
 * @param {Object} callbacks - object with promises functions:
 * getDB: async (config) => await mongoClient.connect(mongoUrl),
 * checkIdentify: async (request, config, db) => isLogged ? true : Promise.reject(new Error('Not authorized')),
 * transformList: ({data, _meta, _links}, collectionName, req) => ({data, _meta, _links}),
 * transformItem: (item, collectionName, req) => item
 * validateRequest: async (request, config, db, auth) => {
 *   await auth.isLoggedUser()
 *   return enableValidate === false || (auth.user && auth.user.foo === request.body.foo)
 *     ? true
 *     : Promise.reject({foo: 'you cant change foo'})
 * }
 * @returns {Router} router
 */
module.exports = function (opts = {}, callbacks = {}) {
  /** @alias {defaultConfig} */
  const config = decorators.readOnlyObj(Object.assign({}, defaultConfig, opts))

  router.use(cors({origin: '*'}))
  const jsonParser = bodyParser.json({limit: config.BODY_SIZE_LIMIT})

  router.use(fileUpload({
    limits: {
      fileSize: config.UPLOADS_SIZE_LIMIT
    },
    createParentPath: true,
    preserveExtension: true
  }))

  // swagger ui
  if (config.SWAGGER_UI_ENABLED === true) {
    require('./utils/initSwaggerUi')(config, router)
  }

  const params = {config, callbacks}

  // user routes
  if (config.INNER_AUTH_ENABLED === true) {
    router.post(config.BASE_API_PATH + 'user/register', jsonParser, decorators.injectParamsForHandlers(user.register, params))
    router.post(config.BASE_API_PATH + 'user/login', jsonParser, decorators.injectParamsForHandlers(user.login, params))
    router.patch(config.BASE_API_PATH + 'user/:id', jsonParser, decorators.injectParamsForHandlers(user.update, params))
    router.put(config.BASE_API_PATH + 'user/:id', jsonParser, decorators.injectParamsForHandlers(user.update, params))
    router.delete(config.BASE_API_PATH + 'user/:id', jsonParser, decorators.injectParamsForHandlers(user.delete, params))
    router.get(config.BASE_API_PATH + 'user/:id', jsonParser, decorators.injectParamsForHandlers(user.view, params))
    router.get(config.BASE_API_PATH + 'user', jsonParser, decorators.injectParamsForHandlers(user.list, params))
  }

  // upload
  if (config.UPLOADS_ENABLED === true) {
    router.post(config.BASE_API_PATH + 'upload/file', jsonParser, decorators.injectParamsForHandlers(upload.file, params))
    router.put(config.BASE_API_PATH + 'upload/file', jsonParser, decorators.injectParamsForHandlers(upload.file, params))

    // static files dir
    const path = config.UPLOADS_DIR
    if (fs.existsSync(path) === false) {
      throw new Error(`UPLOADS_DIR=${path} not found`)
    }

    router.use(config.BASE_API_PATH + 'uploads', express.static(path))
  }

  // tools
  if (config.ENABLE_TOOLS === true) {
    router.get(config.BASE_API_PATH + 'tools/list-collections', decorators.injectParamsForHandlers(tools.listCollections, params))
    router.post(config.BASE_API_PATH + 'tools/generate-fake-data/:collection', jsonParser, decorators.injectParamsForHandlers(tools.generateFakeData, params))
    router.delete(config.BASE_API_PATH + 'tools/truncate/:collection', decorators.injectParamsForHandlers(tools.truncate, params))
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
