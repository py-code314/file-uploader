const multer = require('multer')
const upload = require('../middleware/upload')
const { prisma } = require('../lib/prisma')


/* Show file upload form */
async function upload_file_get(req, res) {
  const folderId = Number(req.params.folderId)

  res.render('pages/fileForm', {
    title: 'Upload File',
    folderId
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

      // Check if file exists
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

  // Get file data
  const currentFile = await prisma.file.findFirst({
    where: {
      id: fileId,
      userId,
    },
  })
 

  res.send('update file')
}

module.exports = { upload_file_get, upload_file_post, update_file_get }
