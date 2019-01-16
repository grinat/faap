const axios = require('axios')

const HandledError = require('../models/HandledError')
const collection = require('../handlers/user').collection

class Auth {
  constructor ({config, db, req}) {
    this._config = config
    this._db = db
    this._req = req
    this.token = ''
    this.user = null
    this._identifyChecked = false
  }

  async isLoggedUser () {
    if (this._identifyChecked !== true) {
      this._authByToken(this._req)
      await this._findIdentify(this._req)
      this._identifyChecked = true
    }
  }

  async _findIdentify (req) {
    if (this._config.USE_INNER_AUTH) {
      this.user = await this._db.collection(collection).findOne({
        token: this.token
      })
      if (!this.user) {
        throw new HandledError('User identify not found', 401)
      }
    } else if (this._config.CHECK_AUTH_URL) {
      const {data} = await axios.get(this._config.CHECK_AUTH_URL, {
        headers: req.headers || {}
      })
      this.user = data
    }
  }

  _authByToken (req) {
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
