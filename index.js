const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors')
const app = express()

const pkg = require('./package')

const swaggerUi = require('swagger-ui-express')
const YAML = require('yamljs')
const swaggerDocument = YAML.load('./docs/api.swagger.yaml')
swaggerDocument.info.version = pkg.version
swaggerDocument.info.title = pkg.name
swaggerDocument.info.description = pkg.description
const SWAGGER_UI_ENDPOINT = '/faap/v1/docs/swagger'

const config = require('./config')
const collection = require('./handlers/collection')
const user = require('./handlers/user')

app.use(cors({origin: '*'}))
const jsonParser = bodyParser.json({limit: config.BODY_SIZE_LIMIT})

app.use(SWAGGER_UI_ENDPOINT, swaggerUi.serve, swaggerUi.setup(swaggerDocument))

app.post('/faap/v1/user/register', jsonParser, user.register)
app.post('/faap/v1/user/login', jsonParser, user.login)
app.patch('/faap/v1/user/:id', jsonParser, user.update)
app.put('/faap/v1/user/:id', jsonParser, user.update)
app.delete('/faap/v1/user/:id', jsonParser, user.delete)
app.get('/faap/v1/user/:id', jsonParser, user.view)
app.get('/faap/v1/user', jsonParser, user.list)

app.post('/faap/v1/:collection', jsonParser, collection.create)
app.patch('/faap/v1/:collection/:id', jsonParser, collection.update)
app.put('/faap/v1/:collection/:id', jsonParser, collection.update)
app.delete('/faap/v1/:collection/:id', collection.delete)
app.get('/faap/v1/:collection', collection.viewItems)
app.get('/faap/v1/:collection/:id', collection.viewItem)

app.get('*', function(req, res) {
  res.redirect(SWAGGER_UI_ENDPOINT)
})

const server = app.listen(config.PORT, function () {
  console.info(`Server started on http://localhost:${config.PORT} at ${new Date()} in ${process.env.NODE_ENV || 'dev'} mode`)
})

module.exports = app
module.exports.server = server
