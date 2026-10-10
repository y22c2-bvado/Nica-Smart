
import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { useCart } from '../context/CartContext'

import '../styles/header.css'

function Header() {
  const { cartCount, cartTotal } = useCart()
  const navigate = useNavigate()

  const [user, setUser] = useState(null)
  const [showMenu, setShowMenu] = useState(false)

  const accountRef = useRef(null)

  // ==========================================
  // CARGAR USUARIO AUTENTICADO
  // ==========================================

  useEffect(() => {
    const loadUser = () => {
      const token = localStorage.getItem('token')
      const storedUser = localStorage.getItem('user')

      if (!token || !storedUser) {
        setUser(null)
        setShowMenu(false)
        return
      }

      try {
        const parsedUser = JSON.parse(storedUser)
        const parts = token.split('.')

        if (parts.length !== 3) {
          setUser(null)
          setShowMenu(false)
          return
        }

        const encodedPayload = parts[1]
          .replace(/-/g, '+')
          .replace(/_/g, '/')

        const payload = JSON.parse(
          atob(
            encodedPayload.padEnd(
              Math.ceil(encodedPayload.length / 4) * 4,
              '='
            )
          )
        )

        if (
          !payload.exp ||
          payload.exp * 1000 <= Date.now() ||
          !parsedUser?.email
        ) {
          setUser(null)
          setShowMenu(false)
          return
        }

        // Esta información es solo visual.
        // La autorización real la comprueba el backend.
        setUser(parsedUser)

      } catch (error) {
        console.error('Error leyendo sesión:', error)
        setUser(null)
        setShowMenu(false)
      }
    }

    loadUser()

    window.addEventListener('storage', loadUser)
    window.addEventListener('auth-change', loadUser)
    window.addEventListener('focus', loadUser)

    return () => {
      window.removeEventListener('storage', loadUser)
      window.removeEventListener('auth-change', loadUser)
      window.removeEventListener('focus', loadUser)
    }
  }, [])

  // ==========================================
  // CERRAR MENÚ AL HACER CLIC FUERA
  // ==========================================

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (
        accountRef.current &&
        !accountRef.current.contains(event.target)
      ) {
        setShowMenu(false)
      }
    }

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setShowMenu(false)
      }
    }

    document.addEventListener('mousedown', handleOutsideClick)
    document.addEventListener('keydown', handleEscape)

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick)
      document.removeEventListener('keydown', handleEscape)
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

    navigate('/', { replace: true })
  }

  // ==========================================
  // INFORMACIÓN VISUAL DEL USUARIO
  // ==========================================

  const userName =
    user?.name?.trim() ||
    user?.username ||
    user?.email?.split('@')[0] ||
    'Cliente'

  const isAdmin =
    user?.provider === 'local' &&
    String(user?.role || '').toUpperCase() === 'ADMIN'

  return (
    <>
      {/* ==================================
          BARRA SUPERIOR
      ================================== */}

      <div className="topbar">
        <div>
          🚚 Envíos a todo Nicaragua
        </div>

        <div className="topbar-links">
          <span>Ayuda</span>
          <span>Seguimiento de pedido</span>
        </div>
      </div>

      {/* ==================================
          ENCABEZADO
      ================================== */}

      <header className="header">

        {/* LOGO */}

        <div className="logo">
          <div className="logo-main">
            NICA
          </div>

          <div className="logo-bottom">
            S-MART
          </div>

          <span>TECH STORE</span>
        </div>

        {/* BUSCADOR */}

        <div className="search-container">
          <input
            type="text"
            placeholder="Buscar productos..."
            aria-label="Buscar productos"
          />

          <button
            type="button"
            aria-label="Buscar"
          >
            🔍
          </button>
        </div>

        {/* ==================================
            OPCIONES DEL ENCABEZADO
        ================================== */}

        <div className="header-options">

          {/* CUENTA */}

          {user ? (
            <div
              ref={accountRef}
              className="header-option account-link"
              style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}
            >

              {/* FOTO DE PERFIL */}

              <div className="option-icon">
                {user.picture ? (
                  <img
                    src={user.picture}
                    alt="Foto de perfil"
                    referrerPolicy="no-referrer"
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: '50%',
                      objectFit: 'cover'
                    }}
                  />
                ) : (
                  '👤'
                )}
              </div>

              {/* NOMBRE Y SESIÓN */}

              <button
                type="button"
                onClick={() => setShowMenu((previous) => !previous)}
                aria-expanded={showMenu}
                aria-haspopup="menu"
                aria-label="Opciones de mi cuenta"
                style={{
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                  color: 'inherit',
                  font: 'inherit',
                  padding: 0,
                  textAlign: 'left'
                }}
              >

                <div
                  className="account-info"
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    justifyContent: 'center',
                    gap: '4px'
                  }}
                >

                  <strong
                    className="account-name"
                    style={{
                      display: 'block',
                      fontSize: '14px',
                      fontWeight: 700,
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {userName}
                  </strong>

                  <small
                    className="account-status"
                    style={{
                      display: 'block',
                      fontSize: '12px',
                      fontWeight: 600,
                      color: '#16a34a',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    ● Sesión activa ▾
                  </small>

                </div>
              </button>

              {/* ==================================
                  MENÚ DESPLEGABLE
              ================================== */}

              {showMenu && (
                <div
                  className="account-dropdown"
                  style={{
                    position: 'absolute',
                    top: '100%',
                    right: 0,
                    minWidth: 190,
                    padding: 12,
                    background: '#fff',
                    color: '#10264e',
                    borderRadius: 10,
                    boxShadow:
                      '0 8px 25px rgba(0,0,0,0.15)',
                    zIndex: 1000,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 12
                  }}
                >

                  {/* PERFIL */}

                  <Link
                    to="/profile"
                    onClick={() => setShowMenu(false)}
                  >
                    Mi perfil
                  </Link>

                  {/* PEDIDOS */}

                  <Link
                    to="/orders"
                    onClick={() => setShowMenu(false)}
                  >
                    Mis pedidos
                  </Link>

                  {/* No mostramos ningún acceso
                      administrativo en el Header.
                      El administrador entra
                      automáticamente desde Login.jsx. */}

                  {/* CERRAR SESIÓN */}

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

            /* USUARIO SIN SESIÓN */

            <Link
              to="/login"
              className="header-option account-link"
            >
              <div className="option-icon">
                👤
              </div>

              <div className="account-info">
                <small>Mi cuenta</small>
                <strong>Iniciar sesión</strong>
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
              <small>Carrito</small>

              <strong>
                C$ {Number(cartTotal || 0).toLocaleString('es-NI')}
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
