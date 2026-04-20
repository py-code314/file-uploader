const express = require('express')
const logOutRouter = express.Router()

/* Log out route */
/* Use post method to prevent accidental or malicious logouts */
logOutRouter.post('/', (req, res, next) => {
  req.logout((err) => {
    if (err) {
      return next(err)
    }
    res.redirect('/logIn')
  })
})

module.exports = logOutRouter
