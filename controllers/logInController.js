/* Show log in page */
async function log_in_get(req, res) {
  // User is already logged in
  if (req.user) {
    return res.redirect('/')
  }

  // User not logged in
  const messages = req.session.messages || []
  // Get messages from session
  // const successUser = messages.filter((message) =>
  //   message.includes('established'),
  // )
  const errors = messages
    .filter((message) => !message.includes('established'))
    .map((message) => ({ msg: message }))

  // Clear messages
  req.session.messages = []

  res.render('pages/logIn', {
    title: 'Log In',
    successUser,
    errors,
  })
}

module.exports = {log_in_get}