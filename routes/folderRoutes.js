const express = require('express')
const folderRouter = express.Router()
// Import fileRouter
const fileRouter = require('./fileRoutes')

const {
  add_folder_get,
  add_folder_post,
  update_folder_get,
  update_folder_post,
  delete_folder_post,
  open_folder_get,
} = require('../controllers/folderController')
const { isAuth } = require('./auth')

folderRouter.use(isAuth)

/* Folder routes */
folderRouter.post('/new', add_folder_post)
folderRouter.get('/new', add_folder_get)
folderRouter.get('/:folderId/update', update_folder_get)
folderRouter.post('/:folderId/update', update_folder_post)
folderRouter.post('/:folderId/delete', delete_folder_post)
folderRouter.get('/:folderId/new', add_folder_get)
folderRouter.post('/:folderId/new', add_folder_post)
folderRouter.get('/:folderId', open_folder_get)

folderRouter.use('/:folderId/files', fileRouter)

module.exports = folderRouter
