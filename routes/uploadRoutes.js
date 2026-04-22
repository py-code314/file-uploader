const express = require('express')
const uploadRouter = express.Router()
const { upload_get, upload_post } = require('../controllers/uploadRouter')
const { isAuth } = require('../routes/auth')

/* New message routes */
uploadRouter.get('/upload', isAuth, upload_get) // protected route
uploadRouter.post('/upload', isAuth, upload_post)

module.exports = uploadRouter
