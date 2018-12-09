const md5 = require('md5')

const config = require('../config')

const utils = {
  getSort: function (query = {}) {
    let sort = query.sort || 'id'
    let sortDir = 'asc'
    if (sort.startsWith('-')) {
      sortDir = 'desc'
      sort = query.sort.substring(1, query.sort.length)
    }
    return {
      sort,
      sortDir,
      mongoSort: (sortDir === 'asc' ? 1 : -1)
    }
  },
  buildPaginateData: function (query, count) {
    let totalCount = +count
    let perPage = +query['per-page'] || 20
    let currentPage = +query.page || 1
    let pageCount = count > 0
      ? Math.floor(count / perPage) + 1
      : 1
    if (currentPage > pageCount) currentPage = +pageCount
    let skip = perPage * (currentPage - 1)
    if (query['per-page'] == -1) {
      currentPage = 1
      skip = 0
      perPage = totalCount
      pageCount = totalCount
    }
    return {
      perPage,
      currentPage,
      pageCount,
      totalCount,
      skip
    }
  },
  buildGridData: function (collection, data = [], query = {}, count) {
    let {sort, sortDir} = this.getSort(query)
    let _meta = {
      sort: {[sort]: sortDir},
      ...this.buildPaginateData(query, count)
    }
    return {
      data,
      _meta,
      _links: {}
    }
  },
  buildSearchObject: function (collection, query = {}) {
    let find = {}
    if (query.q) {
      find.searchBody = {
        $regex: `${query.q}`, $options: 'i'
      }
    }
    if (query.filter) {
      for (let fieldName in query.filter) {
        if (fieldName.startsWith('_')) continue
        // from statement
        if (fieldName.startsWith('from_')) {
          this.setObjInSearch(find, fieldName, {
            $gte: this.typeReduction(query.filter[fieldName])
          }, 'from_')
          continue
        }
        // to statement
        if (fieldName.startsWith('to_')) {
          this.setObjInSearch(find, fieldName, {
            $lte: this.typeReduction(query.filter[fieldName])
          }, 'to_')
          continue
        }
        this.setObjInSearch(find, fieldName,
          this.typeReduction(query.filter[fieldName])
        )
      }
    }
    return find
  },
  setObjInSearch: function (obj, key, val, replacer = null) {
    let name = key
    if (replacer) {
      name = name.replace(replacer, '')
    }
    if (!obj[name]) {
      obj[name] = {}
    }
    if (typeof val === 'object') {
      obj[name] = Object.assign(obj[name], val)
    } else {
      obj[name] = val
    }
  },
  typeReduction: function (val) {
    if (isNaN(val)) {
      return val.toString()
    }
    return +val
  },
  getGeneratedToken: function () {
    return md5(+new Date() + Math.random())
  },
  getPassHashByPass: function (password) {
    return md5(config.SALT + password.toString().trim())
  }
}

module.exports = utils
