const { cloudinary } = require('../config/cloudinaryConfig')

/* Generate file preview url */
async function generateFilePreview(file) {
  let previewUrl = ''
  let previewType = 'icon'

  const fileType = file.type.toLowerCase()

  if (
    ['png', 'avif', 'gif', 'jpg', 'jpeg', 'svg', 'webp', 'pdf'].includes(
      fileType,
    )
  ) {
    // For images and pdf files
    previewType = 'image'
    previewUrl = cloudinary.url(file.storedName, {
      resource_type: 'image',
      width: 400,
      crop: 'scale',
      format: 'jpg',
    })
  } else if (
    ['aac', 'mid', 'midi', 'mp3', 'wav', 'flac', 'm4p', 'ogg', 'wma'].includes(
      fileType,
    )
  ) {
    // Audio files
    previewType = 'audio'
    previewUrl = file.url
  } else if (
    [
      'webm',
      'mkv',
      'flv',
      'avi',
      'mov',
      'wmv',
      'rm',
      'amv',
      'mp4',
      'mpg',
      'mpeg',
      'm4v',
      '3gp',
    ].includes(fileType)
  ) {
    // Video files
    previewType = 'video'
    previewUrl = cloudinary.url(file.storedName, {
      resource_type: 'video',
      width: 400,
      crop: 'scale',
      start_offset: '1',
    })
  } else {
    // For .doc and .docx files
    previewType = 'icon'
    previewUrl = `/icons/${fileType}-icon.svg`
  }

  return { previewUrl, previewType }
}

module.exports = generateFilePreview
