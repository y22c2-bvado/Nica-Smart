
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
  // CALCULAR TOTAL
  // ==========================================

  const shipping = cartItems.length > 0 ? 150 : 0
  const total = cartTotal + shipping

  // ==========================================
  // VERIFICAR SESIÓN DEL CLIENTE
  // ==========================================

  const hasActiveSession = () => {
    const token = localStorage.getItem('token')

    if (!token || !token.trim()) {
      return false
    }

    try {
      // Separar las partes del JWT
      const parts = token.split('.')

      if (parts.length !== 3) {
        return false
      }

      // Decodificar el contenido del token
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

      // Comprobar si el token expiró
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

  // ==========================================
  // PROCEDER AL PAGO
  // ==========================================

  const handleCheckout = () => {

    // No continuar con el carrito vacío
    if (cartItems.length === 0) {
      return
    }

    // ==========================================
    // CLIENTE SIN SESIÓN
    // ==========================================

    if (!hasActiveSession()) {

      // Enviar al login y regresar al carrito
      // después de iniciar sesión.
      navigate('/login', {
        state: {
          from: '/cart',
        },
      })

      return
    }

    // ==========================================
    // CLIENTE CON SESIÓN
    // ==========================================

    // Abrir la página para confirmar el pedido
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
                {cartItems.length} productos
              </p>
            </div>

            {cartItems.length > 0 ? (

              cartItems.map((item) => {

                const image =
                  item.images?.[0] || item.image

                return (
                  <div
                    key={item.id}
                    className="cart-item"
                  >

                    {/* IMAGEN */}

                    <div className="cart-item-image">
                      <img
                        src={image}
                        alt={item.name}
                      />
                    </div>

                    {/* INFORMACIÓN */}

                    <div className="cart-item-info">

                      <h3>
                        {item.name}
                      </h3>

                      <p className="cart-item-price">
                        C$ {
                          Number(
                            item.price
                          ).toLocaleString()
                        }
                      </p>

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
                        C$ {
                          (
                            Number(item.price) *
                            item.quantity
                          ).toLocaleString()
                        }
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
                C$ {cartTotal.toLocaleString()}
              </strong>

            </div>

            <div className="summary-row">

              <span>
                Envío
              </span>

              <strong>
                C$ {shipping.toLocaleString()}
              </strong>

            </div>

            <div className="summary-divider"></div>

            <div className="summary-total">

              <span>
                Total
              </span>

              <strong>
                C$ {total.toLocaleString()}
              </strong>

            </div>

            {/* ==================================
                PROCEDER AL PAGO
            ================================== */}

            <button
              type="button"
              className="checkout-button"
              disabled={cartItems.length === 0}
              onClick={handleCheckout}
            >
              Proceder al pago
            </button>

            {/* ==================================
                SEGUIR COMPRANDO
            ================================== */}

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
