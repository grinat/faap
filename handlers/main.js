const main = {
  handleError: function (e, res, req = {}, status = 500) {
    console.error('Error', new Date(), e.toString(), ' at ', req.path, JSON.stringify(req.query || {}))
    if (e && e.response && e.response.status) {
      status = e.response.status
    }
    if (e.status) {
      status = e.status
    }
    res.status(status).send({
      status: status,
      message: e.toString()
    })
  }
}

module.exports = main
