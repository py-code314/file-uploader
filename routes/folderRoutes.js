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
folderRouter.get('/:id/update', update_folder_get)
folderRouter.post('/:id/update', update_folder_post)
folderRouter.post('/:id/delete', delete_folder_post)
folderRouter.get('/:id/new', add_folder_get)
folderRouter.post('/:id/new', add_folder_post)
folderRouter.get('/:id', open_folder_get)



module.exports = folderRouter
