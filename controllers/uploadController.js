/* Show file upload form */
async function upload_get(req, res) {
  res.render('pages/fileForm', {
    title: 'Upload File',
  })
}

async function upload_post(req, res) {
  console.log(req.files)
  res.send('File uploaded')
}

module.exports = { upload_get, upload_post }
