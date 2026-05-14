const multer = require('multer')
const { upload, uploadToCloudinary } = require('../middleware/upload')
const { prisma } = require('../lib/prisma')
const { body, validationResult, matchedData } = require('express-validator')
const path = require('node:path')
const { getModifiedFileName } = require('../utils/modifyFileName')
const fs = require('fs')

const https = require('https')
const { getBreadcrumbs } = require('../utils/breadCrumbs.js')
const uploadFiles = require('../utils/uploadFiles.js')
const handleMulterErrors = require('../utils/multerErrors.js')

/* Error messages */
const emptyErr = 'can not be empty.'
const existsErr = 'already in use.'

/* Validate form data */
const validateFileName = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage(`File name ${emptyErr}`)
    .bail()
    .custom(async (name, { req }) => {
      const fileId = Number(req.params.fileId)
      const userId = req.user.id
      let folderId = null

      // Get folder id if updating
      if (req.originalUrl.includes('/update')) {
        const currentFile = await prisma.file.findFirst({
          where: {
            id: fileId,
            userId,
          },
          select: {
            folderId: true,
          },
        })
        folderId = currentFile.folderId
      }

      // Throw error if file already exists
      const fileNameExists = await prisma.file.findFirst({
        where: {
          name,
          folderId,
          NOT: {
            id: fileId,
          },
        },
      })

      if (fileNameExists) {
        throw new Error(`File name is ${existsErr}`)
      }

      return true
    }),
]

/* Show file upload form */
async function upload_file_get(req, res) {
  const folderId = Number(req.params.folderId)

  res.render('pages/fileForm', {
    title: 'Upload File',
    folderId,
  })
}

async function upload_file_post(req, res, next) {
  // Manually invoke multer middleware function
  const uploadHandler = upload.array('fileUpload', 5)

  uploadHandler(req, res, async function (err) {
    try {
      // Handle Multer errors

      if (err instanceof multer.MulterError) {
        const errorInfo = await handleMulterErrors(req.files, err)

        return res.status(errorInfo.status).render('pages/fileForm', {
          title: 'Upload File',
          errors: [{ msg: errorInfo.message }],
        })
      }
      // Invalid file type, message will return from fileFilter callback
      else if (err) {
        return res.status(415).render('pages/fileForm', {
          title: 'Upload File',
          errors: [{ msg: err.message }],
        })
      }

      // Check for files length
      else if (!req.files.length) {
        return res.status(400).render('pages/fileForm', {
          title: 'Upload File',
          errors: [{ msg: 'Choose at least one file to upload.' }],
        })
      }

      // Upload files to cloudinary
      const results = await uploadFiles(req.files)

      const folderId = req.params.folderId ? Number(req.params.folderId) : null
      const userId = req.user.id

      // Add file data to db
      for (const result of results) {
        const extension = result.format || result.url.split('.').pop()
        const fullName = `${result.original_filename}.${extension}`

        // Check for same file name
        const modifiedFileName = await getModifiedFileName(
          fullName,
          folderId,
          userId,
        )

        await prisma.file.create({
          data: {
            name: modifiedFileName,
            storedName: result.public_id,
            size: result.bytes,
            type: extension,
            url: result.secure_url,
            userId: userId,
            folderId: folderId,
          },
        })
      }

      // Successful upload
      if (folderId) {
        res.redirect(`/folders/${folderId}`)
      } else {
        res.redirect('/')
      }
    } catch (err) {
      console.error(err)
      return next(err)
    }
  })
}

async function update_file_get(req, res, next) {
  const fileId = Number(req.params.fileId)
  const userId = req.user.id
  const folderId = Number(req.params.folderId)

  // Get file data
  const currentFile = await prisma.file.findFirst({
    where: {
      id: fileId,
      userId,
      folderId,
    },
  })
  const originalName = currentFile.name
  const extension = path.extname(originalName)
  const baseName = path.basename(originalName, extension)

  res.render('pages/fileUpdateForm', {
    title: 'Update File',
    fileName: baseName,
    fileId,
    folderId,
    isUpdate: true,
  })
}

/* Update file name */
const update_file_post = [
  validateFileName,

  async (req, res, next) => {
    const fileId = Number(req.params.fileId)
    const userId = req.user.id
    let folderId = null

    // Get folder id
    const currentFile = await prisma.file.findFirst({
      where: {
        id: fileId,
        userId,
      },
    })

    folderId = currentFile.folderId
    const originalName = currentFile.name
    const extension = path.extname(originalName)

    // Get form data
    const { name } = req.body
    const fileName = name

    // Validate request
    const errors = validationResult(req)

    // Show errors if validation fails
    if (!errors.isEmpty()) {
      return res.status(400).render('pages/fileUpdateForm', {
        title: 'Update file',
        fileName,
        fileId: currentFile.id,
        folderId, // Pass it to be used in Cancel link
        errors: errors.array(),
      })
    }

    try {
      // Get validated form data
      const { name } = matchedData(req)
      const fullName = `${name}${extension}`

      // Update file name
      await prisma.file.update({
        where: {
          id: fileId,
          userId,
        },
        data: {
          name: fullName,
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

/* Delete file */
async function delete_file_post(req, res, next) {
  const fileId = Number(req.params.fileId)
  const userId = req.user.id
  let folderId = null

  // Get folder data
  const currentFile = await prisma.file.findFirst({
    where: {
      id: fileId,
      userId,
    },
  })

  folderId = currentFile.folderId

  try {
    // Delete file data in db
    await prisma.file.delete({
      where: {
        id: fileId,
        userId,
      },
    })

    // Delete file in uploads folder
    if (currentFile) {
      const fileName = currentFile.storedName
      const uploadsDir = req.app.get('UPLOAD_PATH')
      const fullPath = uploadsDir + currentFile.url

      fs.unlink(fullPath, (err) => {
        if (err) {
          console.error('Failed to delete file:', err)
        }
      })
    }

    if (folderId) {
      res.redirect(`/folders/${folderId}`)
    } else {
      res.redirect('/')
    }
  } catch (err) {
    console.error(err)
    return next(err)
  }
}

// Download file
async function download_file_get(req, res, next) {
  console.log('download file')
  const fileId = Number(req.params.fileId)
  const userId = req.user.id
  const folderId = Number(req.params.folderId)

  try {
    const currentFile = await prisma.file.findFirst({
      where: {
        id: fileId,
        userId,
      },
      select: {
        name: true,
        url: true,
      },
    })

    if(!currentFile) throw new Error('File not found')

    const downloadUrl = currentFile.url.replace('/upload/', '/upload/fl_attachment/')

    res.redirect(downloadUrl)
  } catch (err) {
    console.error(err)
    next(err)
  }
}

async function open_file_get(req, res, next) {
  const fileId = Number(req.params.fileId)
  const folderId = Number(req.params.folderId)
  const userId = req.user.id

  // Get file data
  const currentFile = await prisma.file.findFirst({
    where: {
      id: fileId,
      folderId,
      userId,
    },
  })

  let breadcrumbs = []
  // Run getBreadcrumbs only if folder id is a number to prevent error
  // folderId must be a number for prisma.create() to work
  if (folderId) {
    breadcrumbs = await getBreadcrumbs(folderId, userId)
  }

  try {
    res.render('pages/fileDetails', {
      title: `${currentFile.name}`,
      file: currentFile,
      breadcrumbs,
    })
  } catch (err) {
    console.error(err)
    return next(err)
  }
}

module.exports = {
  upload_file_get,
  upload_file_post,
  update_file_get,
  update_file_post,
  delete_file_post,
  download_file_get,
  open_file_get,
}
