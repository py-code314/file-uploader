const fs = require('fs')
const { prisma } = require('../lib/prisma.js')
const { body, validationResult, matchedData } = require('express-validator')
const { getBreadcrumbs } = require('../utils/breadCrumbs.js')
const { getNestedFolderIds } = require('../utils/nestedFolderIds.js')

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
      // Throw error if folder name contains invalid characters
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

      // Throw error if folder name already exists
      let folder

      // When updating
      if (folderId) {
        folder = await prisma.folder.findFirst({
          where: {
            name,
            parentId,
            NOT: {
              // Exclude current folder id
              id: folderId,
            },
          },
        })
      } else {
        // When adding a new folder, there is no current folder id, only parent id
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

/* Show add folder form */
async function add_folder_get(req, res, next) {
  const folderId = Number(req.params.folderId)

  res.render('pages/folderForm', {
    title: 'New Folder',
    folderId,
  })
}

/* Create folder */
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

      // Add folder to database
      await prisma.folder.create({
        data: {
          name,
          userId,
          parentId: folderId,
        },
      })

      if (folderId) { // If adding folder to existing folder
        res.redirect(`/folders/${folderId}`)
      } else { // If adding folder to root
        res.redirect('/')
      }
    } catch (err) {
      console.error(err)
      return next(err)
    }
  },
]

/* Show update folder name form */
async function rename_folder_get(req, res) {
  const folderId = Number(req.params.folderId)
  const userId = req.user.id

  // Get current folder data
  const currentFolder = await prisma.folder.findFirst({
    where: {
      id: folderId,
      userId,
    },
  })
  const parentId = currentFolder.parentId

  // Render form with current folder name
  res.render('pages/folderForm', {
    title: 'Rename Folder',
    currentFolder,
    parentId,
    isRename: true,
  })
}

/* Update folder name */
const rename_folder_post = [
  validateFolderName,

  async (req, res, next) => {
    const folderId = Number(req.params.folderId)
    const userId = req.user.id
    let parentId = null

    // Get current folder data
    const currentFolder = await prisma.folder.findFirst({
      where: {
        id: folderId,
        userId,
      },
    })

    parentId = currentFolder.parentId

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
        title: 'Rename Folder',
        folder: folderData,
        folderId: parentId, // Pass it to be used in Cancel link
        errors: errors.array(),
      })
    }

    try {
      // Get validated form data
      const { name } = matchedData(req)

      // Update folder name
      await prisma.folder.update({
        where: {
          id: folderId,
          userId,
        },
        data: {
          name,
        },
      })

      if (parentId) { // If updating folder name in existing folder
        res.redirect(`/folders/${parentId}`)
      } else { // If updating folder name in root
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

  // Get current folder data
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
    nestedFolderIds.push(folderId) // Add current folder id

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

    // Delete all files in cloudinary
    filesToDelete.forEach(async (file) => {
      await cloudinary.uploader.destroy(file.storedName, {
        resource_type: file.resourceType,
      })
    })


    // Delete folder in db
    // All nested folders and files inside parent folder in database
    // will be deleted because of cascade deletion
    await prisma.folder.delete({
      where: {
        id: folderId,
        userId,
      },
    })

    if (parentId) { // If deleting folder in existing folder
      res.redirect(`/folders/${parentId}`)
    } else { // If deleting folder in root
      res.redirect('/')
    }
  } catch (err) {
    console.error(err)
    return next(err)
  }
}

/* Open folder */
async function open_folder_get(req, res, next) {
  const folderId = Number(req.params.folderId)
  const userId = req.user.id

  // Get current folder data including files and nested folders
  const currentFolder = await prisma.folder.findFirst({
    where: {
      id: folderId,
      userId,
    },
    include: {
      files: {
        orderBy: {
          uploadedAt: 'desc',
        },
      },
      children: {
        orderBy: {
          createdAt: 'desc',
        },
      },
    },
  })

  // Get all parent folders including current folder
  const breadcrumbs = await getBreadcrumbs(folderId, userId)
  // console.log("🚀 ~ open_folder_get ~ breadcrumbs:", breadcrumbs)

  try {
    res.render('pages/folderContent', {
      title: `${currentFolder.name}`,
      folder: currentFolder,
      breadcrumbs,
    })
  } catch (err) {
    console.error(err)
    return next(err)
  }
}

module.exports = {
  add_folder_get,
  add_folder_post,
  rename_folder_get,
  rename_folder_post,
  delete_folder_post,
  open_folder_get,
}
