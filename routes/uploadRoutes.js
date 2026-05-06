const express = require('express')
const uploadRouter = express.Router({mergeParams: true})
const {
  upload_file_get,
  upload_file_post,
  update_file_get,
} = require('../controllers/uploadController')
const { isAuth } = require('../routes/auth')
const upload = require('../middleware/upload')

/* New message routes */
uploadRouter.get('/upload', isAuth, upload_file_get) // protected route
uploadRouter.post('/upload', isAuth, upload_file_post)
uploadRouter.get('/:fileId/update', update_file_get)

module.exports = uploadRouter
