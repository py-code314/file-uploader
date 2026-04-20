const express = require('express')
const logInRouter = express.Router()
const { log_in_get, log_in_post } = require('../controllers/logInController')
const passport = require('passport')

/* Log in routes */
logInRouter.get('/', log_in_get)

// Authenticate user while logging in
logInRouter.post(
  '/',
  log_in_post,
  passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/logIn',
    failureMessage: true,
  }),
)

module.exports = logInRouter
