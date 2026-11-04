
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import '../styles/navbar.css'

// ==========================================
// OBTENER USUARIO AUTENTICADO
// ==========================================

function getAuthenticatedUser() {
  try {
    const token = localStorage.getItem('token')
    const storedUser = localStorage.getItem('user')

    if (!token || !storedUser) return null

    const user = JSON.parse(storedUser)

    const parts = token.split('.')
    if (parts.length !== 3) return null

    const payload = JSON.parse(
      atob(
        parts[1]
          .replace(/-/g, '+')
          .replace(/_/g, '/')
          .padEnd(Math.ceil(parts[1].length / 4) * 4, '=')
      )
    )

    if (!payload.exp || payload.exp * 1000 <= Date.now()) {
      return null
    }

    return user
  } catch {
    return null
  }
}

// ==========================================
// BARRA DE NAVEGACIÓN
// ==========================================

function Navbar() {
  const [user, setUser] = useState(getAuthenticatedUser)

  useEffect(() => {
    const updateUser = () => {
      setUser(getAuthenticatedUser())
    }

    window.addEventListener('storage', updateUser)
    window.addEventListener('auth-change', updateUser)
    window.addEventListener('focus', updateUser)

    return () => {
      window.removeEventListener('storage', updateUser)
      window.removeEventListener('auth-change', updateUser)
      window.removeEventListener('focus', updateUser)
    }
  }, [])

  const isAdmin =
    String(user?.role || '').trim().toUpperCase() === 'ADMIN'

  return (
    <nav className="navbar">

      <Link to="/">
        Inicio
      </Link>

      <Link to="/categories">
        Todas las categorías
      </Link>

      <Link to="/promotions">
        Promociones
      </Link>

      <Link to="/new-products">
        Nuevos
      </Link>

      <Link to="/brands">
        Marcas
      </Link>

      <Link to="/contact">
        Contacto
      </Link>

      {/* SOLO PARA ADMINISTRADORES */}

      {isAdmin && (
        <Link
          to="/admin"
          className="navbar-admin-link"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '7px',
            fontWeight: 700
          }}
        >
          🛡️ Panel de administrador
        </Link>
      )}

    </nav>
  )
}

export default Navbar
