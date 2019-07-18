class HandledError extends Error {
  constructor (msg, statusCode = 500) {
    super(msg)
    this.status = statusCode
    this.meta = null
  }
}

module.exports = HandledError
