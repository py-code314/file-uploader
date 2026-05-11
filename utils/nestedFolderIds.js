const { prisma } = require("../lib/prisma")

async function getNestedFolderIds(parentId, userId) {
  // Get child folder ids
  const childrenIds = await prisma.folder.findMany({
    where: {
      parentId,
      userId
    },
    select: {
      id: true
    }
  })

  // Children ids array
  let childrenIdsArr = childrenIds.map(child => child.id)
  console.log("🚀 ~ getNestedFolderIds ~ childrenIdsArr:", childrenIdsArr)

  // Get all nested folder ids recursively
  for (const childId of childrenIdsArr) {
    const nestedFolderIds = await getNestedFolderIds(childId, userId)
    console.log("🚀 ~ getNestedFolderIds ~ nestedFolderIds:", nestedFolderIds)
    childrenIdsArr = childrenIdsArr.concat(nestedFolderIds)
  }

  return childrenIdsArr
}

module.exports = {getNestedFolderIds}