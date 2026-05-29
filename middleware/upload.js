const multer = require('multer')
const fs = require('node:fs')
const path = require('node:path')
const { cloudinary } = require('../config/cloudinaryConfig')

/* Limit file types to be uploaded */
const fileFilter = (req, file, cb) => {
  const fileType = file.mimetype
  // Allow word and pdf files
  const allowedMimeTypes = [
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/pdf',
  ]
  const isAllowed = allowedMimeTypes.includes(fileType)
  // Allow image, audio and video files
  const isMedia = /^(image|audio|video)\//.test(fileType)

  if (isAllowed || isMedia) {
    cb(null, true)
  } else { // Throw error if file type is not allowed
    cb(new Error('Invalid file type'), false)
  }
}

// Multer instance
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 20 * 1024 * 1024, // Max file size is 20MB
    files: 5, // Maximum number of files user can upload at a time
  },
  fileFilter, // Filter file types
})

/* Function to upload a file to Cloudinary */
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

module.exports = { upload, uploadToCloudinary }
