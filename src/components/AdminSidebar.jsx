
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
// MENÚ LATERAL DEL ADMINISTRADOR
// ==========================================

function AdminSidebar({
  activeSection = 'dashboard',
  onSectionChange,
  onLogout,
  isOpen = false,
  onClose
}) {

  // ==========================================
  // OPCIONES DEL MENÚ
  // ==========================================

  const menuItems = [
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
  // CAMBIAR SECCIÓN
  // ==========================================

  const handleNavigation = (section) => {
    if (typeof onSectionChange === 'function') {
      onSectionChange(section)
    }

    if (typeof onClose === 'function') {
      onClose()
    }
  }

  return (
    <>
      {/* FONDO PARA DISPOSITIVOS MÓVILES */}

      {isOpen && (
        <button
          type="button"
          className="admin-sidebar-overlay"
          onClick={onClose}
          aria-label="Cerrar menú de administración"
        />
      )}

      {/* MENÚ LATERAL */}

      <aside
        className={`admin-sidebar ${isOpen ? 'open' : ''}`}
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
            onClick={onClose}
            aria-label="Cerrar menú"
          >
            <FiX />
          </button>

        </div>

        {/* ETIQUETA */}

        <div className="admin-sidebar-label">
          MENÚ PRINCIPAL
        </div>

        {/* OPCIONES */}

        <nav className="admin-sidebar-nav">

          {menuItems.map((item) => {
            const Icon = item.icon

            return (
              <button
                key={item.id}
                type="button"
                className={
                  `admin-sidebar-link ${
                    activeSection === item.id ? 'active' : ''
                  }`
                }
                onClick={() => handleNavigation(item.id)}
                aria-current={
                  activeSection === item.id ? 'page' : undefined
                }
              >
                <Icon className="admin-sidebar-link-icon" />

                <span>{item.label}</span>

                {activeSection === item.id && (
                  <span className="admin-sidebar-active-dot" />
                )}

              </button>
            )
          })}

        </nav>

        {/* PARTE INFERIOR */}

        <div className="admin-sidebar-footer">

          <a
            href="/"
            className="admin-sidebar-bottom-link"
          >
            <FiHome />
            <span>Ver tienda</span>
          </a>

          <button
            type="button"
            className="admin-sidebar-bottom-link admin-sidebar-logout"
            onClick={onLogout}
          >
            <FiLogOut />
            <span>Cerrar sesión</span>
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
