const { cloudinary } = require("../config/cloudinaryConfig")

async function generateFilePreview(file) {
  let previewUrl = ''
  let previewType = 'icon'

  const fileType = file.type.toLowerCase()

  if (['png', 'avif', 'gif', 'jpg', 'jpeg', 'svg', 'webp', 'pdf'].includes(fileType)) { // For images and pdf files
    console.log('image')
    previewType = 'image'
    previewUrl = cloudinary.url(file.storedName, {
      resource_type: 'image',
      width: 300,
      crop: 'scale',
      format: 'jpg'
    })
  } else if (['aac', 'mid', 'midi', 'mp3', 'wav', 'flac', 'm4p', 'ogg', 'wma'].includes(fileType)) { // Audio files
    previewType = 'audio'
    previewUrl = file.url
  } else if (['webm', 'mkv', 'flv', 'avi', 'mov', 'wmv', 'rm', 'amv', 'mp4', 'mpg', 'mpeg', 'm4v', '3gp'].includes(fileType)) { // Video files
    previewType = 'video'
    previewUrl = file.url
  } else { // For .doc and .docx files
    previewType = 'icon'
    previewUrl = `images/icons/${fileType}_icon.svg`
  }

  return {previewUrl, previewType}
}

module.exports = generateFilePreview