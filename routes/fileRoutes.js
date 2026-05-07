const express = require('express')
const fileRouter = express.Router({ mergeParams: true })
const {
  upload_file_get,
  upload_file_post,
  update_file_get,
  update_file_post,
  delete_file_post,
  download_file_get,
} = require('../controllers/fileController')
const { isAuth } = require('./auth')
const upload = require('../middleware/upload')

/* New message routes */
fileRouter.get('/upload', isAuth, upload_file_get) // protected route
fileRouter.post('/upload', isAuth, upload_file_post)
fileRouter.get('/:fileId/update', update_file_get)
fileRouter.post('/:fileId/update', update_file_post)

fileRouter.post('/:fileId/delete', delete_file_post)
fileRouter.get('/:fileId/download', download_file_get)

module.exports = fileRouter
