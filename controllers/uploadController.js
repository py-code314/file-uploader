/* Show file upload form */
async function upload_get(req, res) {
  res.render('pages/upload', {
    title: 'Upload File',
  })
}

module.exports = {upload_get}
