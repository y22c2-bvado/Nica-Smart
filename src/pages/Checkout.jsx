
import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import Header from '../components/Header'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

import { useCart } from '../context/CartContext'

import '../styles/checkout.css'

// ==========================================
// CONFIGURACIÓN API
// ==========================================

const API_URL = String(
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV ? 'http://localhost:3000' : '')
)
  .trim()
  .replace(/\/+$/, '')

// ==========================================
// CONFIGURACIÓN DE PAGOS SIMULADOS
// ==========================================

const PAYMENT_METHODS = {
  card: 'tarjeta_simulada',
  transfer: 'transferencia_simulada'
}

const DEMO_CARDS = {
  visa: {
    brand: 'visa',
    testId: 'VISA_TEST'
  },
  mastercard: {
    brand: 'mastercard',
    testId: 'MASTERCARD_TEST'
  }
}

const SHIPPING_COST = 150

// ==========================================
// FORMATO DE MONEDA
// ==========================================

const money = (value) =>
  `C$ ${Number(value || 0).toLocaleString('es-NI', {
    maximumFractionDigits: 0
  })}`

// ==========================================
// USUARIO ALMACENADO
// ==========================================

function getStoredUser() {
  try {
    const value = localStorage.getItem('user')
    return value ? JSON.parse(value) : null
  } catch {
    return null
  }
}

// ==========================================
// OBTENER IMÁGENES DE PRODUCTOS
// SIN DEPENDER DE productImages.js
// ==========================================

function getProductImages(product) {
  if (!product) return []

  const images = []
  const seen = new Set()

  const addImage = (value) => {
    if (!value) return

    if (Array.isArray(value)) {
      value.forEach(addImage)
      return
    }

    if (typeof value === 'object') {
      addImage(
        value.url ||
        value.src ||
        value.image_url ||
        value.image
      )
      return
    }

    if (typeof value !== 'string') return

    const trimmed = value.trim()

    if (!trimmed) return

    // Permitir imágenes almacenadas como
    // JSON serializado o lista de imágenes.
    if (
      (trimmed.startsWith('[') &&
        trimmed.endsWith(']')) ||
      (trimmed.startsWith('{') &&
        trimmed.endsWith('}'))
    ) {
      try {
        addImage(JSON.parse(trimmed))
        return
      } catch {
        // Continuar como texto normal.
      }
    }

    const candidates =
      trimmed.includes(',') &&
      !trimmed.startsWith('data:')
        ? trimmed.split(',')
        : [trimmed]

    candidates.forEach((candidate) => {
      const image = candidate.trim()

      const valid =
        image.startsWith('https://') ||
        image.startsWith('http://') ||
        image.startsWith('/') ||
        image.startsWith('data:image/')

      if (valid && !seen.has(image)) {
        seen.add(image)
        images.push(image)
      }
    })
  }

  addImage(product.images)
  addImage(product.image_url)
  addImage(product.image)

  return images
}

// ==========================================
// IMAGEN DEL PRODUCTO
// ==========================================

function CheckoutProductImage({ product }) {
  const images = getProductImages(product)
  const [index, setIndex] = useState(0)

  const image = images[index]

  if (!image) {
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
      onError={() =>
        setIndex((previous) => previous + 1)
      }
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

  const [formData, setFormData] = useState({
    phone: '',
    address: '',
    reference: '',
    paymentMethod: PAYMENT_METHODS.card,
    cardBrand: 'visa'
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(null)

  // ==========================================
  // CALCULAR TOTALES
  // ==========================================

  const subtotal = Number(cartTotal) || 0

  const shipping =
    cartItems.length > 0 ? SHIPPING_COST : 0

  const estimatedTotal = subtotal + shipping

  const itemCount = useMemo(
    () =>
      cartItems.reduce(
        (sum, item) =>
          sum + (Number(item.quantity) || 1),
        0
      ),
    [cartItems]
  )

  // ==========================================
  // ACTUALIZAR FORMULARIO
  // ==========================================

  const handleChange = (event) => {
    const { name, value } = event.target

    setFormData((previous) => ({
      ...previous,
      [name]: value
    }))

    if (error) {
      setError('')
    }
  }

  // ==========================================
  // VALIDAR FORMULARIO
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
      return 'Ingresá un número de teléfono válido de Nicaragua.'
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

    if (
      formData.paymentMethod === PAYMENT_METHODS.card &&
      !DEMO_CARDS[formData.cardBrand]
    ) {
      return 'Seleccioná una tarjeta de prueba.'
    }

    return ''
  }

  // ==========================================
  // CONFIRMAR PEDIDO
  // ==========================================

  const handleConfirmOrder = async (event) => {
    event.preventDefault()

    if (loading || success) return

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
      // Los precios y el stock se validan
      // nuevamente desde PostgreSQL.

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

      // No enviar datos bancarios reales.

      if (
        formData.paymentMethod ===
        PAYMENT_METHODS.card
      ) {
        const selectedCard =
          DEMO_CARDS[formData.cardBrand]

        body.payment_card_brand =
          selectedCard.brand

        body.payment_test_card =
          selectedCard.testId
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
          'El servidor no confirmó el pedido correctamente.'
        )
      }

      const orderId =
        data.orderId ?? data.order?.id

      if (orderId == null) {
        throw new Error(
          'El servidor no devolvió el número del pedido.'
        )
      }

      const confirmedOrder = {
        orderId,
        total: data.total ?? estimatedTotal,
        paymentMethod:
          data.payment_method ??
          formData.paymentMethod,
        paymentStatus: data.payment_status,
        paymentReference:
          data.payment_reference
      }

      setSuccess(confirmedOrder)

      // Vaciar carrito únicamente después
      // de recibir confirmación del backend.

      if (typeof clearCart === 'function') {
        clearCart()
      }

    } catch (err) {
      console.error(
        'Error al confirmar pedido:',
        err
      )

      setError(
        err instanceof TypeError
          ? 'No se pudo conectar con el servidor. Revisá que el backend esté funcionando.'
          : err.message ||
            'Ocurrió un error al confirmar el pedido.'
      )
    } finally {
      setLoading(false)
    }
  }

  // ==========================================
  // PEDIDO REGISTRADO CORRECTAMENTE
  // ==========================================

  if (success) {
    return (
      <>
        <Header />
        <Navbar />

        <main className="checkout-page">
          <div className="checkout-success-page">

            <div className="checkout-success-icon">
              ✓
            </div>

            <span className="checkout-eyebrow">
              NICA S-MART
            </span>

            <h1>¡Pedido registrado!</h1>

            <p>
              Hemos recibido tu solicitud de compra.
              Ahora podés consultar los detalles y
              realizar el seguimiento del pedido.
            </p>

            <div className="checkout-order-number">
              <span>Número de pedido</span>
              <strong>#{success.orderId}</strong>
            </div>

            <div className="checkout-success-details">

              <div>
                <span>Total del pedido</span>
                <strong>
                  {money(success.total)}
                </strong>
              </div>

              <div>
                <span>Método seleccionado</span>

                <strong>
                  {success.paymentMethod ===
                    PAYMENT_METHODS.card
                    ? 'Tarjeta'
                    : 'Transferencia bancaria'}
                </strong>
              </div>

              <div>
                <span>Estado</span>
                <strong>Pedido recibido</strong>
              </div>

            </div>

            <p className="checkout-demo-disclosure">
              Este pedido se registró utilizando
              un entorno de pagos simulados.
              No se realizó ningún cobro bancario real.
            </p>

            <div className="checkout-success-actions">

              <Link
                to="/orders"
                className="pay-button"
              >
                Ver mis pedidos
              </Link>

              <Link
                to={`/tracking/${encodeURIComponent(
                  success.orderId
                )}`}
                className="back-to-cart"
              >
                Seguimiento del pedido
              </Link>

              <Link
                to="/"
                className="checkout-home-link"
              >
                Seguir comprando
              </Link>

            </div>

          </div>
        </main>

        <Footer />
      </>
    )
  }

  // ==========================================
  // FORMULARIO DE COMPRA
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
                Revisá tus datos de entrega,
                seleccioná un método de pago
                y confirmá tu pedido.
              </p>
            </div>

            <form
              className="checkout-form"
              onSubmit={handleConfirmOrder}
            >

              {/* INFORMACIÓN DEL CLIENTE */}

              <div className="checkout-card">

                <div className="section-header">
                  <h2>Información de contacto</h2>

                  <p>
                    Utilizaremos estos datos para
                    comunicarnos sobre tu pedido.
                  </p>
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

                      <span>
                        {user.email || ''}
                      </span>
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
                    Indicá dónde querés recibir
                    tus productos.
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
                      placeholder="Departamento, municipio, barrio, número de casa..."
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
                      placeholder="Casa de portón negro, frente a..."
                      maxLength={500}
                    />
                  </div>

                  <div className="checkout-shipping-info">
                    <span>🚚</span>

                    <div>
                      <strong>
                        Entrega a domicilio
                      </strong>

                      <p>
                        Costo de envío estimado:{' '}
                        {money(shipping)}
                      </p>
                    </div>
                  </div>

                </div>

              </div>

              {/* MÉTODO DE PAGO */}

              <div className="checkout-card">

                <div className="section-header">
                  <h2>¿Cómo querés pagar?</h2>

                  <p>
                    Seleccioná un método para
                    registrar tu pedido de prueba.
                  </p>
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

                      <span>
                        Visa y Mastercard (simulado)
                      </span>
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
                      <strong>
                        Transferencia bancaria
                      </strong>

                      <span>
                        Transferencia simulada
                      </span>
                    </div>
                  </label>

                </div>

                {/* TARJETAS DE PRUEBA */}

                {formData.paymentMethod ===
                  PAYMENT_METHODS.card && (

                  <div className="payment-box">

                    <div className="payment-box-top">
                      <h3>Tarjeta de prueba</h3>

                      <div className="card-brands">
                        <span>VISA</span>
                        <span>MC</span>
                      </div>
                    </div>

                    <div className="form-group">
                      <label htmlFor="card-brand">
                        Seleccionar tarjeta de prueba
                      </label>

                      <select
                        id="card-brand"
                        name="cardBrand"
                        value={formData.cardBrand}
                        onChange={handleChange}
                      >
                        <option value="visa">
                          Visa
                        </option>

                        <option value="mastercard">
                          Mastercard
                        </option>
                      </select>
                    </div>

                    <div className="secure-note">
                      <span>🔒</span>

                      <span>
                        Entorno de demostración.
                        No ingresés datos de
                        tarjetas bancarias reales.
                      </span>
                    </div>

                  </div>
                )}

                {/* TRANSFERENCIA DE PRUEBA */}

                {formData.paymentMethod ===
                  PAYMENT_METHODS.transfer && (

                  <div className="payment-box">
                    <h3>Transferencia bancaria</h3>

                    <p className="checkout-payment-description">
                      Esta opción registra una
                      transferencia simulada.
                      No se enviará ni debitará
                      dinero de ninguna cuenta bancaria.
                    </p>
                  </div>
                )}

              </div>

              {/* AVISO */}

              <p className="checkout-demo-disclosure">
                Entorno de demostración de NICA S-MART.
                Los pagos son simulados y no se realizan
                cargos reales.
              </p>

              {/* ERROR */}

              {error && (
                <div
                  className="checkout-alert error"
                  role="alert"
                >
                  {error}
                </div>
              )}

              {/* BOTONES */}

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

          {/* RESUMEN DEL PEDIDO */}

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
                        <CheckoutProductImage
                          product={item}
                        />
                      </div>

                      <div className="summary-item-info">
                        <strong>
                          {item.name}
                        </strong>

                        <span>
                          Cantidad:{' '}
                          {item.quantity || 1}
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

                  <strong>
                    {money(subtotal)}
                  </strong>
                </div>

                <div>
                  <span>Envío estimado</span>

                  <strong>
                    {money(shipping)}
                  </strong>
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
                  Los precios y existencias se
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
