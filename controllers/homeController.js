
const { prisma } = require('../lib/prisma.js')

/* Show home page */
async function home_page_get(req, res, next) {
  try {
    const userId = req.user.id
    const folders = await prisma.folder.findMany({
      where: { userId },
    })

    res.render('pages/home', {
      title: 'Home',
      folders,
    })
  } catch (err) {
    console.error(err)
    return next(err)
  }
}

module.exports = home_page_get
