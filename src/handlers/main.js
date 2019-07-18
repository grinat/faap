const main = {
  handleError: function (e, res, req, config, status = 500) {
    console.error(
      `${new Date()};${req.path};${JSON.stringify(req.query || {})};`,
      config && config.SHOW_DEBUG_MSG
        ? e
        : e.toString()
    )
    if (e.response && e.response.status) {
      status = e.response.status
    }
    if (e.status) {
      status = e.status
    }
    const out = {
      status: status,
      message: e.toString()
    }
    // if exist validateRequest
    // in meta my be put some additional information,
    // for example, invalid fields
    if (e.meta) {
      out._meta = e.meta
    }
    res.status(status).send(out)
  }
}

module.exports = main
