const express = require('express')
const folderRouter = express.Router()
const {
  add_folder_post,
  delete_folder_post,
} = require('../controllers/folderController')

/* Folder routes */
folderRouter.post('/new', add_folder_post)
// Delete a folder
folderRouter.post('/:id/delete', delete_folder_post)

module.exports = folderRouter
