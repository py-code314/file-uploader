

/* Show home page */
async function home_page_get(req, res, next) {
  try {
    res.render('pages/home', {
      title: 'Home',
    })
  } catch (err) {
    console.error(err)
    return next(err)
  }
}

module.exports = home_page_get
