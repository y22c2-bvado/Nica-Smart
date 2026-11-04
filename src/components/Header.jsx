
import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import '../styles/header.css'

// ==========================================
// COMPONENTE PRINCIPAL
// ==========================================

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
  // VERIFICAR ROL DEL ADMINISTRADOR
  // ==========================================

  const isAdmin =
    String(user?.role || '').trim().toUpperCase() === 'ADMIN'

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
  // INFORMACIÓN DEL USUARIO
  // ==========================================

  const userName =
    user?.name?.trim() ||
    user?.username ||
    user?.email?.split('@')[0] ||
    'Cliente'

  // ==========================================
  // ESTILOS DEL MENÚ
  // ==========================================

  const menuLinkStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '10px 12px',
    borderRadius: 8,
    textDecoration: 'none',
    color: '#10264e',
    fontSize: 14,
    fontWeight: 500
  }

  return (
    <>
      {/* =====================================
          BARRA SUPERIOR
      ===================================== */}

      <div className="topbar">
        <div>
          🚚 Envíos a toda Nicaragua
        </div>

        <div className="topbar-links">
          <Link
            to="/help"
            aria-label="Ir al centro de ayuda"
          >
            Ayuda
          </Link>

          <Link
            to="/tracking"
            aria-label="Consultar seguimiento de pedido"
          >
            Seguimiento de pedido
          </Link>
        </div>
      </div>

      {/* =====================================
          ENCABEZADO PRINCIPAL
      ===================================== */}

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

        {/* OPCIONES DEL ENCABEZADO */}

        <div className="header-options">

          {/* CUENTA DE USUARIO */}

          {user ? (
            <div
              ref={accountRef}
              className="header-option account-link"
              style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                gap: 10
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

              {/* BOTÓN DE CUENTA */}

              <button
                type="button"
                onClick={() =>
                  setShowMenu((previous) => !previous)
                }
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
                    gap: 4
                  }}
                >

                  <strong
                    className="account-name"
                    style={{
                      display: 'block',
                      fontSize: 14,
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
                      fontSize: 12,
                      fontWeight: 600,
                      color: '#16a34a',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    ● Sesión activa ▾
                  </small>

                </div>
              </button>

              {/* =================================
                  MENÚ DESPLEGABLE
              ================================= */}

              {showMenu && (
                <div
                  className="account-dropdown"
                  style={{
                    position: 'absolute',
                    top: '100%',
                    right: 0,
                    minWidth: 230,
                    padding: 12,
                    background: '#fff',
                    color: '#10264e',
                    border: '1px solid #e2e8f0',
                    borderRadius: 12,
                    boxShadow: '0 10px 30px rgba(0,0,0,0.16)',
                    zIndex: 1000,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 5
                  }}
                >

                  {/* ENCABEZADO DEL MENÚ */}

                  <div
                    style={{
                      padding: '8px 12px',
                      borderBottom: '1px solid #e2e8f0',
                      marginBottom: 5
                    }}
                  >
                    <strong
                      style={{
                        display: 'block',
                        fontSize: 14
                      }}
                    >
                      {userName}
                    </strong>

                    <small
                      style={{
                        display: 'block',
                        color: '#64748b',
                        fontSize: 12,
                        overflowWrap: 'anywhere'
                      }}
                    >
                      {user.email}
                    </small>
                  </div>

                  {/* =================================
                      PANEL SOLO PARA ADMIN
                  ================================= */}

                  {isAdmin && (
                    <>
                      <Link
                        to="/admin"
                        onClick={() => setShowMenu(false)}
                        style={{
                          ...menuLinkStyle,
                          background: '#eaf2ff',
                          color: '#075cd8',
                          fontWeight: 700,
                          border: '1px solid #bfdbfe'
                        }}
                      >
                        <span>🛡️</span>
                        <span>Panel de administrador</span>
                      </Link>

                      <div
                        style={{
                          height: 1,
                          background: '#e2e8f0',
                          margin: '6px 0'
                        }}
                      />
                    </>
                  )}

                  {/* MI PERFIL */}

                  <Link
                    to="/profile"
                    onClick={() => setShowMenu(false)}
                    style={menuLinkStyle}
                  >
                    <span>👤</span>
                    <span>Mi perfil</span>
                  </Link>

                  {/* MIS PEDIDOS */}

                  <Link
                    to="/orders"
                    onClick={() => setShowMenu(false)}
                    style={menuLinkStyle}
                  >
                    <span>📦</span>
                    <span>Mis pedidos</span>
                  </Link>

                  {/* SEGUIMIENTO */}

                  <Link
                    to="/tracking"
                    onClick={() => setShowMenu(false)}
                    style={menuLinkStyle}
                  >
                    <span>🚚</span>
                    <span>Seguimiento de pedido</span>
                  </Link>

                  {/* SEPARADOR */}

                  <div
                    style={{
                      height: 1,
                      background: '#e2e8f0',
                      margin: '6px 0'
                    }}
                  />

                  {/* CERRAR SESIÓN */}

                  <button
                    type="button"
                    onClick={handleLogout}
                    style={{
                      ...menuLinkStyle,
                      border: 'none',
                      background: 'transparent',
                      color: '#d62828',
                      cursor: 'pointer',
                      textAlign: 'left',
                      font: 'inherit',
                      fontSize: 14
                    }}
                  >
                    <span>🚪</span>
                    <span>Cerrar sesión</span>
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

          {/* =====================================
              CARRITO
          ===================================== */}

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
