const transformers = {
  transformList: function (data = {}, collection = '', req = {}) {
    data.data.map(v => transformers.transformItem(v, collection, req))
    return data
  },
  transformItem: function (item = {}, collection = '', req = {}) {
    return item
  }
}

module.exports = transformers
