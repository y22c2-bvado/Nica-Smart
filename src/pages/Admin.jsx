
import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  FiMenu,
  FiRefreshCw,
  FiPackage,
  FiUsers,
  FiShoppingCart,
  FiAlertTriangle,
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiSearch,
  FiLock,
  FiUnlock,
  FiArrowLeft
} from 'react-icons/fi'

import AdminSidebar from '../components/AdminSidebar'
import ProductForm from '../components/ProductForm'

import '../styles/admin.css'

const API_URL = (
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV ? 'http://localhost:3000' : '')
).trim().replace(/\/$/, '')

const money = (value) =>
  `C$ ${Number(value || 0).toLocaleString('es-NI', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`

function Admin() {
  const navigate = useNavigate()

  const [activeSection, setActiveSection] = useState('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [products, setProducts] = useState([])
  const [users, setUsers] = useState([])
  const [stats, setStats] = useState(null)

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const [search, setSearch] = useState('')
  const [editingProduct, setEditingProduct] = useState(null)

  const storedUser = (() => {
    try {
      return JSON.parse(localStorage.getItem('user') || 'null')
    } catch {
      return null
    }
  })()

  const isAdmin = storedUser?.role?.toUpperCase() === 'ADMIN'

  // ==========================================
  // PETICIONES PROTEGIDAS
  // ==========================================

  const adminRequest = useCallback(async (endpoint, options = {}) => {
    const token = localStorage.getItem('token')

    if (!token) {
      throw new Error('Debes iniciar sesión.')
    }

    const response = await fetch(
      `${API_URL}/api/admin${endpoint}`,
      {
        ...options,
        headers: {
          ...(options.body
            ? { 'Content-Type': 'application/json' }
            : {}),
          Authorization: `Bearer ${token}`,
          ...options.headers
        }
      }
    )

    const data = await response.json().catch(() => ({}))

    if (!response.ok) {
      throw new Error(
        data.message ||
        data.error ||
        `Error del servidor (${response.status})`
      )
    }

    return data
  }, [])

  // ==========================================
  // CARGAR INFORMACIÓN REAL
  // ==========================================

  const loadData = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      const [productData, userData, statsData] = await Promise.all([
        adminRequest('/products'),
        adminRequest('/users'),
        adminRequest('/stats')
      ])

      setProducts(Array.isArray(productData) ? productData : [])
      setUsers(Array.isArray(userData) ? userData : [])
      setStats(statsData)

    } catch (err) {
      setError(err.message || 'No se pudo cargar el panel.')
    } finally {
      setLoading(false)
    }
  }, [adminRequest])

  useEffect(() => {
    if (isAdmin) {
      loadData()
    } else {
      setLoading(false)
    }
  }, [isAdmin, loadData])

  // ==========================================
  // CAMBIAR SECCIÓN
  // ==========================================

  const changeSection = (section) => {
    setActiveSection(section)
    setSidebarOpen(false)
    setError('')
    setNotice('')

    if (section === 'add-product') {
      setEditingProduct(null)
    }
  }

  // ==========================================
  // CERRAR SESIÓN
  // ==========================================

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    localStorage.removeItem('rememberMe')

    window.dispatchEvent(new Event('auth-change'))

    navigate('/login', { replace: true })
  }

  // ==========================================
  // CREAR O EDITAR PRODUCTO
  // ==========================================

  const handleSaveProduct = async (formData) => {
    setSaving(true)
    setError('')
    setNotice('')

    try {
      const isEditing = Boolean(editingProduct)

      await adminRequest(
        isEditing
          ? `/products/${editingProduct.id}`
          : '/products',
        {
          method: isEditing ? 'PUT' : 'POST',
          body: JSON.stringify(formData)
        }
      )

      setNotice(
        isEditing
          ? 'Producto actualizado correctamente.'
          : 'Producto agregado correctamente.'
      )

      setEditingProduct(null)
      setActiveSection('products')

      await loadData()

      setNotice(
        isEditing
          ? 'Producto actualizado correctamente.'
          : 'Producto agregado correctamente.'
      )

    } catch (err) {
      setError(err.message || 'No se pudo guardar el producto.')
    } finally {
      setSaving(false)
    }
  }

  // ==========================================
  // ELIMINAR PRODUCTO
  // ==========================================

  const handleDeleteProduct = async (product) => {
    const confirmed = window.confirm(
      `¿Eliminar el producto "${product.name}"?\n\nEsta acción puede ser irreversible.`
    )

    if (!confirmed) return

    setError('')
    setNotice('')

    try {
      await adminRequest(`/products/${product.id}`, {
        method: 'DELETE'
      })

      await loadData()
      setNotice('Producto eliminado correctamente.')

    } catch (err) {
      setError(err.message || 'No se pudo eliminar el producto.')
    }
  }

  // ==========================================
  // EDITAR PRODUCTO
  // ==========================================

  const handleEditProduct = (product) => {
    setEditingProduct(product)
    setActiveSection('add-product')
    setError('')
    setNotice('')
  }

  // ==========================================
  // BLOQUEAR / DESBLOQUEAR USUARIO
  // ==========================================

  const handleBlockUser = async (user) => {
    const blocked = !user.is_blocked

    const confirmed = window.confirm(
      blocked
        ? `¿Bloquear la cuenta de ${user.name}?`
        : `¿Desbloquear la cuenta de ${user.name}?`
    )

    if (!confirmed) return

    try {
      setError('')
      setNotice('')

      await adminRequest(`/users/${user.id}/block`, {
        method: 'PATCH',
        body: JSON.stringify({ blocked })
      })

      await loadData()

      setNotice(
        blocked
          ? 'Usuario bloqueado correctamente.'
          : 'Usuario desbloqueado correctamente.'
      )

    } catch (err) {
      setError(err.message || 'No se pudo actualizar la cuenta.')
    }
  }

  // ==========================================
  // ELIMINAR USUARIO
  // ==========================================

  const handleDeleteUser = async (user) => {
    const confirmed = window.confirm(
      `¿Eliminar permanentemente a ${user.name}?\n\nEsta acción no se puede deshacer.`
    )

    if (!confirmed) return

    try {
      setError('')
      setNotice('')

      await adminRequest(`/users/${user.id}`, {
        method: 'DELETE'
      })

      await loadData()
      setNotice('Usuario eliminado correctamente.')

    } catch (err) {
      setError(err.message || 'No se pudo eliminar el usuario.')
    }
  }

  // ==========================================
  // FILTRAR PRODUCTOS Y USUARIOS
  // ==========================================

  const filteredProducts = products.filter((product) =>
    String(product.name || '')
      .toLowerCase()
      .includes(search.toLowerCase())
  )

  const filteredUsers = users.filter((user) =>
    `${user.name || ''} ${user.email || ''}`
      .toLowerCase()
      .includes(search.toLowerCase())
  )

  const lowStockProducts = products.filter(
    (product) => Number(product.stock) <= 5
  )

  const sectionTitles = {
    dashboard: 'Panel principal',
    products: 'Gestión de productos',
    'add-product': editingProduct ? 'Editar producto' : 'Nuevo producto',
    inventory: 'Inventario',
    users: 'Gestión de usuarios',
    orders: 'Pedidos'
  }

  // ==========================================
  // PROTECCIÓN VISUAL
  // ==========================================

  if (!isAdmin) {
    return (
      <main className="admin-access-page">
        <div className="admin-access-card">
          <FiLock size={42} />
          <h1>Acceso restringido</h1>

          <p>
            Necesitas una cuenta de administrador para
            acceder a este panel.
          </p>

          <button
            type="button"
            className="adm-btn adm-btn-primary"
            onClick={() => navigate('/login')}
          >
            Iniciar sesión
          </button>
        </div>
      </main>
    )
  }

  return (
    <div className="adm-layout">

      <AdminSidebar
        activeSection={activeSection}
        onSectionChange={changeSection}
        onLogout={handleLogout}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <main className="adm-main">

        {/* ==================================
            ENCABEZADO
        ================================== */}

        <header className="adm-header">

          <div className="adm-header-left">

            <button
              type="button"
              className="adm-menu-toggle"
              onClick={() => setSidebarOpen(true)}
              aria-label="Abrir menú"
            >
              <FiMenu />
            </button>

            <div>
              <span className="adm-eyebrow">
                NICA S-MART / ADMINISTRACIÓN
              </span>

              <h1>
                {sectionTitles[activeSection] || 'Administración'}
              </h1>

              <p>
                Gestiona tu tienda de forma sencilla y segura.
              </p>
            </div>

          </div>

          <button
            type="button"
            className="adm-btn adm-btn-outline"
            onClick={loadData}
            disabled={loading}
          >
            <FiRefreshCw />
            Actualizar
          </button>

        </header>

        {error && (
          <div className="adm-alert adm-alert-error" role="alert">
            <FiAlertTriangle />
            <span>{error}</span>
          </div>
        )}

        {notice && (
          <div className="adm-alert adm-alert-success" role="status">
            {notice}
          </div>
        )}

        {loading && (
          <div className="adm-loading">
            Cargando información de NICA S-MART...
          </div>
        )}

        {!loading && (

          <div className="adm-content">

            {/* ==================================
                DASHBOARD
            ================================== */}

            {activeSection === 'dashboard' && (
              <>
                <section className="adm-stats">

                  <div className="adm-stat-card">
                    <div className="adm-stat-icon blue">
                      <FiPackage />
                    </div>
                    <span>Productos</span>
                    <strong>
                      {stats?.products?.total ?? products.length}
                    </strong>
                    <small>Registrados en el catálogo</small>
                  </div>

                  <div className="adm-stat-card">
                    <div className="adm-stat-icon amber">
                      <FiAlertTriangle />
                    </div>
                    <span>Inventario bajo</span>
                    <strong>
                      {stats?.products?.low_stock ??
                        lowStockProducts.length}
                    </strong>
                    <small>Productos con 5 unidades o menos</small>
                  </div>

                  <div className="adm-stat-card">
                    <div className="adm-stat-icon purple">
                      <FiUsers />
                    </div>
                    <span>Usuarios registrados</span>
                    <strong>
                      {stats?.users?.total ?? users.length}
                    </strong>
                    <small>Clientes con cuenta tradicional</small>
                  </div>

                  <div className="adm-stat-card">
                    <div className="adm-stat-icon green">
                      <FiShoppingCart />
                    </div>
                    <span>Pedidos</span>
                    <strong>
                      {stats?.orders?.total ?? 0}
                    </strong>
                    <small>Pedidos registrados</small>
                  </div>

                </section>

                <section className="adm-panel">

                  <div className="adm-panel-heading">
                    <div>
                      <h2>Acciones rápidas</h2>
                      <p>Accede a las operaciones frecuentes.</p>
                    </div>
                  </div>

                  <div className="adm-quick-grid">

                    <button
                      type="button"
                      onClick={() => changeSection('add-product')}
                    >
                      <FiPlus />
                      <span>Agregar producto</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => changeSection('products')}
                    >
                      <FiPackage />
                      <span>Gestionar productos</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => changeSection('inventory')}
                    >
                      <FiAlertTriangle />
                      <span>Ver inventario</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => changeSection('users')}
                    >
                      <FiUsers />
                      <span>Administrar usuarios</span>
                    </button>

                  </div>

                </section>

                <section className="adm-panel">

                  <div className="adm-panel-heading">
                    <div>
                      <h2>Productos con bajo stock</h2>
                      <p>Artículos que requieren atención.</p>
                    </div>
                  </div>

                  {lowStockProducts.length === 0 ? (
                    <p className="adm-empty">
                      No hay productos con inventario bajo.
                    </p>
                  ) : (
                    <div className="adm-table-wrap">
                      <table className="adm-table">
                        <thead>
                          <tr>
                            <th>Producto</th>
                            <th>Existencias</th>
                            <th>Acción</th>
                          </tr>
                        </thead>

                        <tbody>
                          {lowStockProducts.map((product) => (
                            <tr key={product.id}>
                              <td>{product.name}</td>

                              <td>
                                <span className="adm-stock-low">
                                  {product.stock} unidades
                                </span>
                              </td>

                              <td>
                                <button
                                  type="button"
                                  className="adm-btn adm-btn-outline"
                                  onClick={() => handleEditProduct(product)}
                                >
                                  <FiEdit2 /> Editar
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                </section>
              </>
            )}

            {/* ==================================
                PRODUCTOS
            ================================== */}

            {activeSection === 'products' && (
              <section className="adm-panel">

                <div className="adm-panel-heading">
                  <div>
                    <h2>Catálogo de productos</h2>
                    <p>
                      Modifica nombres, imágenes, precios y descripciones.
                    </p>
                  </div>

                  <button
                    type="button"
                    className="adm-btn adm-btn-primary"
                    onClick={() => changeSection('add-product')}
                  >
                    <FiPlus />
                    Nuevo producto
                  </button>
                </div>

                <div className="adm-search">
                  <FiSearch />
                  <input
                    type="search"
                    placeholder="Buscar producto..."
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                  />
                </div>

                <div className="adm-table-wrap">
                  <table className="adm-table">
                    <thead>
                      <tr>
                        <th>Producto</th>
                        <th>Precio</th>
                        <th>Stock</th>
                        <th>Acciones</th>
                      </tr>
                    </thead>

                    <tbody>
                      {filteredProducts.map((product) => (
                        <tr key={product.id}>

                          <td>
                            <div className="adm-product-cell">
                              <div className="adm-product-image">
                                {product.image ? (
                                  <img
                                    src={product.image}
                                    alt={product.name}
                                  />
                                ) : (
                                  <FiPackage />
                                )}
                              </div>

                              <div>
                                <strong>{product.name}</strong>
                                <small>Producto #{product.id}</small>
                              </div>
                            </div>
                          </td>

                          <td>{money(product.price)}</td>

                          <td>
                            <span
                              className={
                                Number(product.stock) <= 5
                                  ? 'adm-stock-low'
                                  : 'adm-stock-ok'
                              }
                            >
                              {product.stock} disponibles
                            </span>
                          </td>

                          <td>
                            <div className="adm-row-actions">
                              <button
                                type="button"
                                className="adm-icon-button"
                                onClick={() => handleEditProduct(product)}
                                aria-label={`Editar ${product.name}`}
                                title="Editar producto"
                              >
                                <FiEdit2 />
                              </button>

                              <button
                                type="button"
                                className="adm-icon-button danger"
                                onClick={() => handleDeleteProduct(product)}
                                aria-label={`Eliminar ${product.name}`}
                                title="Eliminar producto"
                              >
                                <FiTrash2 />
                              </button>
                            </div>
                          </td>

                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {filteredProducts.length === 0 && (
                  <p className="adm-empty">
                    No se encontraron productos.
                  </p>
                )}

              </section>
            )}

            {/* ==================================
                NUEVO PRODUCTO / EDITAR
            ================================== */}

            {activeSection === 'add-product' && (
              <section className="adm-panel">

                <div className="adm-panel-heading">
                  <div>
                    <h2>
                      {editingProduct
                        ? 'Editar producto'
                        : 'Agregar nuevo producto'}
                    </h2>

                    <p>
                      Los cambios se guardarán en PostgreSQL.
                    </p>
                  </div>

                  <button
                    type="button"
                    className="adm-btn adm-btn-outline"
                    onClick={() => changeSection('products')}
                  >
                    <FiArrowLeft />
                    Volver
                  </button>
                </div>

                <ProductForm
                  product={editingProduct}
                  onSubmit={handleSaveProduct}
                  onCancel={() => changeSection('products')}
                  loading={saving}
                />

              </section>
            )}

            {/* ==================================
                INVENTARIO
            ================================== */}

            {activeSection === 'inventory' && (
              <section className="adm-panel">

                <div className="adm-panel-heading">
                  <div>
                    <h2>Control de inventario</h2>
                    <p>
                      Consulta y ajusta las existencias disponibles.
                    </p>
                  </div>
                </div>

                <div className="adm-table-wrap">
                  <table className="adm-table">
                    <thead>
                      <tr>
                        <th>Producto</th>
                        <th>Stock</th>
                        <th>Estado</th>
                        <th>Acción</th>
                      </tr>
                    </thead>

                    <tbody>
                      {products.map((product) => (
                        <tr key={product.id}>
                          <td>{product.name}</td>
                          <td>{product.stock}</td>

                          <td>
                            <span
                              className={
                                Number(product.stock) <= 5
                                  ? 'adm-stock-low'
                                  : 'adm-stock-ok'
                              }
                            >
                              {Number(product.stock) === 0
                                ? 'Agotado'
                                : Number(product.stock) <= 5
                                  ? 'Bajo stock'
                                  : 'Disponible'}
                            </span>
                          </td>

                          <td>
                            <button
                              type="button"
                              className="adm-btn adm-btn-outline"
                              onClick={() => handleEditProduct(product)}
                            >
                              <FiEdit2 />
                              Actualizar
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

              </section>
            )}

            {/* ==================================
                USUARIOS
            ================================== */}

            {activeSection === 'users' && (
              <section className="adm-panel">

                <div className="adm-panel-heading">
                  <div>
                    <h2>Usuarios registrados</h2>
                    <p>
                      Gestiona las cuentas locales de clientes.
                    </p>
                  </div>
                </div>

                <div className="adm-search">
                  <FiSearch />

                  <input
                    type="search"
                    placeholder="Buscar por nombre o correo..."
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                  />
                </div>

                <div className="adm-table-wrap">
                  <table className="adm-table">
                    <thead>
                      <tr>
                        <th>Cliente</th>
                        <th>Rol</th>
                        <th>Estado</th>
                        <th>Acciones</th>
                      </tr>
                    </thead>

                    <tbody>
                      {filteredUsers.map((user) => {
                        const isProtected =
                          user.role?.toUpperCase() === 'ADMIN'

                        return (
                          <tr key={user.id}>

                            <td>
                              <div className="adm-user-cell">
                                <div className="adm-avatar">
                                  {String(user.name || '?')
                                    .charAt(0)
                                    .toUpperCase()}
                                </div>

                                <div>
                                  <strong>{user.name}</strong>
                                  <small>{user.email}</small>
                                </div>
                              </div>
                            </td>

                            <td>{user.role}</td>

                            <td>
                              <span
                                className={
                                  user.is_blocked
                                    ? 'adm-status blocked'
                                    : 'adm-status active'
                                }
                              >
                                {user.is_blocked
                                  ? 'Bloqueado'
                                  : 'Activo'}
                              </span>
                            </td>

                            <td>
                              <div className="adm-row-actions">

                                <button
                                  type="button"
                                  className="adm-icon-button"
                                  disabled={isProtected}
                                  onClick={() => handleBlockUser(user)}
                                  title={
                                    user.is_blocked
                                      ? 'Desbloquear'
                                      : 'Bloquear'
                                  }
                                  aria-label={
                                    user.is_blocked
                                      ? `Desbloquear a ${user.name}`
                                      : `Bloquear a ${user.name}`
                                  }
                                >
                                  {user.is_blocked
                                    ? <FiUnlock />
                                    : <FiLock />}
                                </button>

                                <button
                                  type="button"
                                  className="adm-icon-button danger"
                                  disabled={isProtected}
                                  onClick={() => handleDeleteUser(user)}
                                  title="Eliminar usuario"
                                  aria-label={`Eliminar a ${user.name}`}
                                >
                                  <FiTrash2 />
                                </button>

                              </div>
                            </td>

                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>

                {filteredUsers.length === 0 && (
                  <p className="adm-empty">
                    No se encontraron usuarios.
                  </p>
                )}

                <p className="adm-help">
                  Las cuentas de Google se almacenan en
                  google_users y todavía no aparecen aquí.
                  Los bloqueos requieren controles adicionales
                  en login y compras para ser efectivos.
                </p>

              </section>
            )}

            {/* ==================================
                PEDIDOS
            ================================== */}

            {activeSection === 'orders' && (
              <section className="adm-panel">

                <div className="adm-panel-heading">
                  <div>
                    <h2>Gestión de pedidos</h2>
                    <p>
                      Administración de compras realizadas.
                    </p>
                  </div>
                </div>

                <div className="adm-coming-soon">
                  <FiShoppingCart size={42} />

                  <h3>Gestión de pedidos</h3>

                  <p>
                    Ya contamos con el registro de compras.
                    Para mostrar aquí los pedidos de todos
                    los clientes, necesitamos crear una
                    consulta exclusiva para administradores
                    en el backend.
                  </p>
                </div>

              </section>
            )}

          </div>
        )}

      </main>
    </div>
  )
}

export default Admin
