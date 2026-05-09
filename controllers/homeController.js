const { prisma } = require('../lib/prisma.js')

/* Show home page */
async function home_page_get(req, res, next) {
  try {
    // Check if user logged in
    if (req.user) {
      const userId = req.user.id

      // Get all folders
      const folders = await prisma.folder.findMany({
        where: {
          userId,
          parentId: null,
        },
        orderBy: {
          createdAt: 'desc'
        }
      })
      // Get all files in root folder
      const files = await prisma.file.findMany({
        where: {
          userId,
          folderId: null,
        },
        orderBy: {
          uploadedAt: 'desc',
        },
      })

      res.render('pages/home', {
        title: 'Home',
        folders,
        files,
      })
    } else { // User not logged in
      res.render('pages/home', {
        title: 'Home',
      })
    }
  } catch (err) {
    console.error(err)
    return next(err)
  }
}

module.exports = home_page_get
