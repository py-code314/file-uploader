const { prisma } = require('./lib/prisma.js')

async function main() {
  // Add multiple records
  const createMany = await prisma.user.createMany({
    data: [
      {
        name: 'Bob',
        email: 'bob@prisma.io',
        passwordHash: 'dkreir343493439cnndfd',
      },
      {
        name: 'Yewande',
        email: 'yewande@prisma.io',
        passwordHash: 'cmvcvnfjir494939dkfdfd*$*$$*',
      },
    ],
    skipDuplicates: true, // Skip records with duplicate unique fields
  })

  console.log('Created users:', createMany)

  // Fetch all users
  const allUsers = await prisma.user.findMany()
  console.log('All users:', allUsers)
  // console.log('All users:', JSON.stringify(allUsers, null, 2))
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
