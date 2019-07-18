const swaggerUi = require('swagger-ui-express')
const YAML = require('yamljs')
const path = require('path')

const pkg = require('../../package')

function init (config, router) {
  const swaggerDocument = YAML.load(path.join(__dirname, '../../docs/api.swagger.yaml'))
  swaggerDocument.info.version = pkg.version
  swaggerDocument.info.title = pkg.name
  swaggerDocument.info.description = pkg.description

  swaggerDocument.basePath = config.BASE_API_PATH
  router.use(config.BASE_API_PATH + 'docs/swagger', swaggerUi.serve, swaggerUi.setup(swaggerDocument))
  console.log(`faap v${pkg.version} swagger ui path: ${config.BASE_API_PATH}docs/swagger`)
}

module.exports = init
