
import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import '../styles/header.css'

// ==========================================
// NICA S-MART - HEADER RESPONSIVE
// ==========================================

function Header() {
  const { cartCount, cartTotal } = useCart()
  const navigate = useNavigate()

  // ==========================================
  // ESTADOS
  // ==========================================

  const [user, setUser] = useState(null)
  const [showMenu, setShowMenu] = useState(false)
  const [search, setSearch] = useState('')

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

    document.addEventListener(
      'mousedown',
      handleOutsideClick
    )

    document.addEventListener(
      'keydown',
      handleEscape
    )

    return () => {
      document.removeEventListener(
        'mousedown',
        handleOutsideClick
      )

      document.removeEventListener(
        'keydown',
        handleEscape
      )
    }
  }, [])

  // ==========================================
  // CERRAR MENÚ AL NAVEGAR
  // ==========================================

  const closeMenu = () => {
    setShowMenu(false)
  }

  // ==========================================
  // VERIFICAR ADMINISTRADOR
  // ==========================================

  const isAdmin =
    String(user?.role || '')
      .trim()
      .toUpperCase() === 'ADMIN'

  // ==========================================
  // CERRAR SESIÓN
  // ==========================================

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    localStorage.removeItem('rememberMe')

    setUser(null)
    setShowMenu(false)

    window.dispatchEvent(
      new Event('auth-change')
    )

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

  const cartItemsCount = Number(cartCount) || 0

  const cartPrice = Number(cartTotal || 0)
    .toLocaleString('es-NI', {
      maximumFractionDigits: 0
    })

  // ==========================================
  // BUSCADOR
  // ==========================================

  const handleSearch = (event) => {
    event.preventDefault()

    const term = search.trim()

    if (!term) return

    navigate(
      `/products?search=${encodeURIComponent(term)}`
    )
  }

  // ==========================================
  // INTERFAZ
  // ==========================================

  return (
    <>
      {/* ======================================
          BARRA SUPERIOR
      ====================================== */}

      <div className="topbar">
        <div className="topbar-message">
          <span aria-hidden="true">🚚</span>

          <span>
            Envíos a toda Nicaragua
          </span>
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

      {/* ======================================
          ENCABEZADO PRINCIPAL
      ====================================== */}

      <header className="header">

        {/* ====================================
            LOGOTIPO
        ==================================== */}

        <Link
          to="/"
          className="logo"
          aria-label="NICA S-MART - Inicio"
          onClick={closeMenu}
        >
          <div className="logo-main">
            NICA
          </div>

          <div className="logo-bottom">
            S-MART
          </div>

          <span>
            TECH STORE
          </span>
        </Link>

        {/* ====================================
            BUSCADOR
        ==================================== */}

        <form
          className="search-container"
          onSubmit={handleSearch}
          role="search"
        >
          <input
            type="search"
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder="Buscar productos..."
            aria-label="Buscar productos"
          />

          <button
            type="submit"
            aria-label="Buscar"
            title="Buscar productos"
          >
            🔍
          </button>
        </form>

        {/* ====================================
            OPCIONES DEL ENCABEZADO
        ==================================== */}

        <div className="header-options">

          {/* ================================
              USUARIO AUTENTICADO
          ================================ */}

          {user ? (
            <div
              ref={accountRef}
              className="header-option account-link"
            >
              {/* FOTO DE PERFIL */}

              <div className="option-icon account-avatar">
                {user.picture ? (
                  <img
                    src={user.picture}
                    alt="Foto de perfil"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <span aria-hidden="true">
                    👤
                  </span>
                )}
              </div>

              {/* BOTÓN DE CUENTA */}

              <button
                type="button"
                className="account-trigger"
                onClick={() =>
                  setShowMenu((previous) => !previous)
                }
                aria-expanded={showMenu}
                aria-haspopup="true"
                aria-label="Opciones de mi cuenta"
              >
                <span className="account-info">
                  <strong className="account-name">
                    {userName}
                  </strong>

                  <small className="account-status">
                    <span
                      className="account-status-dot"
                      aria-hidden="true"
                    />

                    Sesión activa

                    <span aria-hidden="true">
                      {showMenu ? '▴' : '▾'}
                    </span>
                  </small>
                </span>
              </button>

              {/* ==============================
                  MENÚ DESPLEGABLE
              ============================== */}

              {showMenu && (
                <div className="account-dropdown">

                  {/* INFORMACIÓN DE CUENTA */}

                  <div className="account-dropdown-header">
                    <strong>
                      {userName}
                    </strong>

                    <small>
                      {user.email}
                    </small>
                  </div>

                  {/* PANEL ADMINISTRADOR */}

                  {isAdmin && (
                    <>
                      <Link
                        to="/admin"
                        className="account-dropdown-link admin-dropdown-link"
                        onClick={closeMenu}
                      >
                        <span aria-hidden="true">
                          🛡️
                        </span>

                        <span>
                          Panel de administrador
                        </span>
                      </Link>

                      <div className="account-dropdown-divider" />
                    </>
                  )}

                  {/* PERFIL */}

                  <Link
                    to="/profile"
                    className="account-dropdown-link"
                    onClick={closeMenu}
                  >
                    <span aria-hidden="true">
                      👤
                    </span>

                    <span>
                      Mi perfil
                    </span>
                  </Link>

                  {/* MIS PEDIDOS */}

                  <Link
                    to="/orders"
                    className="account-dropdown-link"
                    onClick={closeMenu}
                  >
                    <span aria-hidden="true">
                      📦
                    </span>

                    <span>
                      Mis pedidos
                    </span>
                  </Link>

                  {/* SEGUIMIENTO */}

                  <Link
                    to="/tracking"
                    className="account-dropdown-link"
                    onClick={closeMenu}
                  >
                    <span aria-hidden="true">
                      🚚
                    </span>

                    <span>
                      Seguimiento de pedido
                    </span>
                  </Link>

                  <div className="account-dropdown-divider" />

                  {/* CERRAR SESIÓN */}

                  <button
                    type="button"
                    className="account-dropdown-link account-logout"
                    onClick={handleLogout}
                  >
                    <span aria-hidden="true">
                      🚪
                    </span>

                    <span>
                      Cerrar sesión
                    </span>
                  </button>

                </div>
              )}
            </div>
          ) : (

            /* ================================
                USUARIO SIN SESIÓN
            ================================ */

            <Link
              to="/login"
              className="header-option account-link"
            >
              <div className="option-icon account-avatar">
                <span aria-hidden="true">
                  👤
                </span>
              </div>

              <span className="account-info">
                <small>
                  Mi cuenta
                </small>

                <strong className="account-name">
                  Iniciar sesión
                </strong>
              </span>
            </Link>
          )}

          {/* ================================
              CARRITO
          ================================ */}

          <Link
            to="/cart"
            className="header-option cart-link"
            aria-label={`Carrito, ${cartItemsCount} productos, C$ ${cartPrice}`}
            onClick={closeMenu}
          >
            <div className="cart-icon-wrapper">
              <span
                className="option-icon cart-icon"
                aria-hidden="true"
              >
                🛒
              </span>

              {cartItemsCount > 0 && (
                <span className="cart-count">
                  {cartItemsCount > 99
                    ? '99+'
                    : cartItemsCount}
                </span>
              )}
            </div>

            <div className="cart-info">
              <small>
                Carrito
              </small>

              <strong>
                C$ {cartPrice}
              </strong>
            </div>
          </Link>

        </div>
      </header>
    </>
  )
}

export default Header
