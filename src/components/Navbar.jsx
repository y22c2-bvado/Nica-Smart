
import { useEffect, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'

import '../styles/navbar.css'

// ==========================================
// NICA S-MART - NAVBAR RESPONSIVE
// ==========================================

// ==========================================
// OBTENER USUARIO AUTENTICADO
// ==========================================

function getAuthenticatedUser() {
  try {
    const token = localStorage.getItem('token')
    const storedUser = localStorage.getItem('user')

    if (!token || !storedUser) {
      return null
    }

    const user = JSON.parse(storedUser)
    const parts = token.split('.')

    if (parts.length !== 3) {
      return null
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
      payload.exp * 1000 <= Date.now()
    ) {
      return null
    }

    return user
  } catch {
    return null
  }
}

// ==========================================
// ENLACES DE NAVEGACIÓN
// ==========================================

const NAV_LINKS = [
  {
    path: '/',
    label: 'Inicio',
    end: true
  },
  {
    path: '/categories',
    label: 'Todas las categorías'
  },
  {
    path: '/promotions',
    label: 'Promociones'
  },
  {
    path: '/new-products',
    label: 'Nuevos'
  },
  {
    path: '/brands',
    label: 'Marcas'
  },
  {
    path: '/contact',
    label: 'Contacto'
  }
]

// ==========================================
// COMPONENTE PRINCIPAL
// ==========================================

function Navbar() {
  const location = useLocation()

  const [user, setUser] = useState(
    getAuthenticatedUser
  )

  const [menuOpen, setMenuOpen] = useState(false)

  // ==========================================
  // ACTUALIZAR USUARIO
  // ==========================================

  useEffect(() => {
    const updateUser = () => {
      setUser(getAuthenticatedUser())
    }

    window.addEventListener(
      'storage',
      updateUser
    )

    window.addEventListener(
      'auth-change',
      updateUser
    )

    window.addEventListener(
      'focus',
      updateUser
    )

    return () => {
      window.removeEventListener(
        'storage',
        updateUser
      )

      window.removeEventListener(
        'auth-change',
        updateUser
      )

      window.removeEventListener(
        'focus',
        updateUser
      )
    }
  }, [])

  // ==========================================
  // CERRAR MENÚ AL CAMBIAR DE PÁGINA
  // ==========================================

  useEffect(() => {
    setMenuOpen(false)
  }, [location.pathname, location.search])

  // ==========================================
  // CERRAR CON ESCAPE
  // ==========================================

  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setMenuOpen(false)
      }
    }

    document.addEventListener(
      'keydown',
      handleEscape
    )

    return () => {
      document.removeEventListener(
        'keydown',
        handleEscape
      )
    }
  }, [])

  // ==========================================
  // CERRAR MENÚ AL PASAR A ESCRITORIO
  // ==========================================

  useEffect(() => {
    const mediaQuery = window.matchMedia(
      '(min-width: 769px)'
    )

    const handleResize = () => {
      if (mediaQuery.matches) {
        setMenuOpen(false)
      }
    }

    handleResize()

    mediaQuery.addEventListener(
      'change',
      handleResize
    )

    return () => {
      mediaQuery.removeEventListener(
        'change',
        handleResize
      )
    }
  }, [])

  // ==========================================
  // VERIFICAR ADMINISTRADOR
  // ==========================================

  const isAdmin =
    String(user?.role || '')
      .trim()
      .toUpperCase() === 'ADMIN'

  // ==========================================
  // CERRAR NAVEGACIÓN
  // ==========================================

  const closeMenu = () => {
    setMenuOpen(false)
  }

  // ==========================================
  // CLASES PARA ENLACES ACTIVOS
  // ==========================================

  const linkClassName = ({ isActive }) =>
    isActive
      ? 'navbar-link navbar-link-active'
      : 'navbar-link'

  return (
    <nav
      className="navbar"
      aria-label="Navegación principal"
    >

      {/* ======================================
          BARRA MÓVIL
      ====================================== */}

      <div className="navbar-mobile-bar">

        <span className="navbar-mobile-title">
          Menú de navegación
        </span>

        <button
          type="button"
          className={
            menuOpen
              ? 'navbar-toggle navbar-toggle-active'
              : 'navbar-toggle'
          }
          onClick={() =>
            setMenuOpen((previous) => !previous)
          }
          aria-label={
            menuOpen
              ? 'Cerrar menú de navegación'
              : 'Abrir menú de navegación'
          }
          aria-expanded={menuOpen}
          aria-controls="nica-smart-navigation"
        >
          <span className="navbar-toggle-line" />
          <span className="navbar-toggle-line" />
          <span className="navbar-toggle-line" />
        </button>

      </div>

      {/* ======================================
          ENLACES
      ====================================== */}

      <div
        id="nica-smart-navigation"
        className={
          menuOpen
            ? 'navbar-links navbar-links-open'
            : 'navbar-links'
        }
      >

        {NAV_LINKS.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.end || false}
            className={linkClassName}
            onClick={closeMenu}
          >
            {item.label}
          </NavLink>
        ))}

        {/* ====================================
            PANEL SOLO PARA ADMINISTRADORES
        ==================================== */}

        {isAdmin && (
          <NavLink
            to="/admin"
            className={({ isActive }) =>
              isActive
                ? 'navbar-link navbar-admin-link navbar-link-active'
                : 'navbar-link navbar-admin-link'
            }
            onClick={closeMenu}
          >
            <span aria-hidden="true">
              🛡️
            </span>

            <span>
              Panel de administrador
            </span>
          </NavLink>
        )}

      </div>
    </nav>
  )
}

export default Navbar
