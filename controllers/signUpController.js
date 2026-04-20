/* Imports */

const bcrypt = require('bcryptjs')
const { body, validationResult, matchedData } = require('express-validator')
const { prisma } = require('../lib/prisma.js')

/* Error messages */
const emptyErr = 'can not be empty.'
const existsErr = 'already in use.'
const lengthErr = 'must be at least 8 characters long.'
const emailInvalidErr = 'is invalid.'
const passwordInvalidErr =
  'must contain an uppercase letter, a number, and a special character.'
const alphaErr = 'must contain only letters.'

/* Validate user data */
const validateUser = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage(`Email ${emptyErr}`)
    .bail()
    .isEmail()
    .withMessage(`Email ${emailInvalidErr}`)
    .custom(async (email) => {
      // Throw error if email already exists
      const user = await prisma.user.findUnique({
        where: {
          email,
        },
      })
      if (user) {
        throw new Error(`Username ${existsErr}`)
      }

      return true
    }),
  body('firstName')
    .trim()
    .notEmpty()
    .withMessage(`First Name ${emptyErr}`)
    .bail()
    .isAlpha('en-US', { ignore: '-' })
    .withMessage(`First Name ${alphaErr}`),
  body('lastName')
    .trim()
    .notEmpty()
    .withMessage(`Last Name ${emptyErr}`)
    .bail()
    .isAlpha('en-US', { ignore: '-' })
    .withMessage(`Last Name ${alphaErr}`),
  body('password')
    .trim()
    .notEmpty()
    .withMessage(`Password ${emptyErr}`)
    .bail()
    .isLength({ min: 8 })
    .withMessage(`Password ${lengthErr}`)
    .bail()
    .matches(/^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*]).{8,}$/)
    .withMessage(`Password ${passwordInvalidErr}`),
  body('confirmPassword')
    .trim()
    .notEmpty()
    .withMessage(`Confirm Password ${emptyErr}`)
    .bail()
    .custom((password, { req }) => {
      return password === req.body.password
    })
    .withMessage('Passwords do not match.'),
]

/* Show sign up page */
async function sign_up_get(req, res) {
  res.render('pages/signUp', {
    title: 'Sign Up',
  })
}

/* Validate and add new user */
const sign_up_post = [
  validateUser,

  async (req, res, next) => {
    // Get form data except password
    const { email, firstName, lastName } = req.body
    const userData = {
      email: email,
      firstName: firstName,
      lastName: lastName,
    }

    // Validate request
    const errors = validationResult(req)

    // Show errors if validation fails
    if (!errors.isEmpty()) {
      return res.status(400).render('pages/signUp', {
        title: 'Sign Up',
        user: userData,
        errors: errors.array(),
      })
    }

    try {
      // Get validated form data
      const { email, firstName, lastName, password } = matchedData(req)
      const hashedPassword = await bcrypt.hash(password, 10)

      await prisma.user.create({
        data: {
          email,
          name: `${firstName} ${lastName}`,
          passwordHash: hashedPassword,
        },
      })
      // req.session.messages = [
      //   'Account established. You may now perform an uplink (Log In).',
      // ]

      res.redirect('/logIn')
    } catch (err) {
      console.error(err)
      return next(err)
    }
  },
]

module.exports = { sign_up_get, sign_up_post }
