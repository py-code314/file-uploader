
const { prisma } = require('../lib/prisma.js')

/* Show home page */
async function home_page_get(req, res, next) {
  try {
    const userId = req.user.id
    // Get all folders
    const folders = await prisma.folder.findMany({
      where: { userId },
    })
    // Get all files in root folder
    const files = await prisma.file.findMany({
      where: { userId },
    })

    res.render('pages/home', {
      title: 'Home',
      folders,
      files
    })
  } catch (err) {
    console.error(err)
    return next(err)
  }
}

module.exports = home_page_get
