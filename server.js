const express = require('express')
const faap = require('./src')

const config = require('./serverConfig')

const app = express()

function initAndRun(config, callbacks) {
  app.use(faap(config, callbacks))

  app.get('*', function(req, res) {
    res.redirect(config.BASE_API_PATH + 'docs/swagger')
  })

  return app.listen(config.PORT, function () {
    console.info(`Server started on http://localhost:${config.PORT} at ${new Date()} in ${process.env.NODE_ENV || 'dev'} mode`)
  })
}

if (process.env.NODE_ENV !== 'testing') {
  initAndRun(config)
}

module.exports = app
module.exports.initAndRun = initAndRun
