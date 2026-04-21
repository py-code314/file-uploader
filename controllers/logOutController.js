/* Log out the user */
async function log_out_post(req, res, next) {
  req.logout((err) => {
    if (err) {
      return next(err)
    }
    res.redirect('/logIn')
  })
}

module.exports = {log_out_post}