
import { useState } from 'react'
import { Link } from 'react-router-dom'

import {
  FiGrid,
  FiPackage,
  FiPlusCircle,
  FiBox,
  FiUsers,
  FiShoppingCart,
  FiLogOut,
  FiHome,
  FiShield,
  FiX
} from 'react-icons/fi'

// ==========================================
// OPCIONES DEL MENÚ
// ==========================================

const MENU_ITEMS = [
  {
    id: 'dashboard',
    label: 'Panel principal',
    icon: FiGrid
  },
  {
    id: 'products',
    label: 'Productos',
    icon: FiPackage
  },
  {
    id: 'add-product',
    label: 'Agregar producto',
    icon: FiPlusCircle
  },
  {
    id: 'inventory',
    label: 'Inventario',
    icon: FiBox
  },
  {
    id: 'users',
    label: 'Usuarios',
    icon: FiUsers
  },
  {
    id: 'orders',
    label: 'Pedidos',
    icon: FiShoppingCart
  }
]

// ==========================================
// COMPONENTE
// ==========================================

function AdminSidebar({
  activeSection = 'dashboard',
  onSectionChange,
  onLogout,
  isOpen = false,
  onClose
}) {
  const [pendingSection, setPendingSection] = useState(null)

  // ==========================================
  // CAMBIAR SECCIÓN SIN SALIR DEL ADMIN
  // ==========================================

  const handleNavigation = (section) => {
    if (!MENU_ITEMS.some((item) => item.id === section)) {
      return
    }

    if (typeof onSectionChange === 'function') {
      setPendingSection(section)
      onSectionChange(section)
    }

    // Solo el panel padre controla cuándo
    // cerrar el menú lateral en móviles.
    if (
      isOpen &&
      typeof onClose === 'function'
    ) {
      onClose()
    }
  }

  const selectedSection =
    activeSection || pendingSection || 'dashboard'

  // ==========================================
  // CERRAR MENÚ
  // ==========================================

  const handleClose = () => {
    if (typeof onClose === 'function') {
      onClose()
    }
  }

  // ==========================================
  // CERRAR SESIÓN
  // ==========================================

  const handleLogout = () => {
    if (typeof onLogout === 'function') {
      onLogout()
    }
  }

  return (
    <>
      {/* FONDO EN MÓVILES */}

      {isOpen && (
        <button
          type="button"
          className="admin-sidebar-overlay"
          onClick={handleClose}
          aria-label="Cerrar menú de administración"
        />
      )}

      {/* BARRA LATERAL */}

      <aside
        className={`admin-sidebar ${
          isOpen ? 'open' : ''
        }`}
        aria-label="Menú de administración"
      >

        {/* ENCABEZADO */}

        <div className="admin-sidebar-header">

          <div className="admin-sidebar-brand">

            <div className="admin-sidebar-logo">
              <FiShield />
            </div>

            <div className="admin-sidebar-brand-text">
              <h2>NICA S-MART</h2>
              <span>Administración</span>
            </div>

          </div>

          <button
            type="button"
            className="admin-sidebar-close"
            onClick={handleClose}
            aria-label="Cerrar menú"
          >
            <FiX />
          </button>

        </div>

        {/* TÍTULO DEL MENÚ */}

        <div className="admin-sidebar-label">
          MENÚ PRINCIPAL
        </div>

        {/* NAVEGACIÓN */}

        <nav
          className="admin-sidebar-nav"
          aria-label="Secciones administrativas"
        >

          {MENU_ITEMS.map((item) => {
            const Icon = item.icon

            const isActive =
              selectedSection === item.id

            return (
              <button
                key={item.id}
                type="button"
                className={`admin-sidebar-link ${
                  isActive ? 'active' : ''
                }`}
                onClick={() =>
                  handleNavigation(item.id)
                }
                aria-current={
                  isActive ? 'page' : undefined
                }
                title={item.label}
              >

                <Icon
                  className="admin-sidebar-link-icon"
                  aria-hidden="true"
                />

                <span>
                  {item.label}
                </span>

                {isActive && (
                  <span
                    className="admin-sidebar-active-dot"
                    aria-hidden="true"
                  />
                )}

              </button>
            )
          })}

        </nav>

        {/* PIE DEL MENÚ */}

        <div className="admin-sidebar-footer">

          <Link
            to="/"
            className="admin-sidebar-bottom-link"
          >
            <FiHome />

            <span>
              Ver tienda
            </span>
          </Link>

          <button
            type="button"
            className="
              admin-sidebar-bottom-link
              admin-sidebar-logout
            "
            onClick={handleLogout}
          >
            <FiLogOut />

            <span>
              Cerrar sesión
            </span>
          </button>

          <div className="admin-sidebar-copyright">
            © {new Date().getFullYear()} NICA S-MART
          </div>

        </div>

      </aside>
    </>
  )
}

export default AdminSidebar
