import { useNavigate } from 'react-router-dom'

import Header from '../components/Header'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { useCart } from '../context/CartContext'
import '../styles/cart.css'

const API_URL = String(
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV ? 'http://localhost:3000' : '')
).trim().replace(/\/+$/, '')

const getImageUrl = (path) => {
  if (!path) return 'https://via.placeholder.com/300x300?text=Sin+Imagen'
  
  if (path.startsWith('http') || path.startsWith('data:')) return path
  
  if (path.includes('uploads/')) {
    const filename = path.split('uploads/')[1]
    return `${API_URL}/uploads/${filename}`
  }
  
  if (!path.includes('/')) {
    return `${API_URL}/uploads/${path}`
  }
  
  return path
}

function Cart() {
  const navigate = useNavigate()

  const {
    cartItems,
    increaseQuantity,
    decreaseQuantity,
    removeProduct,
    cartTotal,
    cartSavings,
  } = useCart()

  const shipping = cartItems.length > 0 ? 150 : 0
  const total = cartTotal + shipping

  const money = (value) =>
    `C$ ${Number(value).toLocaleString('es-NI', {
      maximumFractionDigits: 0,
    })}`

  const hasActiveSession = () => {
    const token = localStorage.getItem('token')

    if (!token || !token.trim()) {
      return false
    }

    try {
      const parts = token.split('.')

      if (parts.length !== 3) {
        return false
      }

      const base64 = parts[1]
        .replace(/-/g, '+')
        .replace(/_/g, '/')

      const payload = JSON.parse(
        atob(
          base64.padEnd(
            Math.ceil(base64.length / 4) * 4,
            '='
          )
        )
      )

      if (
        typeof payload.exp !== 'number' ||
        payload.exp * 1000 <= Date.now()
      ) {
        return false
      }

      return true

    } catch (error) {
      console.error(
        'Error revisando la sesión:',
        error
      )

      return false
    }
  }

  const handleCheckout = () => {
    if (cartItems.length === 0) {
      return
    }

    if (!hasActiveSession()) {
      navigate('/login', {
        state: {
          from: '/cart',
        },
      })

      return
    }

    navigate('/checkout')
  }

  return (
    <>
      <Header />
      <Navbar />

      <main className="cart-page">

        <section className="cart-container">

          {/* ==================================
              PRODUCTOS DEL CARRITO
          ================================== */}

          <div className="cart-products">

            <div className="cart-title">
              <h1>Tu carrito</h1>

              <p>
                {cartItems.length}{' '}
                {cartItems.length === 1 ? 'producto' : 'productos'}
              </p>
            </div>

            {cartItems.length > 0 ? (

              cartItems.map((item) => {

                const image =
                  item.images?.[0] || item.image

                const price = Number(item.price)

                const original = Number(
                  item.original_price ?? item.price
                )

                const hasDiscount =
                  Number.isFinite(original) &&
                  Number.isFinite(price) &&
                  original > price

                const itemSaving = hasDiscount
                  ? (original - price) * item.quantity
                  : 0

                return (
                  <div
                    key={item.id}
                    className="cart-item"
                  >

                    {/* IMAGEN CON LA NUEVA FUNCIÓN */}

                    <div className="cart-item-image">
                      <img
                        src={getImageUrl(image)}
                        alt={item.name}
                        onError={(e) => {
                          e.target.src = 'https://via.placeholder.com/300x300?text=Error';
                        }}
                      />
                    </div>

                    {/* INFORMACIÓN */}

                    <div className="cart-item-info">

                      <h3>
                        {item.name}
                      </h3>

                      <p className="cart-item-price">
                        {hasDiscount && (
                          <del className="cart-item-price-original">
                            {money(original)}
                          </del>
                        )}

                        <span>
                          {money(price)}
                        </span>
                      </p>

                      {hasDiscount && (
                        <small className="cart-item-saving">
                          Ahorras {money(itemSaving)}
                        </small>
                      )}

                      {/* CANTIDAD */}

                      <div className="cart-quantity">

                        <button
                          type="button"
                          onClick={() =>
                            decreaseQuantity(item.id)
                          }
                        >
                          -
                        </button>

                        <span>
                          {item.quantity}
                        </span>

                        <button
                          type="button"
                          onClick={() =>
                            increaseQuantity(item.id)
                          }
                        >
                          +
                        </button>

                      </div>

                    </div>

                    {/* TOTAL DEL PRODUCTO */}

                    <div className="cart-item-total">

                      <strong>
                        {money(price * item.quantity)}
                      </strong>

                      <button
                        type="button"
                        className="remove-button"
                        onClick={() =>
                          removeProduct(item.id)
                        }
                      >
                        Eliminar
                      </button>

                    </div>

                  </div>
                )
              })

            ) : (

              <div className="empty-cart">

                <h2>
                  Tu carrito está vacío
                </h2>

                <p>
                  Agrega productos para comenzar tu compra.
                </p>

                <button
                  type="button"
                  onClick={() =>
                    navigate('/products')
                  }
                >
                  Ver productos
                </button>

              </div>

            )}

          </div>

          {/* ==================================
              RESUMEN DE COMPRA
          ================================== */}

          <aside className="cart-summary">

            <h2>
              Resumen de compra
            </h2>

            <div className="summary-row">
              <span>
                Subtotal
              </span>

              <strong>
                {money(cartTotal)}
              </strong>
            </div>

            {cartSavings > 0 && (
              <div className="summary-row summary-saving">
                <span>
                  Descuento
                </span>

                <strong style={{ color: '#2e7d32' }}>
                  − {money(cartSavings)}
                </strong>
              </div>
            )}

            <div className="summary-row">
              <span>
                Envío
              </span>

              <strong>
                {money(shipping)}
              </strong>
            </div>

            <div className="summary-divider"></div>

            <div className="summary-total">
              <span>
                Total
              </span>

              <strong>
                {money(total)}
              </strong>
            </div>

            <button
              type="button"
              className="checkout-button"
              disabled={cartItems.length === 0}
              onClick={handleCheckout}
            >
              Proceder al pago
            </button>

            <button
              type="button"
              className="continue-shopping"
              onClick={() =>
                navigate('/products')
              }
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