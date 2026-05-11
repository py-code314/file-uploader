/* Imports */
const { body, validationResult, matchedData } = require('express-validator')
const { prisma } = require('../lib/prisma.js')
const { getBreadcrumbs } = require('../utils/breadCrumbs.js')
const { getNestedFolderIds } = require('../utils/nestedFolderIds.js')
const fs = require('fs')

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
      const folderNameRegex = /^[a-zA-Z0-9\s_-]+$/
      if (!folderNameRegex.test(name)) {
        throw new Error(
          'Folder name can only contain letters, numbers, spaces, underscore and hyphen',
        )
      }

      const folderId = Number(req.params.folderId)
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
      } else {
        // If adding a new folder
        parentId = folderId
      }

      // Throw error if folder already exists
      let folder

      // When updating
      if (folderId) {
        folder = await prisma.folder.findFirst({
          where: {
            name,
            parentId,
            NOT: { // Exclude current folder id
              id: folderId,
            },
          },
        })
      } else { // There is no current folder id, only parent id when adding a new folder
        folder = await prisma.folder.findFirst({
          where: {
            name,
            parentId,
          },
        })
      }
      

      if (folder) {
        throw new Error(`Folder name is ${existsErr}`)
      }

      return true
    }),
]

async function add_folder_get(req, res, next) {
  const folderId = Number(req.params.folderId)

  res.render('pages/folderForm', {
    title: 'New Folder',
    folderId,
  })
}

const add_folder_post = [
  validateFolderName,

  async (req, res, next) => {
    const folderId = Number(req.params.folderId)
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
          parentId: folderId,
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
  const folderId = Number(req.params.folderId)
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
    const folderId = Number(req.params.folderId)
    const userId = req.user.id
    let parentId = null
    // Get folder data
    const folder = await prisma.folder.findFirst({
      where: {
        id: folderId,
        userId,
      },
    })

    parentId = folder.parentId

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
        folderId: parentId, // Pass it to be used in Cancel link
        errors: errors.array(),
      })
    }

    try {
      // Get validated form data
      const { name } = matchedData(req)

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
  },
]

/* Delete folder */
async function delete_folder_post(req, res, next) {
  const folderId = Number(req.params.folderId)
  const userId = req.user.id
  let parentId = null

  // Get folder data
  const currentFolder = await prisma.folder.findFirst({
    where: {
      id: folderId,
      userId,
    },
  })

  parentId = currentFolder.parentId

  try {
    // Get all nested folder ids
    let nestedFolderIds = await getNestedFolderIds(folderId, userId)
    nestedFolderIds.push(folderId)

    // Get all files to be deleted
    const filesToDelete = await prisma.file.findMany({
      where: {
        folderId: {
          in: nestedFolderIds,
        },
      },
      select: {
        url: true,
      },
    })

    // Delete files in uploads folder
    filesToDelete.forEach((file) => {
      const uploadsDir = req.app.get('UPLOAD_PATH')
      const fullPath = uploadsDir + file.url

      fs.unlink(fullPath, (err) => {
        if (err) {
          console.error('Failed to delete file:', err)
        }
      })
    })

    // Delete folder in db
    // All nested folders and files in parent folder will be deleted
    // because of cascade deletion 
    await prisma.folder.delete({
      where: {
        id: folderId,
        userId,
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

async function open_folder_get(req, res, next) {
  const folderId = Number(req.params.folderId)
  const userId = req.user.id

  // Get folder data
  const currentFolder = await prisma.folder.findFirst({
    where: {
      id: folderId,
      userId,
    },
    include: {
      files: {
        orderBy: {
          uploadedAt: 'desc'
        }
      },
      children: {
        orderBy: {
          createdAt: 'desc'
        }
      },
    
    },
    
  })

  const breadcrumbs = await getBreadcrumbs(folderId, userId)
  // console.log("🚀 ~ open_folder_get ~ breadcrumbs:", breadcrumbs)


  try {
    res.render('pages/folderContent', {
      title: `${currentFolder.name}`,
      folder: currentFolder,
      breadcrumbs
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
