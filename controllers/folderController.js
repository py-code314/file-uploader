/* Imports */
const { body, validationResult, matchedData } = require('express-validator')
const { prisma } = require('../lib/prisma.js')

/* Error messages */
const emptyErr = 'can not be empty.'
const existsErr = 'already in use.'

/* Validate form data */
const validateFolderName = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage(`Folder name ${emptyErr}`)
    .custom(async (name) => {
      const folderNameRegex = /^[a-zA-Z0-9\s._-]+$/
      if (!folderNameRegex.test(name)) {
        throw new Error(
          'Folder name can only contain letters, numbers, spaces, period, underscore and hyphen',
        )
      }

      // Throw error if email already exists
      const folder = await prisma.folder.findFirst({
        where: {
          name,
        },
      })
      if (folder) {
        throw new Error(`Folder name is ${existsErr}`)
      }

      return true
    }),
]

const add_folder_post = [
  validateFolderName,

  async (req, res, next) => {
    // Get form data
    const { name } = req.body
    const folderData = {
      name: name,
    }

    // Validate request
    const errors = validationResult(req)

    // Show errors if validation fails
    if (!errors.isEmpty()) {
      return res.status(400).render('pages/home', {
        title: 'Create Folder',
        folder: folderData,
        errors: errors.array(),
      })
    }

    try {
      // Get validated form data

      const { name } = matchedData(req)
      // const user = req.user
      const userId = req.user.id
      // console.log("🚀 ~ req:", req)

      await prisma.folder.create({
        data: {
          name,
          userId,
        },
      })

      res.redirect('/')
    } catch (err) {
      console.error(err)
      return next(err)
    }
  },
]

/* Delete folder */
async function delete_folder_post(req, res, next) {
  const id = Number(req.params.id)
  // console.log('🚀 ~ genre_delete_post ~ id:', id)
  const userId = req.user.id

  try {
    // Delete folder
    await prisma.folder.delete({
      where: {
        id,
        userId
      },
    })
    res.redirect('/')
  } catch (err) {
    console.error(err)
    return next(err)
  }
}

module.exports = { add_folder_post, delete_folder_post }
