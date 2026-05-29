const multer = require('multer')
const path = require('node:path')
const { prisma } = require('../lib/prisma')
const { cloudinary } = require('../config/cloudinaryConfig')
const { upload, uploadToCloudinary } = require('../middleware/upload')
const { body, validationResult, matchedData } = require('express-validator')

/* Import helper functions */
const { getModifiedFileName } = require('../utils/modifyFileName')
// const fs = require('fs')
// const https = require('https')
const { getBreadcrumbs } = require('../utils/breadCrumbs')
const uploadFiles = require('../utils/uploadFiles')
const handleMulterErrors = require('../utils/multerErrors')
const generateFilePreview = require('../utils/filePreview')

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
      // Check if file name already exists in database
      const fileId = Number(req.params.fileId)
      const userId = req.user.id
      let folderId = null

      // Get folder id if renaming a file
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

      // Throw error if file name already exists
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

/* Upload files to cloudinary and save to db */
async function upload_file_post(req, res, next) {
  // Manually invoke multer middleware function
  const uploadHandler = upload.array('fileUpload', 5)

  uploadHandler(req, res, async function (err) {
    try {
      // Handle Multer errors
      if (err instanceof multer.MulterError) {
        // Get error information based on Multer error
        const errorInfo = await handleMulterErrors(req.files, err)

        return res.status(errorInfo.status).render('pages/fileForm', {
          title: 'Upload File',
          errors: [{ msg: errorInfo.message }],
        })
      } else if (err) {
        // Invalid file type, message will return from fileFilter callback
        return res.status(415).render('pages/fileForm', {
          title: 'Upload File',
          errors: [{ msg: err.message }],
        })
      } else if (!req.files.length) {
        // Check for files length
        return res.status(400).render('pages/fileForm', {
          title: 'Upload File',
          errors: [{ msg: 'Choose at least one file to upload.' }],
        })
      }

      // Upload files to cloudinary
      const results = await uploadFiles(req.files)
      // console.log('🚀 ~ upload_file_post ~ results:', results)

      const folderId = req.params.folderId ? Number(req.params.folderId) : null
      const userId = req.user.id

      // Add files to db
      for (const result of results) {
        const extension = result.format || result.url.split('.').pop()
        const fullName = `${result.original_filename}.${extension}`

        // Add a number next to file name if file name already exists
        const modifiedFileName = await getModifiedFileName(
          fullName,
          folderId,
          userId,
        )

        // Add file data to db
        await prisma.file.create({
          data: {
            name: modifiedFileName,
            storedName: result.public_id,
            size: result.bytes,
            type: extension,
            resourceType: result.resource_type,
            url: result.secure_url,
            userId: userId,
            folderId: folderId,
          },
        })
      }

      // Successful upload
      if (folderId) {
        // If file is uploaded to a sub-folder
        res.redirect(`/folders/${folderId}`)
      } else {
        // If file is uploaded to root folder
        res.redirect('/')
      }
    } catch (err) {
      console.error(err)
      return next(err)
    }
  })
}

/* Show file rename form */
async function rename_file_get(req, res, next) {
  const fileId = Number(req.params.fileId)
  const userId = req.user.id
  const folderId = Number(req.params.folderId)

  // Get current file data
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

  // Render file rename form with current file data
  res.render('pages/fileRenameForm', {
    title: 'Rename File',
    fileName: baseName,
    fileId,
    folderId,
    isRename: true,
  })
}

/* Update file name */
const rename_file_post = [
  validateFileName,

  async (req, res, next) => {
    const fileId = Number(req.params.fileId)
    const userId = req.user.id
    let folderId = null

    // Get current file data
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
        // If file is uploaded to a sub-folder
        res.redirect(`/folders/${folderId}`)
      } else {
        // If file is uploaded to root folder
        res.redirect('/')
      }
    } catch (err) {
      console.error(err)
      return next(err)
    }
  },
]

/* Delete a file */
async function delete_file_post(req, res, next) {
  const fileId = Number(req.params.fileId)
  const userId = req.user.id
  let folderId = null

  // Get current file data
  const currentFile = await prisma.file.findFirst({
    where: {
      id: fileId,
      userId,
    },
    select: {
      storedName: true,
      resourceType: true,
    },
  })

  if (!currentFile) throw new Error('File not found')

  folderId = currentFile.folderId

  try {
    // Delete file in cloudinary
    await cloudinary.uploader.destroy(currentFile.storedName, {
      resource_type: currentFile.resourceType,
    })

    // Delete file data in db
    await prisma.file.delete({
      where: {
        id: fileId,
        userId,
      },
    })

    if (folderId) {
      // If file is uploaded to a sub-folder
      res.redirect(`/folders/${folderId}`)
    } else {
      // If file is uploaded to root folder
      res.redirect('/')
    }
  } catch (err) {
    console.error(err)
    return next(err)
  }
}

// Download a file
async function download_file_get(req, res, next) {
  // console.log('download file')
  const fileId = Number(req.params.fileId)
  const userId = req.user.id
  const folderId = Number(req.params.folderId)

  try {
    // Get current file data
    const currentFile = await prisma.file.findFirst({
      where: {
        id: fileId,
        userId,
      },
      select: {
        name: true,
        url: true,
        storedName: true,
        resourceType: true,
      },
    })

    if (!currentFile) throw new Error('File not found')

    // Download file from cloudinary
    const downloadUrl = cloudinary.url(currentFile.storedName, {
      // Downloaded file name reflects updated file name in db
      // even though file name in cloudinary is the original file name
      flags: `attachment:${currentFile.name.split('.')[0]}`,
      resource_type: currentFile.resourceType,
    })

    res.redirect(downloadUrl)
  } catch (err) {
    console.error(err)
    next(err)
  }
}

/* Open a file link to show file details */
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

  // Get cloudinary url with transformations
  const { previewUrl, previewType } = await generateFilePreview(currentFile)

  let breadcrumbs = []
  // Run getBreadcrumbs only if folder id is a number to prevent error
  // folderId must be a number for prisma.create() to work
  if (folderId) {
    // Get all parent folders including current folder
    breadcrumbs = await getBreadcrumbs(folderId, userId)
  }

  try {
    res.render('pages/fileDetails', {
      title: `${currentFile.name}`,
      file: currentFile,
      previewUrl,
      previewType,
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
  rename_file_get,
  rename_file_post,
  delete_file_post,
  download_file_get,
  open_file_get,
}
