const path = require('node:path')
const { prisma } = require('../lib/prisma')

async function getModifiedFileName(fullName, folderId, userId) {
  const extension = fullName.split('.').pop()
  const fileName = fullName.split('.')[0]

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
  let modifiedFileName = fullName

  const fileNameExists = allFiles.some((file) => file.name === fullName)

  // Add an incrementing number next to file name
  if (fileNameExists) {
    counter = 1
    while (
      allFiles.some(
        (file) => file.name === `${fileName}(${counter}).${extension}`,
      )
    ) {
      counter++
    }
    modifiedFileName = `${fileName}(${counter}).${extension}`
  }

  return modifiedFileName
}

module.exports = { getModifiedFileName }
