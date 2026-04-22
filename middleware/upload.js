const multer = require('multer')
const fs = require('node:fs')

const uploadsDir = './public/uploads'
// Create upload folder if it doesn't exists
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir)
}

// File storage configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir)
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '--' + file.originalname)
  },
})

const upload = multer({
  storage,
  limits: {
    fileSize: 20 * 1024 * 1024, // 20MB
    files: 5, // Maximum number of files user can upload at a time
  },
})

module.exports = upload