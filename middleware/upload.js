const multer = require('multer')
const fs = require('node:fs')
const path = require('node:path')
const {cloudinary} = require('../config/cloudinaryConfig')

// const uploadsDir = './public/uploads'
// // Create upload folder if it doesn't exists
// if (!fs.existsSync(uploadsDir)) {
//   fs.mkdirSync(uploadsDir)
// }

// File storage configuration
// const storage = multer.diskStorage({
//   // Set destination folder for uploads
//   destination: function (req, file, cb) {
//     // console.log("🚀 ~ file:", file)
//     cb(null, uploadsDir)
//   },
//   // Generate unique file name
//   filename: function (req, file, cb) {
//     const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9)
//     const extension = path.extname(file.originalname)
//     const sanitizedName = path
//       .basename(file.originalname, extension)
//       .toLowerCase()
//       .replace(/[^a-z0-9]/g, '-')
//     const uniqueFileName = `${sanitizedName}-${uniqueSuffix}${extension}`
//     cb(null, uniqueFileName)
//   },
// })

// Allow only certain file types
const fileFilter = (req, file, cb) => {
  const fileType = file.mimetype
  const allowedMimeTypes = [
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/pdf',
  ]
  const isAllowed = allowedMimeTypes.includes(fileType)
  const isMedia = /^(image|audio|video)\//.test(fileType)

  if (isAllowed || isMedia) {
    cb(null, true)
  } else {
    cb(new Error('Invalid file type'), false)
  }
}

// Multer instance
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 20 * 1024 * 1024, // 20MB
    files: 5, // Maximum number of files user can upload at a time
  },
  fileFilter,
})

// Function to upload a file to Cloudinary
const uploadToCloudinary = (buffer, options = {}) => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(options, (error, result) => {
        if (error) reject(error)
        else resolve(result)
      })
      .end(buffer)
  })
}

module.exports = {upload, uploadToCloudinary}
