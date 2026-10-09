
import { useNavigate } from 'react-router-dom'
import Header from '../components/Header'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { useCart } from '../context/CartContext'
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

  // ==========================================
  // CALCULAR TOTAL DE COMPRA
  // ==========================================
  const shipping = cartItems.length > 0 ? 150 : 0
  const total = cartTotal + shipping

  // ==========================================
  // VERIFICAR INICIO DE SESIÓN
  // ==========================================
  const isAuthenticated = () => {
    const token = localStorage.getItem('token')

    return Boolean(token && token.trim())
  }

  // ==========================================
  // PROCEDER AL PAGO
  // ==========================================
  const handleCheckout = () => {
    // No permitir compras con el carrito vacío
    if (cartItems.length === 0) return

    // Verificar si el usuario ha iniciado sesión
    if (!isAuthenticated()) {
      // Redirigir directamente al Login
      navigate('/login', {
        state: {
          from: '/cart',
        },
      })

      return
    }

    // Usuario con sesión iniciada
    // Aquí conectaremos el pago posteriormente
    alert('Sesión iniciada. Puedes continuar con tu compra.')
  }

  return (
    <>
      <Header />
      <Navbar />

      <main className="cart-page">
        <section className="cart-container">

          {/* PRODUCTOS DEL CARRITO */}

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
                      <img
                        src={image}
                        alt={item.name}
                      />
                    </div>

                    <div className="cart-item-info">
                      <h3>{item.name}</h3>

                      <p className="cart-item-price">
                        C$ {Number(item.price).toLocaleString()}
                      </p>

                      <div className="cart-quantity">
                        <button
                          type="button"
                          onClick={() =>
                            decreaseQuantity(item.id)
                          }
                        >
                          -
                        </button>

                        <span>{item.quantity}</span>

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

                    <div className="cart-item-total">
                      <strong>
                        C$ {(Number(item.price) * item.quantity).toLocaleString()}
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
                <h2>Tu carrito está vacío</h2>

                <p>
                  Agrega productos para comenzar tu compra.
                </p>

                <button
                  type="button"
                  onClick={() => navigate('/products')}
                >
                  Ver productos
                </button>
              </div>
            )}
          </div>

          {/* RESUMEN DE COMPRA */}

          <aside className="cart-summary">
            <h2>Resumen de compra</h2>

            <div className="summary-row">
              <span>Subtotal</span>

              <strong>
                C$ {cartTotal.toLocaleString()}
              </strong>
            </div>

            <div className="summary-row">
              <span>Envío</span>

              <strong>
                C$ {shipping.toLocaleString()}
              </strong>
            </div>

            <div className="summary-divider"></div>

            <div className="summary-total">
              <span>Total</span>

              <strong>
                C$ {total.toLocaleString()}
              </strong>
            </div>

            {/* BOTÓN PROCEDER AL PAGO */}

            <button
              type="button"
              className="checkout-button"
              disabled={cartItems.length === 0}
              onClick={handleCheckout}
            >
              Proceder al pago
            </button>

            {/* BOTÓN SEGUIR COMPRANDO */}

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
