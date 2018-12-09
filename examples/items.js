// create axios instanse with base api url
const http = axios.create({
  baseURL: 'https://faap-app.herokuapp.com/faap/v1/'
})
// notify about requests
http.interceptors.request.use(function (config) {
  let msg = `${config.method.toUpperCase()} ${config.baseURL}${config.url}`
  console.warn(msg)
  // vm.$toast.open(msg)
  return config
}, function (error) {
  return Promise.reject(error)
})

// example of added item
class Item {
  constructor () {
    this.first_name = ''
    this.photo = ''
    this.age = ''
    this.gender = null
  }
}

// form for add additional field to item
class CustomFieldForm {
  constructor () {
    this.title = ''
    this.name = ''
  }
}

// form for change collection
class CollectionForm {
  constructor (name) {
    this.name = name
  }
}

class FilterForm {
  constructor () {
    this.q = ''
    this.checkboxGroup = []
  }
}

const vm = new Vue({
  el: '#app',
  data: {
    item: new Item(),
    customFieldForm: new CustomFieldForm(),
    customFields: [],
    showCustomFieldForm: false,
    // collection name is dynamic
    collection: 'author',
    collectionForm: new CollectionForm('author'),
    collectionOpenForEdit: false,
    filterForm: new FilterForm(),
    data: [],
    openedDetailed: [],
    total: 0,
    loading: false,
    saving: false,
    q: '',
    sortField: 'id',
    sortOrder: 'desc',
    defaultSortOrder: 'desc',
    page: 1,
    perPage: 5,
    filter: {}
  },
  methods: {
    fetchData () {
      this.loading = true
      let q = `page=${this.page}&per-page=${this.perPage}&sort=${this.sortedBy}&q=${this.q}`
      for (let fName in this.filter) {
        q += `&filter[${fName}]=${this.filter[fName]}`
      }
      return http.get(`${this.collection}?${q}`)
        .then(({data: {data, _meta}}) => {
          this.loading = false
          // convert data for https://buefy.github.io/documentation/table
          this.data = data
          this.total = _meta.totalCount
          this.page = _meta.currentPage
          this.perPage = _meta.perPage
          return {data, _meta}
        })
        .catch(e => {
          this.loading = false
          this.$toast.open(e.toString())
          return Promise.reject(e)
        })
    },
    saveItem: async function () {
      if (this.saving === true) {
        return
      }
      try {
        this.saving = true
        // create data for fulltext search
        let searchBody = ''
        for (let fName in this.item) {
          // skip base64 data
          if (this.item[fName].toString().startsWith('data:')) {
            continue
          }
          searchBody += ` ${this.item[fName].toString()} `
        }
        // convert to num for use from to stetemnt in filter
        this.item.age = +this.item.age
        // save
        const {data} = await http.post(
          `${this.collection}`,
          Object.assign({
            searchBody
          }, this.item)
        )
        // refetch data
        this.resetTableFilters()
        this.sort('id', 'asc')
        await this.fetchData()
        this.openedDetailed.push(data.id)
        this.item = new Item()
      } catch (e) {
        this.$toast.open(e.toString())
      } finally {
        this.saving = false
      }
    },
    removeItem (id) {
      http.delete(`${this.collection}/${id}`)
        .then(() => {
          this.$toast.open('Removed')
          this.fetchData()
        })
        .catch(e => this.$toast.open(e.toString()))
    },
    onRemove ({id}) {
      this.$snackbar.open({
        message: 'Are you sure?',
        type: 'is-danger',
        position: 'is-top',
        actionText: 'Yes',
        onAction: () => this.removeItem(id)
      })
    },
    resetTableFilters () {
      this.page = 1
      this.filter = {}
      this.q = ''
      this.filterForm = new FilterForm()
    },
    saveCustomFieldForm () {
      this.customFields.push(Object.assign({}, this.customFieldForm))
      this.customFieldForm = new CustomFieldForm()
    },
    saveCollectionForm () {
      this.collection = `${this.collectionForm.name}`
      this.collectionOpenForEdit = false
      this.pageChange(1)
    },
    pageChange(page) {
      this.page = page
      return this.fetchData()
    },
    sort(field, order) {
      this.sortField = field
      this.sortOrder = order
      return this.fetchData()
    },
    onFilter () {
      this.page = 1
      this.q = `${this.filterForm.q}`
      this.filter = {}
      if (this.filterForm.checkboxGroup.length) {
        this.filterForm.checkboxGroup.forEach(v => {
          let [fName, fVal] = v.split('=')
          this.filter[fName] = fVal
        })
      }
      this.fetchData()
    },
    processImage: async function (evt) {
      try {
        this.item.photo = await new BrowserImageManipulation()
          .loadBlob(evt.target.files[0])
          .toCircle(128, {bgColor: 'rgba(255, 255, 255, 0)'})
          .saveAsImage('image/png')
      } catch (e) {
        this.$toast.open(e.toString())
      }
    }
  },
  created () {
    this.fetchData()
  },
  computed: {
    userPhotoDefault () {
      return 'https://buefy.github.io/static/img/placeholder-128x128.png'
    },
    sortedBy () {
      return `${this.sortOrder === 'desc' ? '' : '-'}${this.sortField}`
    }
  }
})
