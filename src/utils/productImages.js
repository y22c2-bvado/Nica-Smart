
export function getProductImages(product) {
  if (!product) return []

  const images = []

  const addImage = (value) => {
    if (!value) return

    if (Array.isArray(value)) {
      value.forEach(addImage)
      return
    }

    if (typeof value === 'object') {
      addImage(value.url || value.src || value.image_url)
      return
    }

    if (typeof value === 'string') {
      const image = value.trim()

      if (
        image &&
        (image.startsWith('https://') ||
          image.startsWith('http://') ||
          image.startsWith('/') ||
          image.startsWith('data:image/'))
      ) {
        images.push(image)
      }
    }
  }

  addImage(product.images)
  addImage(product.image_url)
  addImage(product.image)

  return [...new Set(images)]
}
