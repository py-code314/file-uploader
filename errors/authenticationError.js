/* Throw custom error if user is not authenticated */
class AuthenticationError extends Error {
  constructor(
    message = 'Please log in to upload a file.',
    title = 'Identification Required',
  ) {
    super(message)
    this.statusCode = 401
    this.name = 'AuthenticationError'
    this.title = title
  }
}

module.exports = AuthenticationError
