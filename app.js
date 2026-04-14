const express = require('express')
const app = express()

app.get('/', (req, res) => res.send('Hello, world!'))

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
