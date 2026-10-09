
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import Header from '../components/Header'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

import { useCart } from '../context/CartContext'

import '../styles/checkout.css'

const API_URL = (
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV ? 'http://localhost:3000' : '')
).trim().replace(/\/$/, '')

function Checkout() {
  const navigate = useNavigate()

  const { cartItems, cartTotal } = useCart()

  // ==========================================
  // DATOS DEL CLIENTE
  // ==========================================

  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(null)

  // ==========================================
  // OBTENER USUARIO
  // ==========================================

  const getUser = () => {
    try {
      const savedUser = localStorage.getItem('user')
      return savedUser ? JSON.parse(savedUser) : null
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
  // CONFIRMAR PEDIDO
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

    if (!API_URL) {
      setError('El servidor no está configurado.')
      return
    }

    setLoading(true)

    try {
      // Solo enviar los identificadores y cantidades.
      // El backend consulta los precios reales.
      const items = cartItems.map((item) => ({
        product_id: item.id,
        quantity: Number(item.quantity)
      }))

      const response = await fetch(
        `${API_URL}/api/orders`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            customer_phone: phone.trim(),
            customer_address: address.trim(),
            items
          })
        }
      )

      const data = await response.json().catch(() => ({}))

      if (response.status === 401) {
        navigate('/login', {
          state: { from: '/cart' }
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

      // Mostrar confirmación real del backend.
      setSuccess({
        orderId: data.orderId,
        total: data.total
      })

    } catch (err) {
      console.error('Error al confirmar pedido:', err)

      setError(
        err instanceof TypeError
          ? 'No se pudo conectar con el servidor.'
          : err.message || 'Error procesando el pedido.'
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

              <h1>¡Pedido registrado!</h1>

              <p>
                Hemos recibido tu pedido en NICA S-MART.
              </p>

              <h2>
                Pedido #{success.orderId}
              </h2>

              <p>
                Total registrado: C$ {
                  Number(success.total).toLocaleString()
                }
              </p>

              <p>
                El registro del pedido no significa
                que se haya realizado un cobro.
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

  return (
    <>
      <Header />
      <Navbar />

      <main className="checkout-page">
        <section className="checkout-container">

          <div className="checkout-heading">
            <h1>Finalizar compra</h1>

            <p>
              Confirma tus datos para registrar tu pedido.
            </p>
          </div>

          <div className="checkout-layout">

            {/* ==========================
                DATOS DE ENTREGA
            ========================== */}

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
                    onChange={(e) => setPhone(e.target.value)}
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
                    onChange={(e) => setAddress(e.target.value)}
                    maxLength={500}
                    autoComplete="street-address"
                    required
                  />
                </div>

                {error && (
                  <div className="checkout-error" role="alert">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  className="checkout-submit"
                  disabled={
                    loading ||
                    cartItems.length === 0
                  }
                >
                  {loading
                    ? 'Registrando pedido...'
                    : 'Confirmar pedido'}
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

            {/* ==========================
                RESUMEN DEL PEDIDO
            ========================== */}

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
                        C$ {
                          (
                            Number(item.price) *
                            Number(item.quantity)
                          ).toLocaleString()
                        }
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
                Los precios y la disponibilidad serán
                verificados por el servidor al confirmar.
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
