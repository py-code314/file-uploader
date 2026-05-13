const path = require('node:path')
const { uploadToCloudinary } = require('../middleware/upload')

async function uploadFiles(files) {
  const uploadPromises = files.map((file) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9)
    const extension = path.extname(file.originalname)
    const sanitizedName = path
      .basename(file.originalname, extension)
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
    let uniqueFileName = `${sanitizedName}-${uniqueSuffix}`
    if (extension === '.doc' || extension === '.docx') {
      uniqueFileName = `${sanitizedName}-${uniqueSuffix}${extension}`
    }

    return uploadToCloudinary(file.buffer, {
      resource_type: 'auto',
      asset_folder: 'file-uploader',
      public_id: uniqueFileName, // Define custom public id
      filename_override: file.originalname,
    })
  })

  const results = await Promise.all(uploadPromises)

  return results
}

module.exports = uploadFiles
