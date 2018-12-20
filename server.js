const express = require('express')
const faap = require('./index')

const config = require('./config')

const app = express()

app.use(faap(config))

app.get('*', function(req, res) {
  res.redirect(config.BASE_API_PATH + 'docs/swagger')
})

const server = app.listen(config.PORT, function () {
  console.info(`Server started on http://localhost:${config.PORT} at ${new Date()} in ${process.env.NODE_ENV || 'dev'} mode`)
})

module.exports = app
module.exports.server = server
