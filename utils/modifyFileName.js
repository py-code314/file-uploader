const path = require('node:path')
const { prisma } = require('../lib/prisma')

async function getModifiedFileName(file, folderId, userId) {
  const originalName = file.originalname
  const extension = path.extname(file.originalname)
  const fileName = path.basename(file.originalname, extension)

  // Find all files starting with fileName
  const allFiles = await prisma.file.findMany({
    where: {
      name: {
        startsWith: fileName,
      },
      folderId,
      userId,
    },
    select: {
      name: true,
    },
  })

  // Initial value
  let modifiedFileName = file.originalname

  const fileNameExists = allFiles.some((file) => file.name === originalName)

  // Add an incrementing number next to file name
  if (fileNameExists) {
    counter = 1
    while (
      allFiles.some(
        (file) => file.name === `${fileName}(${counter})${extension}`,
      )
    ) {
      counter++
    }
    modifiedFileName = `${fileName}(${counter})${extension}`
  }

  return modifiedFileName
}

module.exports = { getModifiedFileName }
