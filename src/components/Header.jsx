
import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { useCart } from '../context/CartContext'

import '../styles/header.css'

function Header() {
  const { cartCount, cartTotal } = useCart()

  const navigate = useNavigate()

  const [user, setUser] = useState(null)
  const [showMenu, setShowMenu] = useState(false)

  // ==========================================
  // CARGAR USUARIO AUTENTICADO
  // ==========================================

  const loadUser = () => {
    const token = localStorage.getItem('token')
    const storedUser = localStorage.getItem('user')

    if (!token || !storedUser) {
      setUser(null)
      return
    }

    try {
      const parsedUser = JSON.parse(storedUser)
      setUser(parsedUser)
    } catch (error) {
      console.error('Error leyendo usuario:', error)
      setUser(null)
    }
  }

  useEffect(() => {
    loadUser()

    window.addEventListener('storage', loadUser)
    window.addEventListener('auth-change', loadUser)

    return () => {
      window.removeEventListener('storage', loadUser)
      window.removeEventListener('auth-change', loadUser)
    }
  }, [])

  // ==========================================
  // CERRAR SESIÓN
  // ==========================================

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    localStorage.removeItem('rememberMe')

    setUser(null)
    setShowMenu(false)

    window.dispatchEvent(new Event('auth-change'))

    navigate('/')
  }

  const userName =
    user?.name?.trim() ||
    user?.email?.split('@')[0] ||
    'Cliente'

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

          {/* ==================================
              CUENTA DEL CLIENTE
          ================================== */}

          {user ? (

            <div
              className="header-option account-link"
              style={{ position: 'relative' }}
            >

              <div className="option-icon">
                {user.picture ? (
                  <img
                    src={user.picture}
                    alt="Foto de perfil"
                    referrerPolicy="no-referrer"
                    style={{
                      width: 35,
                      height: 35,
                      borderRadius: '50%',
                      objectFit: 'cover'
                    }}
                  />
                ) : (
                  '👤'
                )}
              </div>

              <button
                type="button"
                onClick={() => setShowMenu(!showMenu)}
                aria-expanded={showMenu}
                style={{
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                  textAlign: 'left',
                  color: 'inherit',
                  font: 'inherit'
                }}
              >
                <small>
                  {userName}
                </small>

                <strong>
                  Sesión activa ▾
                </strong>
              </button>

              {showMenu && (
                <div
                  style={{
                    position: 'absolute',
                    top: '100%',
                    right: 0,
                    minWidth: 190,
                    padding: 12,
                    background: '#fff',
                    color: '#10264e',
                    borderRadius: 10,
                    boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
                    zIndex: 1000,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 12
                  }}
                >

                  <Link
                    to="/profile"
                    onClick={() => setShowMenu(false)}
                  >
                    Mi perfil
                  </Link>

                  <Link
                    to="/orders"
                    onClick={() => setShowMenu(false)}
                  >
                    Mis pedidos
                  </Link>

                  <button
                    type="button"
                    onClick={handleLogout}
                    style={{
                      border: 'none',
                      background: 'transparent',
                      color: '#d62828',
                      cursor: 'pointer',
                      textAlign: 'left',
                      font: 'inherit'
                    }}
                  >
                    Cerrar sesión
                  </button>

                </div>
              )}

            </div>

          ) : (

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

          )}

          {/* ==================================
              CARRITO
          ================================== */}

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
