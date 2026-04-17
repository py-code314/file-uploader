const passport = require('passport')
const LocalStrategy = require('passport-local').Strategy
// const pool = require('../db/pool')
const bcrypt = require('bcryptjs')
const { prisma } = require('../lib/prisma.js')

/* Verify email and password before logging in */
const verifyCallback = async (email, password, done) => {
  try {
    // const { rows } = await pool.query(
    //   'SELECT * FROM users WHERE email = $1',
    //   [email],
    // )

    const user = await prisma.user.findUnique({ where: {email} })
    
    // User doesn't exist
    if (!user) {
      return done(null, false, { message: 'Incorrect Email' })
    }

    const match = await bcrypt.compare(password, user.passwordHash)
    if (!match) {
      // Passwords don't match
      return done(null, false, { message: 'Incorrect Password' })
    }

    // email and password match
    return done(null, user)
  } catch (err) {
    return done(err)
  }
}

// Define usernameField as email
const strategy = new LocalStrategy({usernameField: 'email'}, verifyCallback)

passport.use(strategy)

// Store session data in db
passport.serializeUser((user, done) => {
  done(null, user.id)
})

// Retrieve user data from db
passport.deserializeUser(async (id, done) => {
  try {
    // const { rows } = await pool.query('SELECT * FROM users WHERE id = $1', [id])
    const user = await prisma.user.findUnique({where: {id}})

    done(null, user)
  } catch (err) {
    done(err)
  }
})
