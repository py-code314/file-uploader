





/* Show sign up page */
async function sign_up_get(req, res) {
  res.render('pages/signUp', {
    title: 'Sign Up',
  })
}



module.exports = { sign_up_get }
