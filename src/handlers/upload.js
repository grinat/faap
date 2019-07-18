const path = require('path')

const utils = require('../utils/utils')
const HandledError = require('../models/HandledError')
const collection = 'upload'

const uploadHandlers = {
  file: async function (req, res, injected) {
    const {files} = req
    const {config, auth, callbacks} = injected

    await auth.isLoggedUser()

    if (!config.UPLOADS_DIR) {
      throw new HandledError('Upload folder is not set')
    }

    const data = {}
    for (let fileKey in files) {
      const {name, mimetype, mv, truncated, md5} = files[fileKey]

      if (truncated === true) {
        throw utils.createErrWithInvalidFields({
          [fileKey]: `File bigger than ${(config.UPLOADS_SIZE_LIMIT / 1024 / 1024).toFixed(2)}Mb`
        })
      }

      if (config.UPLOADS_ACCEPTED_MIMES.includes(mimetype) === false) {
        throw utils.createErrWithInvalidFields({
          [fileKey]: `${mimetype} is invalid`
        })
      }

      const ext = name.split('.').pop()
      const fileMd5 = md5()
      const fileName = `${fileMd5}.${ext}`

      const subDirsInUploadDir = `${fileMd5.split('').slice(0, 3).join('/')}`
      const absolutePathWithSubDirs = path.join(config.UPLOADS_DIR, subDirsInUploadDir)
      const fullFilePath = path.join(absolutePathWithSubDirs, fileName)

      await utils.createFolderAndSubfolders(absolutePathWithSubDirs)
      await mv(fullFilePath)

      data[fileKey] = {
        name,
        mimetype,
        fileName,
        fileMd5,
        relativeFilePath: `${path.join(subDirsInUploadDir, fileName)}`,
        relativeUrl: `${config.BASE_API_PATH}uploads/${path.join(subDirsInUploadDir, fileName)}`
      }
    }


    res.status(201).send(callbacks.transformItem
      ? callbacks.transformItem(data, collection, req)
      : data
    )
  }
}

module.exports = uploadHandlers
