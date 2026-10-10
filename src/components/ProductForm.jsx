
import { useEffect, useState } from 'react'
import { FiImage, FiSave, FiX } from 'react-icons/fi'

const emptyForm = {
  name: '',
  category: '',
  description: '',
  price: '',
  stock: '',
  image: ''
}

function isValidImage(value) {
  if (!value) return true

  if (value.startsWith('/Imagenes/')) {
    return !value.includes('..') &&
      !value.includes('\\') &&
      !/[?#]/.test(value)
  }

  try {
    const url = new URL(value)

    return ['http:', 'https:'].includes(url.protocol)
  } catch {
    return false
  }
}

function ProductForm({
  product = null,
  onSubmit,
  onCancel,
  loading = false
}) {
  const [form, setForm] = useState(emptyForm)
  const [error, setError] = useState('')
  const [imageError, setImageError] = useState(false)

  useEffect(() => {
    if (product) {
      setForm({
        name: product.name || '',
        category: product.category || '',
        description: product.description || '',
        price: String(product.price ?? ''),
        stock: String(product.stock ?? ''),
        image: product.image || ''
      })
    } else {
      setForm({ ...emptyForm })
    }

    setError('')
    setImageError(false)
  }, [product])

  const updateField = (field, value) => {
    setForm((previous) => ({
      ...previous,
      [field]: value
    }))

    setError('')

    if (field === 'image') {
      setImageError(false)
    }
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    setError('')

    const name = form.name.trim()
    const category = form.category.trim()
    const description = form.description.trim()
    const price = Number(form.price)
    const stock = Number(form.stock)
    const image = form.image.trim()

    if (!name || name.length > 150) {
      setError('Ingresa un nombre de hasta 150 caracteres.')
      return
    }

    if (category.length > 100) {
      setError('La categoría no puede superar 100 caracteres.')
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

    if (
      form.stock.trim() === '' ||
      !Number.isSafeInteger(stock) ||
      stock < 0
    ) {
      setError('El stock debe ser un entero mayor o igual a cero.')
      return
    }

    if (!isValidImage(image)) {
      setError(
        'Ingresa una URL HTTP/HTTPS válida o una ruta dentro de /Imagenes/.'
      )
      return
    }

    onSubmit({
      name,
      category,
      description,
      price,
      stock,
      image
    })
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
            placeholder="Ej. Audífonos inalámbricos"
            value={form.name}
            onChange={(event) =>
              updateField('name', event.target.value)
            }
            maxLength={150}
            required
          />
        </div>

        <div className="adm-field">
          <label htmlFor="adm-category">
            Categoría
          </label>
          <input
            id="adm-category"
            type="text"
            placeholder="Ej. Audio, Cargadores, Gaming"
            value={form.category}
            onChange={(event) =>
              updateField('category', event.target.value)
            }
            maxLength={100}
          />
        </div>

        <div className="adm-field">
          <label htmlFor="adm-description">
            Descripción
          </label>
          <textarea
            id="adm-description"
            placeholder="Describe las características del producto..."
            value={form.description}
            onChange={(event) =>
              updateField('description', event.target.value)
            }
            maxLength={3000}
            rows={6}
          />
        </div>

        <div className="adm-form-two-columns">
          <div className="adm-field">
            <label htmlFor="adm-price">
              Precio en córdobas (C$)
            </label>
            <input
              id="adm-price"
              type="number"
              placeholder="0.00"
              value={form.price}
              onChange={(event) =>
                updateField('price', event.target.value)
              }
              min="0"
              step="0.01"
              required
            />
          </div>

          <div className="adm-field">
            <label htmlFor="adm-stock">
              Cantidad disponible
            </label>
            <input
              id="adm-stock"
              type="number"
              placeholder="0"
              value={form.stock}
              onChange={(event) =>
                updateField('stock', event.target.value)
              }
              min="0"
              step="1"
              required
            />
          </div>
        </div>

        <div className="adm-field">
          <label htmlFor="adm-image">
            URL o ruta de la fotografía
          </label>
          <input
            id="adm-image"
            type="text"
            placeholder="/Imagenes/producto.jpg"
            value={form.image}
            onChange={(event) =>
              updateField('image', event.target.value)
            }
          />
          <small>
            Acepta enlaces HTTP/HTTPS y rutas dentro de /Imagenes/.
            Las fotografías deben existir para mostrarse.
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

        <div className="adm-preview-image">
          {form.image && !imageError ? (
            <img
              src={form.image}
              alt="Vista previa del producto"
              onError={() => setImageError(true)}
            />
          ) : (
            <FiImage />
          )}
        </div>

        <h4>{form.name || 'Nombre del producto'}</h4>

        {form.category && <small>{form.category}</small>}

        <strong>
          C$ {Number(form.price || 0).toLocaleString('es-NI', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
          })}
        </strong>

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