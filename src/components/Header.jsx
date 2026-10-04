import { Link } from 'react-router-dom'

import { useCart } from '../context/CartContext'

import '../styles/header.css'

function Header() {
  const {
    cartCount,
    cartTotal,
  } = useCart()

  return (
    <>
      <div className="topbar">

        <div>
          🚚 Envíos a todo Nicaragua
        </div>

        <div className="topbar-links">
          <span>Ayuda</span>
          <span>Seguimiento de pedido</span>
        </div>

      </div>

      <header className="header">

        <div className="logo">

          <div className="logo-main">
            NICA
          </div>

          <div className="logo-bottom">
            S-MART
          </div>

          <span>
            TECH STORE
          </span>

        </div>

        <div className="search-container">

          <input
            type="text"
            placeholder="Buscar productos..."
          />

          <button type="button">
            🔍
          </button>

        </div>

        <div className="header-options">

          <Link
            to="/login"
            className="header-option account-link"
          >

            <div className="option-icon">
              👤
            </div>

            <div>
              <small>
                Mi cuenta
              </small>

              <strong>
                Iniciar sesión
              </strong>
            </div>

          </Link>

          <Link
            to="/cart"
            className="header-option cart-link"
          >

            <div className="option-icon">
              🛒
            </div>

            <div>

              <small>
                Carrito
              </small>

              <strong>
                C$ {cartTotal.toLocaleString()}
              </strong>

            </div>

            <span className="cart-count">
              {cartCount}
            </span>

          </Link>

        </div>

      </header>
    </>
  )
}

export default Header