const express = require('express')
const folderRouter = express.Router()
const { folder_post } = require('../controllers/folderController')

/* Folder routes */
folderRouter.post('/new', folder_post)

module.exports = folderRouter
