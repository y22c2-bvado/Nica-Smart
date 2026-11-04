import { useEffect, useState } from 'react'
import { FiImage, FiSave, FiX, FiUploadCloud, FiTrash2, FiCheckCircle } from 'react-icons/fi'

const emptyForm = {
  name: '',
  category: '',
  description: '',
  price: '',
  original_price: '',
  stock: '',
  brand: '',
  brand_url: '',
  is_new: true // <-- NUEVO: Por defecto, los productos nuevos entran con esta etiqueta activa
}

function ProductForm({
  product = null,
  onSubmit,
  onCancel,
  loading = false
}) {
  const [form, setForm] = useState(emptyForm)
  const [error, setError] = useState('')
  
  // Estados para el manejo de imágenes
  const [newFiles, setNewFiles] = useState([])
  const [existingImages, setExistingImages] = useState([])
  const [previews, setPreviews] = useState([])

  useEffect(() => {
    if (product) {
      setForm({
        name: product.name || '',
        category: product.category || '',
        description: product.description || '',
        price: String(product.price ?? ''),
        original_price:
          product.original_price != null
            ? String(product.original_price)
            : '',
        stock: String(product.stock ?? ''),
        brand: product.brand || '',
        brand_url: product.brand_url || '',
        is_new: product.is_new ?? false // <-- NUEVO: Cargamos el estado real al editar un producto existente
      })
      
      // Cargar imágenes existentes si estamos editando
      const imgs = product.images || (product.image ? [product.image] : [])
      setExistingImages(imgs)
      setPreviews(imgs)
    } else {
      setForm({ ...emptyForm })
      setExistingImages([])
      setPreviews([])
    }

    setNewFiles([])
    setError('')
  }, [product])

  const updateField = (event) => {
    const { name, value, type, checked } = event.target;
    setForm((previous) => ({
      ...previous,
      // <-- NUEVO: Si el input es un checkbox, guardamos 'checked' (true/false), sino el 'value'
      [name]: type === 'checkbox' ? checked : value
    }))
    setError('')
  }

  // Manejar la selección de archivos
  const handleFileChange = (event) => {
    const selectedFiles = Array.from(event.target.files)
    
    // Validar que no supere el límite de 4 en total (existentes + nuevos)
    if (existingImages.length + selectedFiles.length > 4) {
      setError('Solo puedes tener un máximo de 4 imágenes por producto.')
      return
    }

    setNewFiles(selectedFiles)
    setError('')
    
    // Crear URLs temporales para previsualizar los nuevos archivos
    const newPreviews = selectedFiles.map(file => URL.createObjectURL(file))
    setPreviews([...existingImages, ...newPreviews])
  }

  // Limpiar archivos nuevos seleccionados (volver a las imágenes originales)
  const clearNewFiles = () => {
    setNewFiles([])
    setPreviews(existingImages)
    // Resetear el input file
    const fileInput = document.getElementById('adm-images')
    if (fileInput) fileInput.value = ''
  }

  // Cálculos para la vista previa de precios
  const numericPrice = Number(form.price || 0)
  const numericOriginal = Number(form.original_price || 0)
  const hasPreviewDiscount =
    Number.isFinite(numericOriginal) &&
    Number.isFinite(numericPrice) &&
    numericOriginal > numericPrice
  const previewDiscountPercent = hasPreviewDiscount
    ? Math.round(
        ((numericOriginal - numericPrice) / numericOriginal) * 100
      )
    : 0

  const handleSubmit = (event) => {
    event.preventDefault()
    setError('')

    const name = form.name.trim()
    const category = form.category.trim()
    const brand = form.brand.trim()
    const brand_url = form.brand_url.trim()
    const description = form.description.trim()
    const price = Number(form.price)
    const stock = Number(form.stock)

    if (!name || name.length > 150) {
      setError('Ingresa un nombre de hasta 150 caracteres.')
      return
    }

    if (category.length > 100) {
      setError('La categoría no puede superar 100 caracteres.')
      return
    }

    if (brand.length > 120) {
      setError('La marca no puede superar 120 caracteres.')
      return
    }

    if (description.length > 3000) {
      setError('La descripción no puede superar 3000 caracteres.')
      return
    }

    if (
      form.price.trim() === '' ||
      !Number.isFinite(price) ||
      price < 0
    ) {
      setError('Ingresa un precio válido.')
      return
    }

    const originalRaw = form.original_price.trim()
    const originalParsed =
      originalRaw === '' ? price : Number(originalRaw)

    if (
      !Number.isFinite(originalParsed) ||
      originalParsed < 0
    ) {
      setError('Ingresa un precio original válido.')
      return
    }

    if (originalParsed < price) {
      setError(
        'El precio original debe ser mayor o igual al precio con descuento.'
      )
      return
    }

    const original_price =
      originalParsed > price ? originalParsed : null

    if (
      form.stock.trim() === '' ||
      !Number.isSafeInteger(stock) ||
      stock < 0
    ) {
      setError('El stock debe ser un entero mayor o igual a cero.')
      return
    }

    if (previews.length === 0) {
      setError('Debes subir al menos una imagen para el producto.')
      return
    }

    // CONSTRUIR FORMDATA PARA ENVIAR IMÁGENES Y MARCA
    const formData = new FormData()
    formData.append('name', name)
    formData.append('category', category)
    formData.append('description', description)
    formData.append('price', price)
    formData.append('stock', stock)
    formData.append('brand', brand)
    formData.append('brand_url', brand_url)
    
    // <-- NUEVO: Enviamos el valor del checkbox al backend
    formData.append('is_new', form.is_new) 

    if (original_price !== null) {
      formData.append('original_price', original_price)
    }

    // Agregar archivos nuevos (si los hay)
    newFiles.forEach(file => {
      formData.append('images', file)
    })

    // Si estamos editando y NO se subieron archivos nuevos, conservar los existentes
    if (product && newFiles.length === 0 && existingImages.length > 0) {
      formData.append('existingImages', JSON.stringify(existingImages))
    }

    onSubmit(formData)
  }

  return (
    <form className="adm-product-form" onSubmit={handleSubmit}>
      <div className="adm-form-fields">

        <div className="adm-field">
          <label htmlFor="adm-name">
            Nombre del producto
          </label>
          <input
            id="adm-name"
            type="text"
            name="name"
            placeholder="Ej. Audífonos inalámbricos"
            value={form.name}
            onChange={updateField}
            maxLength={150}
            required
          />
        </div>

        <div className="adm-form-two-columns">
          <div className="adm-field">
            <label htmlFor="adm-brand">
              Marca del producto
            </label>
            <input
              id="adm-brand"
              type="text"
              name="brand"
              placeholder="Ej. MSI, Logitech, Razer"
              value={form.brand}
              onChange={updateField}
              maxLength={120}
            />
          </div>

          <div className="adm-field">
            <label htmlFor="adm-brand-url">
              Página web de la marca
            </label>
            <input
              id="adm-brand-url"
              type="url"
              name="brand_url"
              placeholder="https://www.msi.com"
              value={form.brand_url}
              onChange={updateField}
            />
            <small>
              Se mostrará en la página de Marcas.
            </small>
          </div>
        </div>

        <div className="adm-field">
          <label htmlFor="adm-category">
            Categoría
          </label>
          <input
            id="adm-category"
            type="text"
            name="category"
            placeholder="Ej. Audio, Cargadores, Gaming"
            value={form.category}
            onChange={updateField}
            maxLength={100}
          />
        </div>

        <div className="adm-field">
          <label htmlFor="adm-description">
            Descripción
          </label>
          <textarea
            id="adm-description"
            name="description"
            placeholder="Describe las características del producto..."
            value={form.description}
            onChange={updateField}
            maxLength={3000}
            rows={6}
          />
        </div>

        <div className="adm-form-two-columns">
          <div className="adm-field">
            <label htmlFor="adm-price">
              Precio con descuento (C$)
            </label>
            <input
              id="adm-price"
              type="number"
              name="price"
              placeholder="0.00"
              value={form.price}
              onChange={updateField}
              min="0"
              step="0.01"
              required
            />
            <small>
              Precio que paga el cliente.
            </small>
          </div>

          <div className="adm-field">
            <label htmlFor="adm-original-price">
              Precio original (C$)
            </label>
            <input
              id="adm-original-price"
              type="number"
              name="original_price"
              placeholder="Opcional. Ej. 2200"
              value={form.original_price}
              onChange={updateField}
              min="0"
              step="0.01"
            />
            <small>
              Déjalo vacío si no hay promoción.
            </small>
          </div>
        </div>

        <div className="adm-field">
          <label htmlFor="adm-stock">
            Cantidad disponible
          </label>
          <input
            id="adm-stock"
            type="number"
            name="stock"
            placeholder="0"
            value={form.stock}
            onChange={updateField}
            min="0"
            step="1"
            required
          />
        </div>

        {/* <-- NUEVO: CHECKBOX PARA MARCAR COMO NUEVO --> */}
        <div className="adm-field" style={{ display: 'flex', alignItems: 'center', gap: '12px', backgroundColor: 'rgba(255,255,255,0.05)', padding: '15px', borderRadius: '8px', border: '1px solid #444' }}>
          <input 
            type="checkbox" 
            id="adm-is-new" 
            name="is_new" 
            checked={form.is_new} 
            onChange={updateField}
            style={{ width: '20px', height: '20px', cursor: 'pointer', accentColor: '#0755d7' }}
          />
          <div>
            <label htmlFor="adm-is-new" style={{ margin: 0, cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <FiCheckCircle color="#0755d7" /> Destacar como Producto Nuevo
            </label>
            <small style={{ display: 'block', marginTop: '4px', color: '#aaa' }}>
              Si está marcado, aparecerá en la sección "Nuevos" de la tienda.
            </small>
          </div>
        </div>

        {/* INPUT DE IMÁGENES */}
        <div className="adm-field">
          <label htmlFor="adm-images">
            Fotografías del producto (Máximo 4)
          </label>
          
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '10px' }}>
             <input
              id="adm-images"
              type="file"
              multiple
              accept="image/jpeg, image/png, image/webp"
              onChange={handleFileChange}
              disabled={loading}
              style={{ display: 'none' }}
            />
            <button
              type="button"
              className="adm-btn adm-btn-outline"
              onClick={() => document.getElementById('adm-images').click()}
              disabled={loading || existingImages.length >= 4}
            >
              <FiUploadCloud /> Seleccionar imágenes
            </button>
            
            {newFiles.length > 0 && (
              <button
                type="button"
                className="adm-btn adm-btn-outline"
                onClick={clearNewFiles}
                style={{ color: 'red', borderColor: 'red' }}
                title="Cancelar nuevas imágenes"
              >
                <FiTrash2 /> Descartar nuevas
              </button>
            )}
          </div>
          <small>
            Sube hasta 4 imágenes en formato JPG, PNG o WEBP (Máx. 5MB c/u).
            {product && newFiles.length > 0 && " Al guardar, las nuevas imágenes reemplazarán a las anteriores."}
          </small>
        </div>

        {error && (
          <p className="adm-alert adm-alert-error" role="alert">
            {error}
          </p>
        )}

        <div className="adm-form-actions">
          <button
            type="button"
            className="adm-btn adm-btn-outline"
            onClick={onCancel}
            disabled={loading}
          >
            <FiX />
            Cancelar
          </button>

          <button
            type="submit"
            className="adm-btn adm-btn-primary"
            disabled={loading}
          >
            <FiSave />
            {loading
              ? 'Guardando...'
              : product
                ? 'Guardar cambios'
                : 'Agregar producto'}
          </button>
        </div>
      </div>

      <div className="adm-form-preview">
        <h3>Vista previa</h3>

        {/* GALERÍA DE VISTA PREVIA */}
        <div className="adm-preview-gallery" style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '15px' }}>
          {previews.length > 0 ? (
            previews.map((url, index) => (
              <div key={index} style={{ position: 'relative' }}>
                <img
                  src={url}
                  alt={`Vista previa ${index + 1}`}
                  style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #444' }}
                />
                {index === 0 && (
                  <span style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(0,0,0,0.7)', color: 'white', fontSize: '10px', textAlign: 'center', padding: '2px' }}>
                    Principal
                  </span>
                )}
              </div>
            ))
          ) : (
            <div className="adm-preview-image">
               <FiImage />
            </div>
          )}
        </div>

        <h4>{form.name || 'Nombre del producto'}</h4>

        {form.brand && (
          <strong style={{ color: '#0755d7', display: 'block', marginBottom: '5px' }}>
            {form.brand}
          </strong>
        )}

        {form.category && <small>{form.category}</small>}

        <div className="adm-preview-price-block">
          {hasPreviewDiscount && (
            <div className="adm-preview-discount">
              <del>
                C$ {numericOriginal.toLocaleString('es-NI', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                })}
              </del>
              <span className="adm-preview-discount-badge">
                🔥 -{previewDiscountPercent}%
              </span>
            </div>
          )}

          <strong>
            C$ {numericPrice.toLocaleString('es-NI', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2
            })}
          </strong>

          {hasPreviewDiscount && (
            <span className="adm-preview-saving">
              Ahorras C${' '}
              {(numericOriginal - numericPrice).toLocaleString('es-NI', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
              })}
            </span>
          )}
        </div>

        <p>
          {form.description ||
            'La descripción del producto aparecerá aquí.'}
        </p>

        <span>Stock: {form.stock || '0'}</span>
      </div>
    </form>
  )
}

export default ProductForm