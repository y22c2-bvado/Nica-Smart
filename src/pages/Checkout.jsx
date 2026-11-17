
import { useMemo, useState } from 'react'
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

const PAYMENT_METHODS = {
  card: 'tarjeta_simulada',
  transfer: 'transferencia_simulada'
}

// Solo números públicos para demostración.
// Nunca utilizar ni almacenar tarjetas reales.

const DEMO_CARDS = {
  '4111111111111111': {
    brand: 'visa',
    testId: 'VISA_TEST'
  },
  '5555555555554444': {
    brand: 'mastercard',
    testId: 'MASTERCARD_TEST'
  }
}

// ==========================================
// UTILIDADES
// ==========================================

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

function getCardBrand(number) {
  const digits = String(number || '').replace(/\D/g, '')

  if (/^4/.test(digits)) return 'visa'

  if (
    /^(5[1-5]|2(2[2-9]|[3-6]\d|7[01]|720))/.test(digits)
  ) {
    return 'mastercard'
  }

  return ''
}

function formatCardNumber(value) {
  return String(value || '')
    .replace(/\D/g, '')
    .slice(0, 16)
    .replace(/(.{4})/g, '$1 ')
    .trim()
}

// ==========================================
// IMÁGENES DE PRODUCTOS
// ==========================================

function getProductImage(product) {
  const candidates = [
    product?.images,
    product?.image_url,
    product?.image
  ]

  function extract(value) {
    if (!value) return ''

    if (Array.isArray(value)) {
      for (const item of value) {
        const result = extract(item)
        if (result) return result
      }
      return ''
    }

    if (typeof value === 'object') {
      return extract(
        value.url ||
        value.src ||
        value.image_url ||
        value.image
      )
    }

    if (typeof value !== 'string') return ''

    const trimmed = value.trim()

    if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
      try {
        return extract(JSON.parse(trimmed))
      } catch {
        return ''
      }
    }

    const first = trimmed.split(',')[0].trim()

    if (
      first.startsWith('https://') ||
      first.startsWith('http://') ||
      first.startsWith('/') ||
      first.startsWith('data:image/')
    ) {
      return first
    }

    return ''
  }

  for (const candidate of candidates) {
    const image = extract(candidate)
    if (image) return image
  }

  return ''
}

function ProductThumbnail({ product }) {
  const [failed, setFailed] = useState(false)
  const image = getProductImage(product)

  if (!image || failed) {
    return (
      <div className="checkout-product-placeholder">
        📦
      </div>
    )
  }

  return (
    <img
      src={image}
      alt={product.name || 'Producto'}
      loading="lazy"
      onError={() => setFailed(true)}
    />
  )
}

// ==========================================
// CHECKOUT PRINCIPAL
// ==========================================

function Checkout() {
  const navigate = useNavigate()

  const {
    cartItems = [],
    cartTotal = 0,
    clearCart
  } = useCart()

  const [user] = useState(getStoredUser)

  const [formData, setFormData] = useState({
    phone: '',
    address: '',
    reference: '',
    paymentMethod: PAYMENT_METHODS.card,
    cardNumber: ''
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const subtotal = Number(cartTotal) || 0
  const shipping = cartItems.length > 0 ? SHIPPING_COST : 0
  const estimatedTotal = subtotal + shipping

  const itemCount = useMemo(
    () =>
      cartItems.reduce(
        (sum, item) => sum + (Number(item.quantity) || 1),
        0
      ),
    [cartItems]
  )

  const cardDigits = formData.cardNumber.replace(/\D/g, '')
  const cardBrand = getCardBrand(formData.cardNumber)

  // ==========================================
  // CAMBIOS EN FORMULARIO
  // ==========================================

  const handleChange = (event) => {
    const { name, value } = event.target

    setFormData((previous) => ({
      ...previous,
      [name]:
        name === 'cardNumber'
          ? formatCardNumber(value)
          : value
    }))

    setError('')
  }

  const selectDemoCard = (number) => {
    setFormData((previous) => ({
      ...previous,
      cardNumber: formatCardNumber(number)
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

    const phoneDigits = formData.phone.replace(/\D/g, '')

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

    if (
      !Object.values(PAYMENT_METHODS).includes(
        formData.paymentMethod
      )
    ) {
      return 'Seleccioná un método de pago válido.'
    }

    if (formData.paymentMethod === PAYMENT_METHODS.card) {
      if (!DEMO_CARDS[cardDigits]) {
        return 'Utilizá una de las tarjetas de ejemplo disponibles.'
      }
    }

    return ''
  }

  // ==========================================
  // CREAR PEDIDO Y ABRIR FACTURA
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
        product_id: Number(item.id),
        quantity: Number(item.quantity) || 1
      }))

      const body = {
        customer_phone: formData.phone.trim(),

        customer_address: [
          formData.address.trim(),
          formData.reference.trim()
        ]
          .filter(Boolean)
          .join('\nReferencia: '),

        payment_method: formData.paymentMethod,
        payment_test_code: 'APROBAR',
        items
      }

      // Solo enviamos la marca y el código de prueba.
      // No enviamos el número de tarjeta.

      if (formData.paymentMethod === PAYMENT_METHODS.card) {
        const selectedCard = DEMO_CARDS[cardDigits]

        body.payment_card_brand = selectedCard.brand
        body.payment_test_card = selectedCard.testId
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

      const data = await response.json().catch(() => ({}))

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

      // Compatibilidad con el backend actual.
      // No significa que se haya cobrado dinero.

      if (
        data.simulated !== true ||
        data.payment_status !== 'aprobado_simulado'
      ) {
        throw new Error(
          'El servidor no confirmó el pedido de demostración.'
        )
      }

      const orderId = data.orderId ?? data.order?.id

      if (orderId == null) {
        throw new Error(
          'El servidor no devolvió el número del pedido.'
        )
      }

      // ======================================
      // COMPRA CONFIRMADA
      // ======================================

      if (typeof clearCart === 'function') {
        clearCart()
      }

      // ======================================
      // REDIRECCIÓN AUTOMÁTICA A LA FACTURA
      // ======================================

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
            'Ocurrió un error al registrar el pedido.'
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

          {/* COLUMNA PRINCIPAL */}

          <section className="checkout-main">

            <div className="checkout-heading">
              <span>COMPRA EN NICA S-MART</span>

              <h1>Finalizar compra.</h1>

              <p>
                Completá tus datos de entrega y confirmá
                tu pedido.
              </p>
            </div>

            <form
              className="checkout-form"
              onSubmit={handleConfirmOrder}
            >

              {/* CONTACTO */}

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

                  <p>
                    ¿Dónde querés recibir tus productos?
                  </p>
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

                      <p>
                        Costo de envío: {money(shipping)}
                      </p>
                    </div>

                  </div>

                </div>
              </div>

              {/* MÉTODO DE PAGO */}

              <div className="checkout-card">

                <div className="section-header">
                  <h2>Método de pago</h2>
                  <p>Elegí cómo registrar tu compra.</p>
                </div>

                <div className="payment-methods">

                  {/* TARJETA */}

                  <label
                    className={
                      formData.paymentMethod ===
                      PAYMENT_METHODS.card
                        ? 'payment-option active'
                        : 'payment-option'
                    }
                  >

                    <input
                      type="radio"
                      name="paymentMethod"
                      value={PAYMENT_METHODS.card}
                      checked={
                        formData.paymentMethod ===
                        PAYMENT_METHODS.card
                      }
                      onChange={handleChange}
                    />

                    <div>
                      <strong>
                        Tarjeta de crédito o débito
                      </strong>

                      <span>Visa y Mastercard</span>
                    </div>

                  </label>

                  {/* TRANSFERENCIA */}

                  <label
                    className={
                      formData.paymentMethod ===
                      PAYMENT_METHODS.transfer
                        ? 'payment-option active'
                        : 'payment-option'
                    }
                  >

                    <input
                      type="radio"
                      name="paymentMethod"
                      value={PAYMENT_METHODS.transfer}
                      checked={
                        formData.paymentMethod ===
                        PAYMENT_METHODS.transfer
                      }
                      onChange={handleChange}
                    />

                    <div>
                      <strong>Transferencia bancaria</strong>
                      <span>Registro de demostración</span>
                    </div>

                  </label>

                </div>

                {/* FORMULARIO DE TARJETA */}

                {formData.paymentMethod ===
                  PAYMENT_METHODS.card && (

                  <div className="payment-box checkout-card-entry">

                    <div className="payment-box-top">

                      <div>
                        <h3>Datos de la tarjeta</h3>

                        <p className="checkout-card-subtitle">
                          Seleccioná una tarjeta de ejemplo.
                        </p>
                      </div>

                      <div className="card-brands">

                        <span
                          className={
                            cardBrand === 'visa'
                              ? 'selected-brand'
                              : ''
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
                        Número de tarjeta de ejemplo
                      </label>

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

                      <span className="card-detection">
                        {cardBrand === 'visa'
                          ? '✓ Tarjeta Visa detectada'
                          : cardBrand === 'mastercard'
                            ? '✓ Tarjeta Mastercard detectada'
                            : 'Visa o Mastercard'}
                      </span>

                    </div>

                    {/* TARJETAS DE EJEMPLO */}

                    <div className="checkout-demo-examples">

                      <span>
                        Tarjetas disponibles para la práctica
                      </span>

                      <div className="checkout-demo-buttons">

                        <button
                          type="button"
                          onClick={() =>
                            selectDemoCard(
                              '4111111111111111'
                            )
                          }
                        >
                          Visa de ejemplo
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            selectDemoCard(
                              '5555555555554444'
                            )
                          }
                        >
                          Mastercard de ejemplo
                        </button>

                      </div>
                    </div>

                    <div className="secure-note">

                      <span>🔒</span>

                      <span>
                        Solo se aceptan tarjetas ficticias.
                        No ingresés datos bancarios reales.
                      </span>

                    </div>

                  </div>
                )}

                {/* TRANSFERENCIA */}

                {formData.paymentMethod ===
                  PAYMENT_METHODS.transfer && (

                  <div className="payment-box">

                    <h3>Transferencia bancaria</h3>

                    <p className="checkout-payment-description">
                      Esta opción registra el pedido sin
                      efectuar una transferencia de dinero.
                    </p>

                  </div>
                )}

              </div>

              <p className="checkout-demo-disclosure">
                Entorno académico de demostración.
                No se realizan cargos bancarios reales.
              </p>

              {/* ERRORES */}

              {error && (
                <div
                  className="checkout-alert error"
                  role="alert"
                >
                  {error}
                </div>
              )}

              {/* CONFIRMAR */}

              <div className="checkout-actions">

                <button
                  type="submit"
                  className="pay-button"
                  disabled={
                    loading ||
                    cartItems.length === 0
                  }
                >
                  {loading
                    ? 'Registrando pedido...'
                    : `Confirmar pedido · ${money(
                        estimatedTotal
                      )}`}
                </button>

                <Link
                  to="/cart"
                  className="back-to-cart"
                >
                  ← Volver al carrito
                </Link>

              </div>

            </form>
          </section>

          {/* ==================================
              RESUMEN DEL PEDIDO
          ================================== */}

          <aside className="checkout-summary">

            <div className="summary-card">

              <h2>Tu pedido</h2>

              <div className="summary-meta">

                <span>
                  {itemCount}{' '}
                  {itemCount === 1
                    ? 'artículo'
                    : 'artículos'}
                </span>

                <span>NICA S-MART</span>

              </div>

              <div className="summary-items">

                {cartItems.length > 0 ? (

                  cartItems.map((item) => (

                    <div
                      className="summary-item"
                      key={item.id}
                    >

                      <div className="checkout-summary-image">
                        <ProductThumbnail
                          product={item}
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

                  ))

                ) : (

                  <p className="empty-summary">
                    No hay productos en el carrito.
                  </p>

                )}

              </div>

              {/* TOTALES */}

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

                  <strong>
                    {money(estimatedTotal)}
                  </strong>

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
