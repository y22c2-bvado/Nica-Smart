
import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Header from '../components/Header'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { useCart } from '../context/CartContext'
import '../styles/checkout.css'

// ==========================================
// CONFIGURACIÓN
// ==========================================

const API_URL = String(
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV ? 'http://localhost:3000' : '')
).trim().replace(/\/+$/, '')

const SHIPPING_COST = 150
const TRANSFER_REFERENCE = '136071407'

const PAYMENT_METHODS = {
  card: 'tarjeta_simulada',
  transfer: 'transferencia_simulada'
}

const money = (value) =>
  `C$ ${Number(value || 0).toLocaleString('es-NI', {
    maximumFractionDigits: 0
  })}`

function getStoredUser() {
  try {
    const raw = localStorage.getItem('user')
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

// ==========================================
// DETECCIÓN DE VISA Y MASTERCARD
// ==========================================

function getCardBrand(number) {
  const digits = String(number || '').replace(/\D/g, '')

  if (digits.startsWith('4')) {
    return 'visa'
  }

  const firstTwo = Number(digits.slice(0, 2))
  const firstFour = Number(digits.slice(0, 4))

  if (
    (digits.length >= 2 &&
      firstTwo >= 51 &&
      firstTwo <= 55) ||
    (digits.length >= 4 &&
      firstFour >= 2221 &&
      firstFour <= 2720)
  ) {
    return 'mastercard'
  }

  return ''
}

// Permite escribir únicamente prefijos que
// puedan formar Visa o Mastercard.

function isPossibleCardPrefix(value) {
  const digits = String(value || '').replace(/\D/g, '')

  if (!digits) return true

  if (digits.startsWith('4')) {
    return true
  }

  if (digits.startsWith('5')) {
    if (digits.length === 1) return true

    const firstTwo = Number(digits.slice(0, 2))

    return firstTwo >= 51 && firstTwo <= 55
  }

  if (digits.startsWith('2')) {
    const prefix = digits.slice(0, Math.min(4, digits.length))
    const remaining = 4 - prefix.length

    const minimum = Number(prefix.padEnd(4, '0'))
    const maximum = Number(prefix.padEnd(4, '9'))

    return (
      remaining >= 0 &&
      minimum <= 2720 &&
      maximum >= 2221
    )
  }

  return false
}

function formatCardNumber(value) {
  return String(value || '')
    .replace(/\D/g, '')
    .slice(0, 16)
    .replace(/(.{4})/g, '$1 ')
    .trim()
}

function formatExpiry(value) {
  const digits = String(value || '')
    .replace(/\D/g, '')
    .slice(0, 4)

  return digits.length > 2
    ? `${digits.slice(0, 2)}/${digits.slice(2)}`
    : digits
}

// ==========================================
// IMÁGENES DE PRODUCTOS
// ==========================================

function getProductImage(product) {
  if (!product) return ''

  const data = product.product || product

  const candidates = [
    product.image_url,
    product.image,
    product.images,
    product.imageUrl,
    product.thumbnail,
    product.photo,
    product.picture,
    data.image_url,
    data.image,
    data.images,
    data.imageUrl,
    data.thumbnail,
    data.photo,
    data.picture
  ]

  function extract(value) {
    if (!value) return ''

    if (Array.isArray(value)) {
      for (const entry of value) {
        const found = extract(entry)
        if (found) return found
      }
      return ''
    }

    if (typeof value === 'object') {
      return extract(
        value.url ||
        value.src ||
        value.image_url ||
        value.imageUrl ||
        value.path ||
        value.image
      )
    }

    if (typeof value !== 'string') return ''

    const text = value.trim()
    if (!text) return ''

    if (text.startsWith('[') || text.startsWith('{')) {
      try {
        return extract(JSON.parse(text))
      } catch {
        return ''
      }
    }

    const first = text
      .split(',')[0]
      .trim()
      .replace(/\\/g, '/')

    if (/^(https?:\/\/|data:image\/|blob:)/i.test(first)) {
      return first
    }

    if (first.startsWith('//')) {
      return `${window.location.protocol}${first}`
    }

    if (/^\/?public\//i.test(first)) {
      return `/${first.replace(/^\/*public\//i, '')}`
    }

    if (/^\/?(assets|images)\//i.test(first)) {
      return `/${first.replace(/^\/+/, '')}`
    }

    if (/^\/?uploads\//i.test(first)) {
      return `${API_URL}/${first.replace(/^\/+/, '')}`
    }

    if (first.startsWith('/')) {
      return first
    }

    return `${API_URL}/${first.replace(/^\/+/, '')}`
  }

  for (const candidate of candidates) {
    const image = extract(candidate)
    if (image) return image
  }

  return ''
}

function ProductThumbnail({ product }) {
  const [failedUrl, setFailedUrl] = useState('')
  const image = getProductImage(product)

  if (!image || failedUrl === image) {
    return (
      <div
        className="checkout-product-placeholder"
        role="img"
        aria-label="Imagen no disponible"
      >
        🖥️
      </div>
    )
  }

  return (
    <img
      src={image}
      alt={product.name || 'Producto'}
      loading="lazy"
      decoding="async"
      onError={() => setFailedUrl(image)}
    />
  )
}

// ==========================================
// COMPONENTE PRINCIPAL
// ==========================================

function Checkout() {
  const navigate = useNavigate()

  const {
    cartItems = [],
    cartTotal = 0,
    clearCart
  } = useCart()

  const [user] = useState(getStoredUser)
  const [catalogImages, setCatalogImages] = useState({})

  // ==========================================
  // RECUPERAR IMÁGENES DEL CATÁLOGO
  // ==========================================

  useEffect(() => {
    const missing = cartItems.filter(
      (item) => !getProductImage(item)
    )

    if (!missing.length) return

    const controller = new AbortController()

    async function loadImages() {
      try {
        const response = await fetch(
          `${API_URL}/api/products`,
          { signal: controller.signal }
        )

        if (!response.ok) return

        const json = await response.json()

        const products = Array.isArray(json)
          ? json
          : Array.isArray(json.products)
            ? json.products
            : Array.isArray(json.data)
              ? json.data
              : Array.isArray(json.data?.products)
                ? json.data.products
                : []

        const next = {}

        for (const item of missing) {
          const id = String(item.id ?? item.product_id)

          const match = products.find(
            (product) =>
              String(product.id ?? product.product_id) === id
          )

          if (match && getProductImage(match)) {
            next[id] = match
          }
        }

        if (!controller.signal.aborted) {
          setCatalogImages((previous) => ({
            ...previous,
            ...next
          }))
        }
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.warn('No se pudieron cargar las imágenes.')
        }
      }
    }

    loadImages()

    return () => controller.abort()
  }, [cartItems])

  // ==========================================
  // FORMULARIO
  // ==========================================

  const [formData, setFormData] = useState({
    phone: '',
    address: '',
    reference: '',
    paymentMethod: PAYMENT_METHODS.card,
    cardNumber: '',
    cardHolder: '',
    cardExpiry: '',
    cardCvv: ''
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const subtotal = Number(cartTotal) || 0
  const shipping = cartItems.length > 0
    ? SHIPPING_COST
    : 0

  const estimatedTotal = subtotal + shipping

  const itemCount = useMemo(
    () => cartItems.reduce(
      (sum, item) => sum + (Number(item.quantity) || 1),
      0
    ),
    [cartItems]
  )

  const cardDigits =
    formData.cardNumber.replace(/\D/g, '')

  const cardBrand =
    getCardBrand(formData.cardNumber)

  // ==========================================
  // MANEJAR CAMBIOS
  // ==========================================

  const handleChange = (event) => {
    const { name, value } = event.target

    let formattedValue = value

    if (name === 'cardNumber') {
      const digits = value.replace(/\D/g, '').slice(0, 16)

      // No permite otros prefijos.
      if (!isPossibleCardPrefix(digits)) {
        setError(
          'Solo se admiten números con formato Visa o Mastercard.'
        )
        return
      }

      formattedValue = formatCardNumber(digits)
    }

    if (name === 'cardHolder') {
      formattedValue = value
        .replace(/[^a-zA-ZÁÉÍÓÚÜÑáéíóúüñ\s]/g, '')
        .slice(0, 70)
    }

    if (name === 'cardExpiry') {
      formattedValue = formatExpiry(value)
    }

    if (name === 'cardCvv') {
      formattedValue = value
        .replace(/\D/g, '')
        .slice(0, 3)
    }

    setFormData((previous) => ({
      ...previous,
      [name]: formattedValue
    }))

    setError('')
  }

  // ==========================================
  // VALIDACIONES
  // ==========================================

  const validateForm = () => {
    if (cartItems.length === 0) {
      return 'Tu carrito está vacío.'
    }

    const phoneDigits =
      formData.phone.replace(/\D/g, '')

    const validPhone =
      phoneDigits.length === 8 ||
      (
        phoneDigits.length === 11 &&
        phoneDigits.startsWith('505')
      )

    if (!validPhone) {
      return 'Ingresá un teléfono válido de Nicaragua.'
    }

    if (formData.address.trim().length < 10) {
      return 'Ingresá una dirección de entrega más detallada.'
    }

    const fullAddress = [
      formData.address.trim(),
      formData.reference.trim()
    ]
      .filter(Boolean)
      .join('\nReferencia: ')

    if (fullAddress.length > 500) {
      return 'La dirección y referencia son demasiado largas.'
    }

    if (
      !Object.values(PAYMENT_METHODS).includes(
        formData.paymentMethod
      )
    ) {
      return 'Seleccioná un método de pago válido.'
    }

    if (formData.paymentMethod === PAYMENT_METHODS.card) {
      if (formData.cardHolder.trim().length < 5) {
        return 'Ingresá el nombre del titular.'
      }

      if (!/^\d{16}$/.test(cardDigits)) {
        return 'Ingresá un número de tarjeta de 16 dígitos.'
      }

      if (!cardBrand) {
        return 'Tarjeta no admitida. Solo Visa o Mastercard.'
      }

      if (!/^\d{2}\/\d{2}$/.test(formData.cardExpiry)) {
        return 'Ingresá el vencimiento en formato MM/AA.'
      }

      const [month, year] = formData.cardExpiry
        .split('/')
        .map(Number)

      const now = new Date()
      const currentYear = now.getFullYear() % 100
      const currentMonth = now.getMonth() + 1

      if (
        month < 1 ||
        month > 12 ||
        year < currentYear ||
        year > currentYear + 20 ||
        (year === currentYear && month < currentMonth)
      ) {
        return 'La fecha de vencimiento no es válida.'
      }

      if (!/^\d{3}$/.test(formData.cardCvv)) {
        return 'Ingresá un código de seguridad de 3 dígitos.'
      }
    }

    return ''
  }

  // ==========================================
  // CONFIRMAR PEDIDO
  // ==========================================

  const handleConfirmOrder = async (event) => {
    event.preventDefault()

    if (loading) return

    setError('')

    const token = localStorage.getItem('token')

    if (!token) {
      navigate('/login', {
        state: { from: '/checkout' }
      })
      return
    }

    const validationError = validateForm()

    if (validationError) {
      setError(validationError)
      return
    }

    setLoading(true)

    try {
      const items = cartItems.map((item) => ({
        product_id: Number(item.id ?? item.product_id),
        quantity: Number(item.quantity) || 1
      }))

      const customerAddress = [
        formData.address.trim(),
        formData.reference.trim()
      ]
        .filter(Boolean)
        .join('\nReferencia: ')

      const body = {
        customer_phone: formData.phone.trim(),
        customer_address: customerAddress,
        payment_method: formData.paymentMethod,
        payment_test_code: 'APROBAR',
        items
      }

      // La operación sigue siendo simulada.
      // No se envían números de tarjeta, CVV,
      // fecha de expiración ni titular al servidor.

      if (formData.paymentMethod === PAYMENT_METHODS.card) {
        body.payment_card_brand = cardBrand
        body.payment_test_card =
          cardBrand === 'visa'
            ? 'VISA_TEST'
            : 'MASTERCARD_TEST'
      }

      const response = await fetch(
        `${API_URL}/api/orders`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(body)
        }
      )

      const data = await response
        .json()
        .catch(() => ({}))

      if (response.status === 401) {
        navigate('/login', {
          state: { from: '/checkout' }
        })
        return
      }

      if (!response.ok) {
        throw new Error(
          data.message ||
          data.error ||
          'No se pudo registrar el pedido.'
        )
      }

      if (
        data.simulated !== true ||
        data.payment_status !== 'aprobado_simulado'
      ) {
        throw new Error(
          'El servidor no confirmó el pedido simulado.'
        )
      }

      const orderId = data.orderId ?? data.order?.id

      if (orderId == null) {
        throw new Error(
          'El servidor no devolvió el número del pedido.'
        )
      }

      setFormData((previous) => ({
        ...previous,
        cardNumber: '',
        cardHolder: '',
        cardExpiry: '',
        cardCvv: ''
      }))

      if (typeof clearCart === 'function') {
        clearCart()
      }

      navigate(
        `/invoice/${encodeURIComponent(orderId)}`,
        { replace: true }
      )

    } catch (err) {
      console.error('Error al registrar pedido:', err)

      setError(
        err instanceof TypeError
          ? 'No se pudo conectar con el servidor.'
          : err.message ||
            'Ocurrió un error inesperado.'
      )
    } finally {
      setLoading(false)
    }
  }

  // ==========================================
  // INTERFAZ
  // ==========================================

  return (
    <>
      <Header />
      <Navbar />

      <main className="checkout-page">
        <div className="checkout-shell">

          <section className="checkout-main">

            <div className="checkout-heading">
              <span>COMPRA EN NICA S-MART</span>
              <h1>Finalizar compra.</h1>
              <p>
                Completá tus datos de entrega
                y confirmá tu pedido.
              </p>
            </div>

            <form
              className="checkout-form"
              onSubmit={handleConfirmOrder}
            >

              {/* INFORMACIÓN DE CONTACTO */}

              <div className="checkout-card">
                <div className="section-header">
                  <h2>Información de contacto</h2>
                  <p>Datos para gestionar tu pedido.</p>
                </div>

                {user && (
                  <div className="checkout-customer">
                    <div className="checkout-customer-avatar">
                      {user.picture ? (
                        <img
                          src={user.picture}
                          alt="Perfil"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <span>👤</span>
                      )}
                    </div>

                    <div>
                      <strong>
                        {user.name ||
                          user.username ||
                          'Cliente'}
                      </strong>
                      <span>{user.email || ''}</span>
                    </div>
                  </div>
                )}

                <div className="form-grid">
                  <div className="form-group">
                    <label htmlFor="checkout-phone">
                      Número de teléfono
                    </label>

                    <input
                      id="checkout-phone"
                      name="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="+505 8888 8888"
                      autoComplete="tel"
                      maxLength={20}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* ENTREGA */}

              <div className="checkout-card">
                <div className="section-header">
                  <h2>Entrega de tu pedido</h2>
                  <p>¿Dónde querés recibir tus productos?</p>
                </div>

                <div className="form-grid">

                  <div className="form-group">
                    <label htmlFor="checkout-address">
                      Dirección de entrega
                    </label>

                    <textarea
                      id="checkout-address"
                      name="address"
                      rows={4}
                      value={formData.address}
                      onChange={handleChange}
                      placeholder="Departamento, municipio, barrio y número de casa..."
                      autoComplete="street-address"
                      maxLength={450}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="checkout-reference">
                      Referencia adicional (opcional)
                    </label>

                    <textarea
                      id="checkout-reference"
                      name="reference"
                      rows={2}
                      value={formData.reference}
                      onChange={handleChange}
                      placeholder="Frente a..., casa de portón..."
                      maxLength={500}
                    />
                  </div>

                  <div className="checkout-shipping-info">
                    <span>🚚</span>
                    <div>
                      <strong>Entrega a domicilio</strong>
                      <p>Costo de envío: {money(shipping)}</p>
                    </div>
                  </div>

                </div>
              </div>

              {/* MÉTODOS DE PAGO */}

              <div className="checkout-card">
                <div className="section-header">
                  <h2>Método de pago</h2>
                  <p>Elegí cómo registrar tu compra.</p>
                </div>

                <div className="payment-methods">

                  <label
                    className={
                      formData.paymentMethod === PAYMENT_METHODS.card
                        ? 'payment-option active'
                        : 'payment-option'
                    }
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value={PAYMENT_METHODS.card}
                      checked={
                        formData.paymentMethod === PAYMENT_METHODS.card
                      }
                      onChange={handleChange}
                    />
                    <div>
                      <strong>Tarjeta de crédito o débito</strong>
                      <span>Visa y Mastercard</span>
                    </div>
                  </label>

                  <label
                    className={
                      formData.paymentMethod === PAYMENT_METHODS.transfer
                        ? 'payment-option active'
                        : 'payment-option'
                    }
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value={PAYMENT_METHODS.transfer}
                      checked={
                        formData.paymentMethod === PAYMENT_METHODS.transfer
                      }
                      onChange={handleChange}
                    />
                    <div>
                      <strong>Transferencia bancaria</strong>
                      <span>Registro de transferencia</span>
                    </div>
                  </label>
                </div>

                {/* TARJETA */}

                {formData.paymentMethod === PAYMENT_METHODS.card && (
                  <div className="payment-box checkout-card-entry">

                    <div className="payment-box-top">
                      <div>
                        <h3>Datos de la tarjeta</h3>
                        <p className="checkout-card-subtitle">
                          La marca se detecta automáticamente
                          al escribir.
                        </p>
                      </div>

                      <div className="card-brands">
                        <span
                          className={
                            cardBrand === 'visa' ? 'selected-brand' : ''
                          }
                        >
                          VISA
                        </span>

                        <span
                          className={
                            cardBrand === 'mastercard'
                              ? 'selected-brand'
                              : ''
                          }
                        >
                          Mastercard
                        </span>
                      </div>
                    </div>

                    <div className="form-group">
                      <label htmlFor="checkout-card-number">
                        Número de tarjeta
                      </label>

                      <div className="checkout-card-number-wrapper">
                        <input
                          id="checkout-card-number"
                          name="cardNumber"
                          type="text"
                          inputMode="numeric"
                          autoComplete="off"
                          value={formData.cardNumber}
                          onChange={handleChange}
                          placeholder="0000 0000 0000 0000"
                          maxLength={19}
                          required
                        />

                        <span className="checkout-detected-brand">
                          {cardBrand === 'visa'
                            ? 'VISA'
                            : cardBrand === 'mastercard'
                              ? 'Mastercard'
                              : '💳'}
                        </span>
                      </div>
                    </div>

                    {/* TITULAR, VENCIMIENTO Y CVV */}

                    <div className="checkout-card-extra-fields">
                      <div className="form-group">
                        <label htmlFor="checkout-card-holder">
                          Nombre del titular
                        </label>

                        <input
                          id="checkout-card-holder"
                          name="cardHolder"
                          type="text"
                          placeholder="Nombre y apellido"
                          autoComplete="off"
                          value={formData.cardHolder}
                          onChange={handleChange}
                          maxLength={70}
                          required
                        />
                      </div>

                      <div className="form-grid two-columns">
                        <div className="form-group">
                          <label htmlFor="checkout-card-expiry">
                            Fecha de vencimiento
                          </label>

                          <input
                            id="checkout-card-expiry"
                            name="cardExpiry"
                            type="text"
                            inputMode="numeric"
                            placeholder="MM/AA"
                            autoComplete="off"
                            value={formData.cardExpiry}
                            onChange={handleChange}
                            maxLength={5}
                            required
                          />
                        </div>

                        <div className="form-group">
                          <label htmlFor="checkout-card-cvv">
                            Código de seguridad (CVV)
                          </label>

                          <input
                            id="checkout-card-cvv"
                            name="cardCvv"
                            type="password"
                            inputMode="numeric"
                            placeholder="•••"
                            autoComplete="off"
                            value={formData.cardCvv}
                            onChange={handleChange}
                            maxLength={3}
                            required
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* TRANSFERENCIA */}

                {formData.paymentMethod === PAYMENT_METHODS.transfer && (
                  <div className="payment-box">
                    <h3>Transferencia bancaria</h3>

                    <p className="checkout-payment-description">
                      Referencia indicada:{' '}
                      <strong>{TRANSFER_REFERENCE}</strong>.
                      {' '}No realicés transferencias:
                      el pedido se registra sin mover dinero.
                    </p>

                    <button
                      type="button"
                      className="checkout-copy-reference"
                      onClick={async () => {
                        try {
                          await navigator.clipboard.writeText(
                            TRANSFER_REFERENCE
                          )
                        } catch {
                          setError('No se pudo copiar la referencia.')
                        }
                      }}
                    >
                      Copiar referencia
                    </button>
                  </div>
                )}
              </div>

              <p className="checkout-demo-disclosure">
                Entorno de demostración. No se realizan cobros
                reales. No ingresés datos bancarios auténticos.
              </p>

              {error && (
                <div className="checkout-alert error" role="alert">
                  {error}
                </div>
              )}

              <div className="checkout-actions">
                <button
                  type="submit"
                  className="pay-button"
                  disabled={loading || cartItems.length === 0}
                >
                  {loading
                    ? 'Registrando pedido...'
                    : `Confirmar pedido · ${money(estimatedTotal)}`}
                </button>

                <Link to="/cart" className="back-to-cart">
                  ← Volver al carrito
                </Link>
              </div>
            </form>
          </section>

          {/* RESUMEN DEL PEDIDO */}

          <aside className="checkout-summary">
            <div className="summary-card">
              <h2>Tu pedido</h2>

              <div className="summary-meta">
                <span>
                  {itemCount}{' '}
                  {itemCount === 1 ? 'artículo' : 'artículos'}
                </span>
                <span>NICA S-MART</span>
              </div>

              <div className="summary-items">
                {cartItems.length > 0 ? (
                  cartItems.map((item) => {
                    const productId = String(
                      item.id ?? item.product_id
                    )

                    const productWithImage = getProductImage(item)
                      ? item
                      : {
                          ...item,
                          ...catalogImages[productId]
                        }

                    return (
                      <div className="summary-item" key={productId}>
                        <div className="checkout-summary-image">
                          <ProductThumbnail
                            product={productWithImage}
                          />
                        </div>

                        <div className="summary-item-info">
                          <strong>{item.name}</strong>
                          <span>
                            Cantidad: {item.quantity || 1}
                          </span>

                          <div className="summary-item-price">
                            {money(
                              Number(item.price) *
                              (Number(item.quantity) || 1)
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })
                ) : (
                  <p className="empty-summary">
                    No hay productos en el carrito.
                  </p>
                )}
              </div>

              <div className="summary-totals">
                <div>
                  <span>Subtotal</span>
                  <strong>{money(subtotal)}</strong>
                </div>
                <div>
                  <span>Envío</span>
                  <strong>{money(shipping)}</strong>
                </div>
                <div className="summary-total-final">
                  <span>Total estimado</span>
                  <strong>{money(estimatedTotal)}</strong>
                </div>
              </div>

              <div className="summary-security">
                <span>📦</span>
                <p>
                  Los precios y las existencias se
                  verificarán al confirmar el pedido.
                </p>
              </div>

              <p className="checkout-small-note">
                El total definitivo será confirmado
                por nuestro servidor.
              </p>
            </div>
          </aside>
        </div>
      </main>

      <Footer />
    </>
  )
}

export default Checkout
