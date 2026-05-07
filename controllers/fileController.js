const multer = require('multer')
const upload = require('../middleware/upload')
const { prisma } = require('../lib/prisma')
const { body, validationResult, matchedData } = require('express-validator')

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
        // Clean up any partial uploads
        if (req.files && req.files.length > 0) {
          req.files.forEach((file) => {
            if (fs.existsSync(file.path)) {
              fs.unlinkSync(file.path)
            }
          })
        }

        const errorMap = {
          LIMIT_FILE_SIZE: {
            status: 413,
            message: 'One of the files you selected is too large',
          },
          LIMIT_FILE_COUNT: {
            status: 400,
            message: 'Too many files.',
          },
          LIMIT_UNEXPECTED_FILE: {
            status: 400,
            message:
              'Invalid upload field. Please use the provided buttons to upload files.',
          },
        }

        const errorInfo = errorMap[err.code] || {
          status: 400,
          message: 'File upload error',
        }

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

      // TODO Check for duplicate file name
      // Check for files length
      else if (!req.files.length) {
        return res.status(400).render('pages/fileForm', {
          title: 'Upload File',
          errors: [{ msg: 'Choose at least one file to upload.' }],
        })
      }

      const currentFiles = req.files
      const folderId = Number(req.params.folderId)
      const userId = req.user.id

      // Add file data to db
      for (const file of currentFiles) {
        await prisma.file.create({
          data: {
            name: file.originalname,
            storedName: file.filename,
            size: file.size,
            type: file.mimetype,
            url: `/uploads/${file.filename}`,
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

  res.render('pages/fileUpdateForm', {
    title: 'Update File',
    file: currentFile,
    fileId,
    folderId,
    isUpdate: true
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

    // Get form data
    const { name } = req.body
    const fileName = {
      name,
    }

    // Validate request
    const errors = validationResult(req)

    // Show errors if validation fails
    if (!errors.isEmpty()) {
      return res.status(400).render('pages/fileUpdateForm', {
        title: 'Update file',
        file: fileName,
        fileId: currentFile.id,
        folderId, // Pass it to be used in Cancel link
        errors: errors.array(),
      })
    }

    try {
      // Get validated form data
      const { name } = matchedData(req)

      // Update file name
      await prisma.file.update({
        where: {
          id: fileId,
          userId,
        },
        data: {
          name,
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
    // Delete file
    await prisma.file.delete({
      where: {
        id: fileId,
        userId,
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
}

// Download file
async function download_file_get(req, res, next) {
  console.log('download file')
  const fileId = Number(req.params.fileId)
  const userId = req.user.id
  const folderId = Number(req.params.folderId)

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

  const uploadDir = req.app.get('UPLOAD_PATH')
  const fullPath = uploadDir + currentFile.url

  try {
    res.download(fullPath, currentFile.name)
  } catch (err) {
    console.error(err)
    next(err)
  }
}

module.exports = {
  upload_file_get,
  upload_file_post,
  update_file_get,
  update_file_post,
  delete_file_post,
  download_file_get,
}
