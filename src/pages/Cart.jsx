import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Header from '../components/Header'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { useCart } from '../context/CartContext'
import { createOrder } from '../services/ordersService'
import '../styles/cart.css'

function Cart() {
  const navigate = useNavigate()

  const {
    cartItems,
    increaseQuantity,
    decreaseQuantity,
    removeProduct,
    cartTotal,
  } = useCart()

  // Datos del cliente
  const [customerName, setCustomerName] = useState('')
  const [customerEmail, setCustomerEmail] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [customerAddress, setCustomerAddress] = useState('')
  const [loading, setLoading] = useState(false)

  const shipping = cartItems.length > 0 ? 150 : 0
  const total = cartTotal + shipping

  const handleCheckout = async () => {
    if (cartItems.length === 0) return

    // Validaciones simples
    if (!customerName.trim() || !customerEmail.trim() || !customerAddress.trim()) {
      alert('Por favor, completa tu nombre, correo y dirección')
      return
    }

    setLoading(true)

    try {
      const orderData = {
        customer_name: customerName,
        customer_email: customerEmail,
        customer_phone: customerPhone,
        customer_address: customerAddress,
        subtotal: cartTotal,
        shipping: shipping,
        total: total,
        items: cartItems.map((item) => ({
          product_id: item.id,
          product_name: item.name,
          price: Number(item.price),
          quantity: item.quantity,
        })),
      }

      const order = await createOrder(orderData)

      alert(`¡Compra realizada! Orden #${order.orderId}`)
      navigate('/')
    } catch (error) {
      console.error('Error al procesar compra:', error)
      alert(error.message || 'No se pudo realizar la compra')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Header />
      <Navbar />

      <main className="cart-page">
        <section className="cart-container">
          <div className="cart-products">
            <div className="cart-title">
              <h1>Tu carrito</h1>
              <p>{cartItems.length} productos</p>
            </div>

            {cartItems.length > 0 ? (
              cartItems.map((item) => {
                const image = item.images?.[0] || item.image
                return (
                  <div key={item.id} className="cart-item">
                    <div className="cart-item-image">
                      <img src={image} alt={item.name} />
                    </div>

                    <div className="cart-item-info">
                      <h3>{item.name}</h3>
                      <p className="cart-item-price">
                        C$ {Number(item.price).toLocaleString()}
                      </p>

                      <div className="cart-quantity">
                        <button type="button" onClick={() => decreaseQuantity(item.id)}>
                          -
                        </button>
                        <span>{item.quantity}</span>
                        <button type="button" onClick={() => increaseQuantity(item.id)}>
                          +
                        </button>
                      </div>
                    </div>

                    <div className="cart-item-total">
                      <strong>
                        C$ {(Number(item.price) * item.quantity).toLocaleString()}
                      </strong>
                      <button
                        type="button"
                        className="remove-button"
                        onClick={() => removeProduct(item.id)}
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="empty-cart">
                <h2>Tu carrito está vacío</h2>
                <p>Agrega productos para comenzar tu compra.</p>
                <button type="button" onClick={() => navigate('/products')}>
                  Ver productos
                </button>
              </div>
            )}
          </div>

          <aside className="cart-summary">
            <h2>Resumen de compra</h2>

            {/* ✅ Formulario de datos del cliente */}
            {cartItems.length > 0 && (
              <div className="checkout-form">
                <h3>Datos de envío</h3>

                <input
                  type="text"
                  placeholder="Nombre completo"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  required
                />

                <input
                  type="email"
                  placeholder="Correo electrónico"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  required
                />

                <input
                  type="tel"
                  placeholder="Teléfono"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                />

                <input
                  type="text"
                  placeholder="Dirección de envío"
                  value={customerAddress}
                  onChange={(e) => setCustomerAddress(e.target.value)}
                  required
                />
              </div>
            )}

            <div className="summary-row">
              <span>Subtotal</span>
              <strong>C$ {cartTotal.toLocaleString()}</strong>
            </div>

            <div className="summary-row">
              <span>Envío</span>
              <strong>C$ {shipping.toLocaleString()}</strong>
            </div>

            <div className="summary-divider"></div>

            <div className="summary-total">
              <span>Total</span>
              <strong>C$ {total.toLocaleString()}</strong>
            </div>

            <button
              type="button"
              className="checkout-button"
              disabled={cartItems.length === 0 || loading}
              onClick={handleCheckout}
            >
              {loading ? 'Procesando...' : 'Proceder al pago'}
            </button>

            <button
              type="button"
              className="continue-shopping"
              onClick={() => navigate('/products')}
            >
              Seguir comprando
            </button>
          </aside>
        </section>
      </main>

      <Footer />
    </>
  )
}

export default Cart