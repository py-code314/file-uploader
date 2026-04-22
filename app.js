const express = require('express')
const path = require('node:path')
const expressSession = require('express-session')
const { PrismaSessionStore } = require('@quixo3/prisma-session-store')
const { prisma } = require('./lib/prisma.js')
const passport = require('passport')
// Import routers
const homeRouter = require('./routes/homeRoutes')
const signUpRouter = require('./routes/signUpRoutes')
const logInRouter = require('./routes/logInRoutes')
const logOutRouter = require('./routes/logOutRoutes')
const uploadRouter = require('./routes/uploadRoutes')

/**
 * -------------- GENERAL SETUP ----------------
 */

// Import dotenv
require('dotenv').config()

// Create express app
const app = express()

// EJS setup
app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'ejs')

// Setup for static files
const assetsPath = path.join(__dirname, 'public')
app.use(express.static(assetsPath))

// Middleware to process request body
app.use(express.json())
app.use(express.urlencoded({ extended: true })) // To parse login form data

/**
 * -------------- SESSION SETUP ----------------
 */

// Express session object using Prisma session store
app.use(
  expressSession({
    cookie: {
      maxAge: 24 * 60 * 60 * 1000, // 1 day
    },
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: false,
    store: new PrismaSessionStore(prisma, {
      checkPeriod: 2 * 60 * 1000, //ms
      dbRecordIdIsSessionId: true,
      dbRecordIdFunction: undefined,
    }),
  }),
)

/**
 * -------------- PASSPORT AUTHENTICATION ----------------
 */

require('./config/passport')
app.use(passport.session())

/**
 * -------------- ROUTES ----------------
 */

app.use((req, res, next) => {
  res.locals.currentUser = req.user
  next()
})

app.use('/', homeRouter)
app.use('/signUp', signUpRouter)
app.use('/logIn', logInRouter)
app.use('/logOut', logOutRouter)
app.use('/files', uploadRouter)


/**
 * -------------- ERROR HANDLER MIDDLEWARE ----------------
 */

app.use((err, req, res, next) => {
  console.error(err)

  // Error data
  const statusCode = err.statusCode || 500

  let errorTitle = 'Connection Terminated'
  let errorMessage = 'The requested operation could not be completed.'

  if (err.title && statusCode !== 500) {
    errorTitle = err.title
    errorMessage = err.message
  }

  res.status(statusCode).render('pages/error', {
    title: 'Error',
    errorCode: statusCode,
    errorTitle,
    errorMessage,
  })
})

/**
 * -------------- SERVER ----------------
 */

// Port to listen on
const PORT = process.env.PORT || 3000
app.listen(PORT, (error) => {
  if (error) {
    throw error
  }
  console.log(`File Uploader App - listening on port ${PORT}!`)
})
