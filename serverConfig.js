const path = require('path')

module.exports = {
  PORT: process.env.PORT || 3200,
  MONGO_URL: process.env.MONGO_URL || process.env.MONGODB_URI || 'mongodb://localhost:3201/faap',
  CHECK_AUTH_URL: process.env.CHECK_AUTH_URL || null,
  INNER_AUTH_ENABLED: process.env.INNER_AUTH_ENABLED === "true",
  SHOW_DEBUG_MSG: process.env.SHOW_DEBUG_MSG === "true" || false,
  SWAGGER_UI_ENABLED: process.env.SWAGGER_UI_ENABLED === "true",
  UPLOADS_DIR: path.join(__dirname, 'uploads'),
  BASE_API_PATH: process.env.BASE_API_PATH || '/faap/v1/',
  ENABLE_TOOLS: process.env.ENABLE_TOOLS === "true"
}
