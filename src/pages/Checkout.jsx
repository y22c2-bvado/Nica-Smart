
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import Header from '../components/Header'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { useCart } from '../context/CartContext'

import '../styles/checkout.css'

// ==========================================
// CONFIGURACIÓN API
// ==========================================

const API_URL = (
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV ? 'http://localhost:3000' : '')
).trim().replace(/\/$/, '')

// ==========================================
// RF-12: TARJETAS DE DEMOSTRACIÓN
// ==========================================

const TEST_CARDS = {
  '4111111111111111': {
    brand: 'visa',
    testId: 'VISA_TEST'
  },
  '5555555555554444': {
    brand: 'mastercard',
    testId: 'MASTERCARD_TEST'
  }
}

const SELECT_STYLE = {
  width: '100%',
  padding: '14px',
  borderRadius: '8px',
  border: '1px solid #d4dceb',
  background: '#fff',
  color: '#10244a',
  fontSize: '15px'
}

const digitsOnly = (value) =>
  value.replace(/\D/g, '')

const formatCardNumber = (value) =>
  digitsOnly(value)
    .slice(0, 16)
    .replace(/(.{4})/g, '$1 ')
    .trim()

const formatExpiration = (value) => {
  const digits = digitsOnly(value).slice(0, 4)

  return digits.length > 2
    ? `${digits.slice(0, 2)}/${digits.slice(2)}`
    : digits
}

const isValidExpiration = (value) => {
  if (!/^\d{2}\/\d{2}$/.test(value)) {
    return false
  }

  const [month, year] = value.split('/').map(Number)

  // Solo aceptar 12/30 en esta demostración.
  return month === 12 && year === 30
}

function Checkout() {
  const navigate = useNavigate()

  const {
    cartItems,
    cartTotal
  } = useCart()

  // ==========================================
  // DATOS DEL CLIENTE
  // ==========================================

  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')

  // ==========================================
  // RF-12: ESTADOS DEL PAGO SIMULADO
  // ==========================================

  const [paymentMethod, setPaymentMethod] = useState(
    'tarjeta_simulada'
  )

  const [cardNumber, setCardNumber] = useState('')
  const [cardExpiration, setCardExpiration] = useState('')
  const [cardCvv, setCardCvv] = useState('')
  const [testCode, setTestCode] = useState('APROBAR')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(null)

  // ==========================================
  // IDENTIFICACIÓN AUTOMÁTICA
  // ==========================================

  const cardDigits = digitsOnly(cardNumber)
  const testCard = TEST_CARDS[cardDigits] || null

  const cardBrand = testCard?.brand || null
  const paymentTestCard = testCard?.testId || null

  // ==========================================
  // OBTENER USUARIO
  // ==========================================

  const getUser = () => {
    try {
      const savedUser = localStorage.getItem('user')

      return savedUser
        ? JSON.parse(savedUser)
        : null
    } catch {
      return null
    }
  }

  const user = getUser()

  // ==========================================
  // TOTALES ESTIMADOS
  // ==========================================

  const shipping = cartItems.length > 0 ? 150 : 0
  const total = cartTotal + shipping

  // ==========================================
  // VALIDAR PAGO SIMULADO
  // ==========================================

  const validatePayment = () => {
    if (paymentMethod === 'transferencia_simulada') {
      return true
    }

    if (!testCard) {
      setError(
        'Utiliza una tarjeta ficticia Visa o Mastercard autorizada.'
      )
      return false
    }

    if (!isValidExpiration(cardExpiration)) {
      setError(
        'Utiliza el vencimiento de prueba 12/30.'
      )
      return false
    }

    if (cardCvv !== '123') {
      setError(
        'El CVV ficticio de demostración es 123.'
      )
      return false
    }

    return true
  }

  // ==========================================
  // RF-12: CONFIRMAR PEDIDO Y SIMULAR PAGO
  // ==========================================

  const handleConfirmOrder = async (event) => {
    event.preventDefault()

    if (loading || success) return

    setError('')

    const token = localStorage.getItem('token')

    if (!token) {
      navigate('/login', {
        state: { from: '/cart' }
      })
      return
    }

    if (cartItems.length === 0) {
      setError('Tu carrito está vacío.')
      return
    }

    if (!phone.trim() || !address.trim()) {
      setError(
        'Ingresa tu teléfono y dirección de entrega.'
      )
      return
    }

    if (!validatePayment()) return

    if (!API_URL) {
      setError('El servidor no está configurado.')
      return
    }

    setLoading(true)

    try {
      // Enviar solamente ID y cantidad de productos.
      const items = cartItems.map((item) => ({
        product_id: item.id,
        quantity: Number(item.quantity)
      }))

      // ======================================
      // CONSTRUIR SOLICITUD DE PAGO
      // ======================================

      const body = {
        customer_phone: phone.trim(),
        customer_address: address.trim(),
        payment_method: paymentMethod,
        payment_test_code: testCode,
        items
      }

      // ======================================
      // IDENTIFICADOR DE TARJETA FICTICIA
      // COMPATIBLE CON orders.js
      // ======================================

      if (paymentMethod === 'tarjeta_simulada') {
        body.payment_card_brand = cardBrand
        body.payment_test_card = paymentTestCard
      }

      // No enviar número completo, CVV ni vencimiento.
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

      // ======================================
      // VERIFICAR SESIÓN
      // ======================================

      if (response.status === 401) {
        navigate('/login', {
          state: { from: '/cart' }
        })
        return
      }

      // ======================================
      // PAGO RECHAZADO O ERROR
      // ======================================

      if (!response.ok) {
        throw new Error(
          data.message ||
          data.error ||
          'No se pudo procesar el pago simulado.'
        )
      }

      // ======================================
      // CONFIRMACIÓN DEL BACKEND
      // ======================================

      if (
        data.simulated !== true ||
        data.payment_status !== 'aprobado_simulado'
      ) {
        throw new Error(
          'El backend no confirmó correctamente el pago simulado.'
        )
      }

      setSuccess({
        orderId: data.orderId,
        total: data.total,
        paymentMethod: data.payment_method,
        paymentStatus: data.payment_status,
        paymentReference: data.payment_reference,
        cardBrand: data.payment_card_brand
      })

      // Limpiar los datos ficticios.
      setCardNumber('')
      setCardExpiration('')
      setCardCvv('')

    } catch (err) {
      console.error('Error del checkout:', err)

      setError(
        err instanceof TypeError
          ? 'No se pudo conectar con el servidor.'
          : err.message || 'Error al procesar el pedido.'
      )

    } finally {
      setLoading(false)
    }
  }

  // ==========================================
  // PEDIDO CONFIRMADO
  // ==========================================

  if (success) {
    return (
      <>
        <Header />
        <Navbar />

        <main className="checkout-page">
          <section className="checkout-container">
            <div className="checkout-card checkout-success">

              <div className="checkout-success-icon">
                ✓
              </div>

              <h1>¡Pago simulado aprobado!</h1>

              <p>
                Tu pedido fue registrado correctamente
                en NICA S-MART.
              </p>

              <h2>
                Pedido #{success.orderId}
              </h2>

              <p>
                Total: C${' '}
                {Number(success.total).toLocaleString()}
              </p>

              <p>
                Método de pago:{' '}
                {success.paymentMethod === 'tarjeta_simulada'
                  ? 'Tarjeta simulada'
                  : 'Transferencia simulada'}
              </p>

              {success.cardBrand && (
                <p>
                  Tarjeta:{' '}
                  {success.cardBrand === 'visa'
                    ? 'Visa'
                    : 'Mastercard'}
                </p>
              )}

              <p>
                Estado: Aprobado (simulación)
              </p>

              {success.paymentReference && (
                <p>
                  Referencia: {success.paymentReference}
                </p>
              )}

              <p>
                Esta operación es una demostración académica.
                No se realizó ningún cobro real.
              </p>

              <button
                type="button"
                className="checkout-submit"
                onClick={() => navigate('/')}
              >
                Volver al inicio
              </button>

            </div>
          </section>
        </main>

        <Footer />
      </>
    )
  }

  // ==========================================
  // FORMULARIO DE CHECKOUT
  // ==========================================

  return (
    <>
      <Header />
      <Navbar />

      <main className="checkout-page">
        <section className="checkout-container">

          <div className="checkout-heading">
            <h1>Finalizar compra</h1>

            <p>
              Completa tus datos y realiza una
              simulación de pago.
            </p>
          </div>

          <div className="checkout-layout">

            {/* DATOS DE ENTREGA */}

            <div className="checkout-card">

              <h2>Datos de entrega</h2>

              {user && (
                <div className="checkout-user">
                  <span>👤</span>

                  <div>
                    <strong>
                      {user.name || 'Cliente'}
                    </strong>
                    <p>{user.email}</p>
                  </div>
                </div>
              )}

              <form onSubmit={handleConfirmOrder}>

                <div className="checkout-field">
                  <label htmlFor="checkout-phone">
                    Número telefónico
                  </label>

                  <input
                    id="checkout-phone"
                    type="tel"
                    placeholder="Ej. 8888-8888"
                    value={phone}
                    onChange={(e) =>
                      setPhone(e.target.value)
                    }
                    maxLength={30}
                    autoComplete="tel"
                    required
                  />
                </div>

                <div className="checkout-field">
                  <label htmlFor="checkout-address">
                    Dirección de entrega
                  </label>

                  <textarea
                    id="checkout-address"
                    rows="4"
                    placeholder="Departamento, municipio, barrio y referencias"
                    value={address}
                    onChange={(e) =>
                      setAddress(e.target.value)
                    }
                    maxLength={500}
                    autoComplete="street-address"
                    required
                  />
                </div>

                {/* RF-12: MÉTODO DE PAGO */}

                <h2 style={{ marginTop: '25px' }}>
                  Método de pago
                </h2>

                <div className="checkout-field">
                  <label htmlFor="payment-method">
                    Selecciona tu método
                  </label>

                  <select
                    id="payment-method"
                    style={SELECT_STYLE}
                    value={paymentMethod}
                    onChange={(e) => {
                      setPaymentMethod(e.target.value)
                      setError('')
                    }}
                  >
                    <option value="tarjeta_simulada">
                      Tarjeta de crédito/débito
                    </option>

                    <option value="transferencia_simulada">
                      Transferencia bancaria
                    </option>
                  </select>
                </div>

                {/* TARJETA SIMULADA */}

                {paymentMethod === 'tarjeta_simulada' && (
                  <div
                    style={{
                      padding: '18px',
                      border: '1px solid #dbe4f0',
                      borderRadius: '12px',
                      marginBottom: '20px'
                    }}
                  >
                    <h3>
                      Datos de tarjeta de prueba
                    </h3>

                    <p style={{
                      color: '#64748b',
                      fontSize: '13px'
                    }}>
                      Utiliza solamente las tarjetas
                      ficticias indicadas.
                    </p>

                    <div className="checkout-field">
                      <label htmlFor="test-card-number">
                        Número de tarjeta simulada
                      </label>

                      <input
                        id="test-card-number"
                        type="text"
                        inputMode="numeric"
                        autoComplete="off"
                        placeholder="0000 0000 0000 0000"
                        value={cardNumber}
                        onChange={(e) =>
                          setCardNumber(
                            formatCardNumber(e.target.value)
                          )
                        }
                        maxLength={19}
                        required
                      />
                    </div>

                    {/* IDENTIFICACIÓN DE VISA O MASTERCARD */}

                    <div
                      style={{
                        marginBottom: '18px',
                        fontWeight: 600,
                        color: cardBrand
                          ? '#167346'
                          : '#64748b'
                      }}
                    >
                      {cardBrand
                        ? `✓ Tarjeta ${
                            cardBrand === 'visa'
                              ? 'Visa'
                              : 'Mastercard'
                          } identificada`
                        : 'Tarjeta de prueba no identificada'}
                    </div>

                    {/* VENCIMIENTO Y CVV FICTICIOS */}

                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: '12px'
                    }}>
                      <div className="checkout-field">
                        <label htmlFor="test-expiration">
                          Vencimiento (MM/AA)
                        </label>

                        <input
                          id="test-expiration"
                          type="text"
                          inputMode="numeric"
                          autoComplete="off"
                          placeholder="12/30"
                          value={cardExpiration}
                          onChange={(e) =>
                            setCardExpiration(
                              formatExpiration(e.target.value)
                            )
                          }
                          maxLength={5}
                          required
                        />
                      </div>

                      <div className="checkout-field">
                        <label htmlFor="test-cvv">
                          CVV ficticio
                        </label>

                        <input
                          id="test-cvv"
                          type="text"
                          inputMode="numeric"
                          autoComplete="off"
                          placeholder="123"
                          value={cardCvv}
                          onChange={(e) =>
                            setCardCvv(
                              digitsOnly(e.target.value)
                                .slice(0, 3)
                            )
                          }
                          maxLength={3}
                          required
                        />
                      </div>
                    </div>

                    {/* DATOS DE PRUEBA */}

                    <div style={{
                      background: '#f1f5f9',
                      padding: '12px',
                      borderRadius: '8px',
                      fontSize: '13px',
                      lineHeight: 1.8
                    }}>
                      <strong>
                        Tarjetas disponibles:
                      </strong>

                      <div>
                        Visa: 4111 1111 1111 1111
                      </div>

                      <div>
                        Mastercard: 5555 5555 5555 4444
                      </div>

                      <div>
                        Vencimiento: 12/30
                      </div>

                      <div>
                        CVV ficticio: 123
                      </div>
                    </div>
                  </div>
                )}

                {/* TRANSFERENCIA SIMULADA */}

                {paymentMethod === 'transferencia_simulada' && (
                  <div style={{
                    padding: '18px',
                    background: '#f1f5f9',
                    borderRadius: '10px',
                    marginBottom: '20px'
                  }}>
                    <h3>
                      Transferencia de demostración
                    </h3>

                    <p>
                      El sistema simulará una transferencia
                      bancaria sin cuentas ni fondos reales.
                    </p>

                    <p>
                      No es necesario ingresar información
                      bancaria.
                    </p>
                  </div>
                )}

                {/* RESULTADO DE LA SIMULACIÓN */}

                <div className="checkout-field">
                  <label htmlFor="payment-result">
                    Resultado de la simulación
                  </label>

                  <select
                    id="payment-result"
                    value={testCode}
                    onChange={(e) =>
                      setTestCode(e.target.value)
                    }
                    style={SELECT_STYLE}
                  >
                    <option value="APROBAR">
                      Aprobar pago de prueba
                    </option>

                    <option value="RECHAZAR">
                      Rechazar pago de prueba
                    </option>
                  </select>
                </div>

                <p style={{
                  color: '#64748b',
                  fontSize: '13px',
                  marginBottom: '20px'
                }}>
                  🧪 Modo demostración académica.
                  No ingreses tarjetas reales.
                  No se realizará ningún cobro.
                </p>

                {/* MENSAJES DE ERROR */}

                {error && (
                  <div
                    className="checkout-error"
                    role="alert"
                  >
                    {error}
                  </div>
                )}

                {/* CONFIRMAR PAGO */}

                <button
                  type="submit"
                  className="checkout-submit"
                  disabled={
                    loading ||
                    cartItems.length === 0
                  }
                >
                  {loading
                    ? 'Procesando simulación...'
                    : 'Simular pago y confirmar pedido'}
                </button>

                <button
                  type="button"
                  className="checkout-back"
                  onClick={() => navigate('/cart')}
                  disabled={loading}
                >
                  ← Volver al carrito
                </button>

              </form>
            </div>

            {/* RESUMEN DEL PEDIDO */}

            <aside className="checkout-card checkout-summary">

              <h2>Resumen del pedido</h2>

              {cartItems.length === 0 ? (
                <p>Tu carrito está vacío.</p>
              ) : (
                cartItems.map((item) => (
                  <div
                    className="checkout-product"
                    key={item.id}
                  >
                    <img
                      src={item.images?.[0] || item.image}
                      alt={item.name}
                    />

                    <div className="checkout-product-info">
                      <strong>{item.name}</strong>

                      <small>
                        Cantidad: {item.quantity}
                      </small>

                      <span>
                        C${' '}
                        {(
                          Number(item.price) *
                          Number(item.quantity)
                        ).toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))
              )}

              <div className="checkout-totals">

                <div>
                  <span>Subtotal</span>

                  <strong>
                    C$ {cartTotal.toLocaleString()}
                  </strong>
                </div>

                <div>
                  <span>Envío</span>

                  <strong>
                    C$ {shipping.toLocaleString()}
                  </strong>
                </div>

                <div className="checkout-grand-total">
                  <span>Total estimado</span>

                  <strong>
                    C$ {total.toLocaleString()}
                  </strong>
                </div>
              </div>

              <p className="checkout-note">
                Los precios y existencias serán
                verificados por el servidor.
              </p>

              <p className="checkout-note">
                Las operaciones son simuladas.
                No se procesa dinero real.
              </p>

            </aside>
          </div>
        </section>
      </main>

      <Footer />
    </>
  )
}

export default Checkout
