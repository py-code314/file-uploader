async function handleMulterErrors(files, err) {
  // Clean up any partial uploads
  if (files && files.length > 0) {
    files.forEach((file) => {
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

  return errorInfo
}

module.exports = handleMulterErrors
