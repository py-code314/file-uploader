const AuthenticationError = require('../errors/authenticationError')

/* Check for valid user credentials */
const isAuth = (req, res, next) => {
  if (req.isAuthenticated()) {
    next()
  } else {
    throw new AuthenticationError()
  }
}

module.exports = { isAuth }