const express = require('express')
const homeRouter = express.Router()
const home_page_get = require('../controllers/homeController')

/* Homepage route */
homeRouter.get('/', home_page_get)

module.exports = homeRouter
