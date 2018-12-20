module.exports = {
  PORT: process.env.PORT || 3200,
  MONGO_URL: process.env.MONGO_URL || 'mongodb://localhost:3201/faap',
  CHECK_AUTH_URL: process.env.CHECK_AUTH_URL || null,
  USE_INNER_AUTH: process.env.USE_INNER_AUTH === "true",
  SALT: 'w@N:X+nG Fhu!N~PW|>,Wyl1M8)4[&so1-=&Pd8aO+wkIn;,:;gi4n<+aZGH-|.Q',
  BODY_SIZE_LIMIT: process.env.BODY_SIZE_LIMIT || '4mb',
  BASE_API_PATH: process.env.BASE_API_PATH || '/faap/v1/',
  SHOW_DEBUG_MSG: process.env.SHOW_DEBUG_MSG === "true" || true
}
