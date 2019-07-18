const axios = require('axios')

const HandledError = require('./HandledError')

class Auth {

  constructor ({config, db, req, checkIdentify}) {
    this._config = config
    this._db = db
    this._req = req
    this._checkIdentifyByCallback = checkIdentify
    this.token = ''
    this.user = null
    this._identifyChecked = false
  }

  async isLoggedUser () {
    if (this._identifyChecked === true) {
     return
    }

    if (this._checkIdentifyByCallback) {
      try {
        await this._checkIdentifyByCallback(this._req, this._config, this._db)
      } catch (e) {
        throw new HandledError('Check identify callback failed', 401)
      }
      this._identifyChecked = true
      return
    }

    await this._findIdentify(this._req)
    this._identifyChecked = true
  }

  async _findIdentify (req) {
    if (this._config.INNER_AUTH_ENABLED) {
      this._findAuthTokenInHeader(this._req)
      this.user = await this._db.collection(this._config.INNER_AUTH_COLLECTION).findOne({
        token: this.token
      })
      if (!this.user) {
        throw new HandledError('User identify not found', 401)
      }
    } else if (this._config.CHECK_AUTH_URL) {
      try {
        const {data} = await axios.get(this._config.CHECK_AUTH_URL, {
          headers: req.headers || {}
        })
        this.user = data
      } catch (e) {
        throw new HandledError('Check identify failed', 401)
      }
    }
  }

  _findAuthTokenInHeader (req) {
    this.token = ''
    if (req.headers.authorization) {
      if (req.headers.authorization.indexOf('Bearer') > -1) {
        let m = req.headers.authorization.match(/Bearer (\w*)/i)
        if (m !== null && m[1]) {
          this.token = m[1]
        }
      } else {
        this.token = req.headers.authorization
      }
      this.token = this.token.toString().trim()
    }
  }

}

module.exports = Auth
