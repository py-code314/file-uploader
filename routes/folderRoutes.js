const express = require('express')
const folderRouter = express.Router()

const {
  add_folder_get,
  add_folder_post,
  update_folder_get,
  update_folder_post,
  delete_folder_post,
  open_folder_get,
} = require('../controllers/folderController')

/* Folder routes */
folderRouter.post('/new', add_folder_post)
folderRouter.get('/new', add_folder_get)
folderRouter.get('/:folderId/update', update_folder_get)
folderRouter.post('/:folderId/update', update_folder_post)
folderRouter.post('/:folderId/delete', delete_folder_post)
folderRouter.get('/:folderId/new', add_folder_get)
folderRouter.post('/:folderId/new', add_folder_post)
folderRouter.get('/:folderId', open_folder_get)
// ? No route to get all folders - folderRouter.get('/', all_folders_get)



module.exports = folderRouter
