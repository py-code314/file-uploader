const { prisma } = require("../lib/prisma")

async function getBreadcrumbs(folderId, userId, breadcrumbs = []) {
  // Get current folder
  const currentFolder = await prisma.folder.findUnique({
    where: {
      id: folderId,
      userId
    }, 
    select: {
      id: true,
      parentId: true,
      name: true
    }
  })

  // For home folder
  if (!currentFolder) {
    return breadcrumbs
  }

  // Add current folder to breadcrumbs
  breadcrumbs.unshift(currentFolder)

  // Current folder has a parent
  if (currentFolder.parentId) {
    return await getBreadcrumbs(currentFolder.parentId, userId, breadcrumbs)
  }

  return breadcrumbs

}

module.exports = {getBreadcrumbs}