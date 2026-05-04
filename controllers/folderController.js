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
    .bail()
    .custom(async (name, { req }) => {
      const folderNameRegex = /^[a-zA-Z0-9\s._-]+$/
      if (!folderNameRegex.test(name)) {
        throw new Error(
          'Folder name can only contain letters, numbers, spaces, period, underscore and hyphen',
        )
      }

      const folderId = Number(req.params.id)
      const userId = req.user.id
      let parentId = null

      // Get parent id if updating
      if (req.originalUrl.includes('/update')) {
        const currentFolder = await prisma.folder.findFirst({
          where: {
            id: folderId,
            userId,
          },
        })
        parentId = currentFolder.parentId
      } else { // If adding a new folder
        parentId = folderId
      }

      // Throw error if folder already exists
      const folder = await prisma.folder.findFirst({
        where: {
          name,
          parentId
        },
      })

      if (folder) {
        throw new Error(`Folder name is ${existsErr}`)
      }

      return true
    }),
]

async function add_folder_get(req, res, next) {
  const folderId = Number(req.params.id)

  res.render('pages/folderForm', {
    title: 'New Folder',
    folderId
  })
}

const add_folder_post = [
  validateFolderName,

  async (req, res, next) => {
    const folderId = Number(req.params.id)
    // Get form data
    const { name } = req.body
    const folderData = {
      name: name,
    }
    

    // Validate request
    const errors = validationResult(req)

    // Show errors if validation fails
    if (!errors.isEmpty()) {
      return res.status(400).render('pages/folderForm', {
        title: 'Create Folder',
        folder: folderData,
        folderId,
        errors: errors.array(),
      })
    }

    try {
      // Get validated form data
      const { name } = matchedData(req)
      const userId = req.user.id

      await prisma.folder.create({
        data: {
          name,
          userId,
          parentId: folderId
        },
      })

      if (folderId) {
        res.redirect(`/folders/${folderId}`)
      } else {
        res.redirect('/')
      }
    } catch (err) {
      console.error(err)
      return next(err)
    }
  },
]

/* Show update folder form */
async function update_folder_get(req, res) {
  const folderId = Number(req.params.id)
  const userId = req.user.id

  // Get folder data
  const folder = await prisma.folder.findFirst({
    where: {
      id: folderId,
      userId,
    },
  })
  const parentId = folder.parentId

  res.render('pages/folderForm', {
    title: 'Update Folder',
    folder,
    parentId,
    isUpdate: true,
  })
}

/* Update folder name */
const update_folder_post = [
  validateFolderName,

  async (req, res, next) => {
    const folderId = Number(req.params.id)
    
    

    // Get form data
    const { name } = req.body
    const folderData = {
      name: name,
    }

    // Validate request
    const errors = validationResult(req)

    // Show errors if validation fails
    if (!errors.isEmpty()) {
      return res.status(400).render('pages/folderForm', {
        title: 'Update Folder',
        folder: folderData,
        folderId,
        errors: errors.array(),
      })
    }

    try {
      // Get validated form data
      const { name } = matchedData(req)
      const userId = req.user.id

      // Get folder data
      const folder = await prisma.folder.findFirst({
        where: {
          id: folderId,
          userId,
        },
      })
      const parentId = folder.parentId
      

      // Update folder
      await prisma.folder.update({
        where: {
          id: folderId,
          userId,
        },
        data: {
          name,
        },
      })
      
      if (parentId) {
        res.redirect(`/folders/${parentId}`)
      } else {
        res.redirect('/')
      }
    } catch (err) {
    console.error(err)
    return next(err)
  }
  }
]

/* Delete folder */
async function delete_folder_post(req, res, next) {
  const id = Number(req.params.id)

  const userId = req.user.id

  try {
    // Delete folder
    await prisma.folder.delete({
      where: {
        id,
        userId,
      },
    })
    res.redirect('/')
  } catch (err) {
    console.error(err)
    return next(err)
  }
}

async function open_folder_get(req, res, next) {
  const folderId = Number(req.params.id)
  const userId = req.user.id

  // Get all folders
  const folders = await prisma.folder.findMany({
    where: { userId },
  })

  // Get folder data
  const folder = await prisma.folder.findFirst({
    where: {
      id: folderId,
      userId,
    },
    include: {
      files: true,
      children: true,
    },
  })


  try {
    // Show folder contents
    // res.render('pages/home', {
    //   title: `Home | ${folder.name}`,
    //   folder
    // })
    res.render('pages/folderContent', {
      title: `${folder.name}`,
      folder,
    })
  } catch (err) {
    console.error(err)
    return next(err)
  }
}

module.exports = {
  add_folder_get,
  add_folder_post,
  update_folder_get,
  update_folder_post,
  delete_folder_post,
  open_folder_get,
}
