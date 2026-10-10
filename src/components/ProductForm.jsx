
import { useEffect, useState } from 'react'
import { FiImage, FiSave, FiX } from 'react-icons/fi'

const emptyForm = {
  name: '',
  description: '',
  price: '',
  stock: '',
  image: ''
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
    const description = form.description.trim()
    const price = Number(form.price)
    const stock = Number(form.stock)
    const image = form.image.trim()

    if (!name || name.length > 150) {
      setError('Ingresa un nombre de hasta 150 caracteres.')
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
      setError('El stock debe ser un número entero positivo o cero.')
      return
    }

    if (image) {
      try {
        const url = new URL(image)

        if (!['http:', 'https:'].includes(url.protocol)) {
          throw new Error('URL inválida')
        }
      } catch {
        setError('Ingresa una URL de imagen válida.')
        return
      }
    }

    onSubmit({
      name,
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
            URL de la fotografía
          </label>

          <input
            id="adm-image"
            type="url"
            placeholder="https://ejemplo.com/producto.jpg"
            value={form.image}
            onChange={(event) =>
              updateField('image', event.target.value)
            }
          />

          <small>
            Actualmente puedes utilizar enlaces de imágenes.
            La subida desde tu computadora se añadirá después.
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

        <span>
          Stock: {form.stock || '0'}
        </span>
      </div>

    </form>
  )
}

export default ProductForm
