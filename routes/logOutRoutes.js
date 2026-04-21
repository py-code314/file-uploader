const express = require('express')
const { log_out_post } = require('../controllers/logOutController')
const logOutRouter = express.Router()

/* Log out route */
/* Use post method to prevent accidental or malicious logouts */
logOutRouter.post('/', log_out_post)

module.exports = logOutRouter
