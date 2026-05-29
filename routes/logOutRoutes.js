const express = require('express')
const logOutRouter = express.Router()
const { log_out_post } = require('../controllers/logOutController')

/* Log out route */
/* Use post method to prevent accidental or malicious logouts */
logOutRouter.post('/', log_out_post)

module.exports = logOutRouter
