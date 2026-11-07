import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  FiMenu, FiRefreshCw, FiPackage, FiUsers,
  FiShoppingCart, FiAlertTriangle, FiPlus,
  FiEdit2, FiTrash2, FiSearch, FiLock,
  FiUnlock, FiArrowLeft, FiExternalLink,
  FiClock, FiTruck, FiNavigation,
  FiCheckCircle, FiCamera, FiX, FiFilter,
  FiMapPin, FiXCircle
} from 'react-icons/fi'

import AdminSidebar from '../components/AdminSidebar'
import ProductForm from '../components/ProductForm'
import '../styles/admin.css'

// ==========================================
// CONFIGURACIÓN
// ==========================================

const API_URL = String(
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV ? 'http://localhost:3000' : '')
).trim().replace(/\/+$/, '')

const money = (value) =>
  `C$ ${Number(value || 0).toLocaleString('es-NI', {
    maximumFractionDigits: 0
  })}`

const formatDate = (value) => {
  if (!value) return 'No registrada'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Fecha inválida'

  return new Intl.DateTimeFormat('es-NI', {
    timeZone: 'America/Managua',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date)
}

const getStoredUser = () => {
  try {
    return JSON.parse(localStorage.getItem('user') || 'null')
  } catch {
    return null
  }
}

const getList = (data, key) => {
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.[key])) return data[key]
  if (Array.isArray(data?.data)) return data.data
  return []
}

const getProductImage = (product) => {
  if (!product) return null

  let images = product.images

  if (typeof images === 'string') {
    try {
      images = JSON.parse(images)
    } catch {
      images = [images]
    }
  }

  const candidates = [
    product.image_url,
    product.image,
    ...(Array.isArray(images) ? images : [])
  ]

  for (const item of candidates) {
    const url = typeof item === 'string'
      ? item.trim()
      : String(
          item?.url ||
          item?.src ||
          item?.image_url ||
          ''
        ).trim()

    if (url) {
      if (url.startsWith('http') || url.startsWith('data:')) {
        return url
      }
      
      if (url.includes('uploads/')) {
        const filename = url.split('uploads/')[1]
        return `${API_URL}/uploads/${filename}`
      }
      
      if (!url.includes('/')) {
        return `${API_URL}/uploads/${url}`
      }
      
      if (url.startsWith('/')) {
        return url
      }
    }
  }

  return null
}

const ORDER_STATUSES = [
  { value: 'pendiente', label: 'Pedido recibido', color: '#075cd8', bg: '#eaf2ff' },
  { value: 'preparando', label: 'En preparación', color: '#a16207', bg: '#fff4df' },
  { value: 'enviado', label: 'En camino', color: '#0369a1', bg: '#e0f2fe' },
  { value: 'entregado', label: 'Entregado', color: '#15803d', bg: '#dcfce7' },
  { value: 'cancelado', label: 'Cancelado', color: '#b91c1c', bg: '#fee2e2' }
]

const getOrderStatus = (value) => {
  const normalized = String(value || 'pendiente')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[_-]+/g, ' ')

  const aliases = {
    pending: 'pendiente',
    registered: 'pendiente',
    recibido: 'pendiente',
    processing: 'preparando',
    preparing: 'preparando',
    'en preparacion': 'preparando',
    shipped: 'enviado',
    shipping: 'enviado',
    'en camino': 'enviado',
    delivered: 'entregado',
    completed: 'entregado',
    canceled: 'cancelado',
    cancelled: 'cancelado'
  }

  const status = aliases[normalized] || normalized

  return ORDER_STATUSES.find((item) => item.value === status) || {
    value: status,
    label: value || 'Sin estado',
    color: '#475569',
    bg: '#e2e8f0'
  }
}

function ProofViewer({ orderId, onClose }) {
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const controller = new AbortController()
    let objectUrl = ''

    const loadProof = async () => {
      try {
        const token = localStorage.getItem('token')

        if (!token) {
          throw new Error('Sesión no disponible.')
        }

        const response = await fetch(
          `${API_URL}/api/orders/${encodeURIComponent(orderId)}/proof`,
          {
            headers: {
              Authorization: `Bearer ${token}`
            },
            cache: 'no-store',
            signal: controller.signal
          }
        )

        if (!response.ok) {
          throw new Error('No se pudo cargar la evidencia.')
        }

        const blob = await response.blob()

        if (!blob.type.startsWith('image/')) {
          throw new Error('El archivo no es una imagen.')
        }

        if (controller.signal.aborted) return

        objectUrl = URL.createObjectURL(blob)
        setUrl(objectUrl)
      } catch (err) {
        if (!controller.signal.aborted) {
          setError(err.message)
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false)
        }
      }
    }

    loadProof()

    return () => {
      controller.abort()
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [orderId])

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Evidencia del pedido ${orderId}`}
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(8,20,45,.78)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20
      }}
    >
      <div
        onClick={(event) => event.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 650,
          padding: 25,
          background: '#fff',
          borderRadius: 18,
          maxHeight: '90vh',
          overflowY: 'auto'
        }}
      >
        <div className="adm-panel-heading">
          <h2>
            <FiCamera /> Evidencia #{orderId}
          </h2>

          <button
            type="button"
            className="adm-icon-button"
            onClick={onClose}
            aria-label="Cerrar"
          >
            <FiX />
          </button>
        </div>

        <p>Fotografía enviada por el cliente.</p>

        {loading && <p>Cargando fotografía...</p>}

        {error && (
          <p role="alert" style={{ color: '#b91c1c' }}>
            {error}
          </p>
        )}

        {url && (
          <img
            src={url}
            alt={`Evidencia del pedido ${orderId}`}
            style={{
              width: '100%',
              maxHeight: 550,
              objectFit: 'contain',
              borderRadius: 12
            }}
          />
        )}
      </div>
    </div>
  )
}

function Admin() {
  const navigate = useNavigate()

  const [activeSection, setActiveSection] = useState('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const [products, setProducts] = useState([])
  const [users, setUsers] = useState([])
  const [orders, setOrders] = useState([])
  const [stats, setStats] = useState(null)

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const [search, setSearch] = useState('')
  const [editingProduct, setEditingProduct] = useState(null)
  const [recentLimit, setRecentLimit] = useState(5)
  const [orderFilter, setOrderFilter] = useState('todos')
  const [proofOrderId, setProofOrderId] = useState(null)
  const [updatingOrderId, setUpdatingOrderId] = useState(null)

  const storedUser = getStoredUser()

  const isAdmin =
    String(storedUser?.role || '').toUpperCase() === 'ADMIN'

  const apiRequest = useCallback(async (path, options = {}) => {
    const token = localStorage.getItem('token')

    if (!token) throw new Error('Debés iniciar sesión.')

    const isFormData = options.body instanceof FormData

    const response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: {
        ...(options.body && !isFormData
          ? { 'Content-Type': 'application/json' }
          : {}),
        Authorization: `Bearer ${token}`,
        ...options.headers
      }
    })

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

  const adminRequest = useCallback(
    (endpoint, options = {}) =>
      apiRequest(`/api/admin${endpoint}`, options),
    [apiRequest]
  )

  const loadData = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      const results = await Promise.allSettled([
        adminRequest('/products'),
        adminRequest('/users'),
        adminRequest('/stats'),
        apiRequest('/api/orders/admin/all')
      ])

      const errors = []

      if (results[0].status === 'fulfilled') {
        setProducts(getList(results[0].value, 'products'))
      } else {
        errors.push(
          `Productos: ${results[0].reason?.message || 'Error de carga'}`
        )
      }

      if (results[1].status === 'fulfilled') {
        setUsers(getList(results[1].value, 'users'))
      } else {
        errors.push(
          `Usuarios: ${results[1].reason?.message || 'Error de carga'}`
        )
      }

      if (results[2].status === 'fulfilled') {
        setStats(results[2].value)
      } else {
        errors.push(
          `Estadísticas: ${results[2].reason?.message || 'Error de carga'}`
        )
      }

      if (results[3].status === 'fulfilled') {
        setOrders(
          getList(results[3].value, 'orders').sort(
            (a, b) =>
              new Date(b.created_at || 0) -
              new Date(a.created_at || 0)
          )
        )
      } else {
        errors.push(
          `Pedidos: ${results[3].reason?.message || 'Error de carga'}`
        )
      }

      if (errors.length) {
        setError(
          `No se pudo cargar toda la información. ${errors.join(' | ')}`
        )
      }

      return results[0].status === 'fulfilled'
    } catch (err) {
      setError(err.message || 'No se pudo cargar el panel.')
      return false
    } finally {
      setLoading(false)
    }
  }, [adminRequest, apiRequest])

  useEffect(() => {
    if (isAdmin) {
      loadData()
    } else {
      setLoading(false)
    }
  }, [isAdmin, loadData])

  const recentProducts = useMemo(() => {
    return [...products]
      .filter((product) =>
        Boolean(product.created_at || product.createdAt)
      )
      .sort(
        (a, b) =>
          new Date(b.created_at || b.createdAt) -
          new Date(a.created_at || a.createdAt)
      )
      .slice(0, recentLimit)
  }, [products, recentLimit])

  const newProductsLast30Days = products.filter((product) => {
    const created = Date.parse(
      product.created_at || product.createdAt || ''
    )

    return Number.isFinite(created) &&
      created <= Date.now() &&
      Date.now() - created <= 30 * 24 * 60 * 60 * 1000
  })

  const lowStockProducts = products.filter(
    (product) => Number(product.stock) <= 5
  )

  const confirmedOrders = orders.filter(
    (order) => Boolean(order.delivery_confirmed_at)
  )

  const deliveredOrders = orders.filter(
    (order) => getOrderStatus(order.status).value === 'entregado'
  )

  const pendingConfirmation = deliveredOrders.filter(
    (order) => !order.delivery_confirmed_at
  )

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

  const filteredOrders = orders.filter((order) => {
    const status = getOrderStatus(order.status).value

    if (orderFilter === 'todos') return true
    if (orderFilter === 'confirmados') {
      return Boolean(order.delivery_confirmed_at)
    }
    if (orderFilter === 'sin-confirmar') {
      return status === 'entregado' && !order.delivery_confirmed_at
    }

    return status === orderFilter
  })

  const changeSection = (section) => {
    setActiveSection(section)
    setSidebarOpen(false)
    setSearch('')
    setError('')
    setNotice('')

    if (section === 'add-product') {
      setEditingProduct(null)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    localStorage.removeItem('rememberMe')

    window.dispatchEvent(new Event('auth-change'))

    navigate('/login', { replace: true })
  }

  const handleSaveProduct = async (formData) => {
    if (saving) return

    setSaving(true)
    setError('')
    setNotice('')

    const isEditing = Boolean(editingProduct)

    try {
      await adminRequest(
        isEditing
          ? `/products/${editingProduct.id}`
          : '/products',
        {
          method: isEditing ? 'PUT' : 'POST',
          body: formData
        }
      )

      setEditingProduct(null)
      setActiveSection('products')

      const refreshed = await loadData()

      setNotice(
        refreshed
          ? isEditing
            ? 'Producto actualizado correctamente.'
            : 'Producto agregado correctamente.'
          : 'Producto guardado, pero no se pudo actualizar el catálogo.'
      )
    } catch (err) {
      setError(err.message || 'No se pudo guardar el producto.')
    } finally {
      setSaving(false)
    }
  }

  const handleEditProduct = (product) => {
    setEditingProduct(product)
    setActiveSection('add-product')
    setError('')
    setNotice('')
  }

  const handleDeleteProduct = async (product) => {
    if (!window.confirm(
      `¿Eliminar el producto "${product.name}"?`
    )) return

    try {
      setError('')
      setNotice('')

      await adminRequest(`/products/${product.id}`, {
        method: 'DELETE'
      })

      await loadData()
      setNotice('Producto eliminado correctamente.')
    } catch (err) {
      setError(err.message)
    }
  }

  const handleBlockUser = async (user) => {
    const blocked = !user.is_blocked

    if (!window.confirm(
      blocked
        ? `¿Bloquear a ${user.name}?`
        : `¿Desbloquear a ${user.name}?`
    )) return

    try {
      setError('')
      setNotice('')

      await adminRequest(`/users/${user.id}/block`, {
        method: 'PATCH',
        body: JSON.stringify({ blocked })
      })

      await loadData()
      setNotice('Cuenta actualizada correctamente.')
    } catch (err) {
      setError(err.message)
    }
  }

  const handleDeleteUser = async (user) => {
    if (!window.confirm(
      `¿Eliminar permanentemente a ${user.name}?`
    )) return

    try {
      setError('')
      setNotice('')

      await adminRequest(`/users/${user.id}`, {
        method: 'DELETE'
      })

      await loadData()
      setNotice('Usuario eliminado correctamente.')
    } catch (err) {
      setError(err.message)
    }
  }

  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    if (updatingOrderId !== null) return

    const current = orders.find(
      (order) => String(order.id) === String(orderId)
    )

    if (!current) return

    if (current.delivery_confirmed_at) {
      setError(
        'El cliente ya confirmó la recepción. No se puede cambiar el estado.'
      )
      return
    }

    if (getOrderStatus(current.status).value === newStatus) {
      return
    }

    const label = ORDER_STATUSES.find(
      (status) => status.value === newStatus
    )?.label || newStatus

    if (!window.confirm(
      `¿Cambiar el pedido #${orderId} a "${label}"?`
    )) return

    setUpdatingOrderId(orderId)
    setError('')
    setNotice('')

    try {
      const result = await apiRequest(
        `/api/orders/admin/${encodeURIComponent(orderId)}/status`,
        {
          method: 'PATCH',
          body: JSON.stringify({ status: newStatus })
        }
      )

      setOrders((previous) =>
        previous.map((order) =>
          String(order.id) === String(orderId)
            ? { ...order, ...(result.order || {}) }
            : order
        )
      )

      setNotice(
        `Estado del pedido #${orderId} actualizado correctamente.`
      )
    } catch (err) {
      setError(err.message || 'No se pudo actualizar el pedido.')
    } finally {
      setUpdatingOrderId(null)
    }
  }

  const sectionTitles = {
    dashboard: 'Panel principal',
    products: 'Gestión de productos',
    'add-product': editingProduct
      ? 'Editar producto'
      : 'Nuevo producto',
    inventory: 'Inventario',
    users: 'Gestión de usuarios',
    orders: 'Pedidos y entregas'
  }

  if (!isAdmin) {
    return (
      <main className="admin-access-page">
        <div className="admin-access-card">
          <FiLock size={42} />
          <h1>Acceso restringido</h1>
          <p>Necesitás una cuenta de administrador.</p>

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

        {/* ENCABEZADO */}

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
                Gestioná tu tienda de forma sencilla y segura.
              </p>
            </div>
          </div>

          <button
            type="button"
            className="adm-btn adm-btn-outline"
            onClick={loadData}
            disabled={loading}
          >
            <FiRefreshCw /> Actualizar
          </button>
        </header>

        {/* MENSAJES */}

        {error && (
          <div
            className="adm-alert adm-alert-error"
            role="alert"
          >
            <FiAlertTriangle />
            <span>{error}</span>
          </div>
        )}

        {notice && (
          <div
            className="adm-alert adm-alert-success"
            role="status"
          >
            {notice}
          </div>
        )}

        {loading ? (
          <div className="adm-loading">
            Cargando información de NICA S-MART...
          </div>
        ) : (
          <div className="adm-content">

            {/* ==================================
                PANEL PRINCIPAL
            ================================== */}

            {activeSection === 'dashboard' && (
              <>
                <section className="adm-stats">
                  {[
                    {
                      label: 'Productos',
                      value: stats?.products?.total ?? products.length,
                      Icon: FiPackage,
                      color: 'blue'
                    },
                    {
                      label: 'Inventario bajo',
                      value: stats?.products?.low_stock ?? lowStockProducts.length,
                      Icon: FiAlertTriangle,
                      color: 'amber'
                    },
                    {
                      label: 'Usuarios',
                      value: stats?.users?.total ?? users.length,
                      Icon: FiUsers,
                      color: 'purple'
                    },
                    {
                      label: 'Pedidos',
                      value: orders.length,
                      Icon: FiShoppingCart,
                      color: 'green'
                    }
                  ].map(({ label, value, Icon, color }) => (
                    <div className="adm-stat-card" key={label}>
                      <div className={`adm-stat-icon ${color}`}>
                        <Icon />
                      </div>

                      <span>{label}</span>
                      <strong>{value}</strong>
                    </div>
                  ))}
                </section>

                <section className="adm-panel">
                  <div className="adm-panel-heading">
                    <div>
                      <h2>Acciones rápidas</h2>
                      <p>Accedé a las operaciones frecuentes.</p>
                    </div>
                  </div>

                  <div className="adm-quick-grid">
                    {[
                      ['add-product', 'Agregar producto', FiPlus],
                      ['products', 'Gestionar productos', FiPackage],
                      ['inventory', 'Ver inventario', FiAlertTriangle],
                      ['users', 'Administrar usuarios', FiUsers],
                      ['orders', 'Gestionar entregas', FiTruck]
                    ].map(([section, label, Icon]) => (
                      <button
                        key={section}
                        type="button"
                        onClick={() => changeSection(section)}
                      >
                        <Icon />
                        <span>{label}</span>
                      </button>
                    ))}

                    <button
                      type="button"
                      onClick={() => navigate('/new-products')}
                    >
                      <FiExternalLink />
                      <span>Ver Nuevos ingresos</span>
                    </button>
                  </div>
                </section>

                <section className="adm-panel">
                  <div className="adm-panel-heading">
                    <div>
                      <h2>Últimos productos agregados</h2>
                      <p>Ordenados por fecha de registro.</p>
                    </div>

                    <button
                      type="button"
                      className="adm-btn adm-btn-primary"
                      onClick={() => navigate('/new-products')}
                    >
                      <FiExternalLink /> Ver tienda
                    </button>
                  </div>

                  <p>
                    Nuevos en los últimos 30 días:{' '}
                    <strong>{newProductsLast30Days.length}</strong>
                  </p>

                  <label>
                    Mostrar:{' '}
                    <select
                      value={recentLimit}
                      onChange={(e) =>
                        setRecentLimit(Number(e.target.value))
                      }
                    >
                      <option value={5}>Últimos 5</option>
                      <option value={10}>Últimos 10</option>
                      <option value={20}>Últimos 20</option>
                    </select>
                  </label>

                  {recentProducts.length === 0 ? (
                    <p className="adm-empty">
                      No hay productos recientes.
                    </p>
                  ) : (
                    <div className="adm-table-wrap">
                      <table className="adm-table">
                        <thead>
                          <tr>
                            <th>Producto</th>
                            <th>Precio</th>
                            <th>Fecha</th>
                            <th>Acción</th>
                          </tr>
                        </thead>
                        <tbody>
                          {recentProducts.map((product) => (
                            <tr key={product.id}>
                              <td>{product.name}</td>
                              <td>{money(product.price)}</td>
                              <td>{formatDate(product.created_at)}</td>
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
                      Gestioná nombres, precios, existencias e imágenes.
                    </p>
                  </div>

                  <button
                    type="button"
                    className="adm-btn adm-btn-primary"
                    onClick={() => changeSection('add-product')}
                  >
                    <FiPlus /> Nuevo producto
                  </button>
                </div>

                <div className="adm-search">
                  <FiSearch />
                  <input
                    type="search"
                    placeholder="Buscar producto..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>

                <div className="adm-table-wrap">
                  <table className="adm-table">
                    <thead>
                      <tr>
                        <th>Producto</th>
                        <th>Precio</th>
                        <th>Stock</th>
                        <th>Fecha</th>
                        <th>Acciones</th>
                      </tr>
                    </thead>

                    <tbody>
                      {filteredProducts.length === 0 && (
                        <tr>
                          <td colSpan={5} className="adm-empty">
                            No hay productos para mostrar.
                            Revisá el aviso superior o agregá un producto.
                          </td>
                        </tr>
                      )}

                      {filteredProducts.map((product) => {
                        const image = getProductImage(product)

                        return (
                          <tr key={product.id}>
                            <td>
                              <div className="adm-product-cell">
                                <div className="adm-product-image">
                                  {image ? (
                                    <img
                                      src={image}
                                      alt={product.name || 'Producto'}
                                    />
                                  ) : (
                                    <FiPackage />
                                  )}
                                </div>

                                <div>
                                  <strong>{product.name}</strong>
                                  <small>
                                    Producto #{product.id}
                                  </small>
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

                            <td>{formatDate(product.created_at)}</td>

                            <td>
                              <div className="adm-row-actions">
                                <button
                                  type="button"
                                  className="adm-icon-button"
                                  onClick={() => handleEditProduct(product)}
                                  title="Editar"
                                >
                                  <FiEdit2 />
                                </button>

                                <button
                                  type="button"
                                  className="adm-icon-button danger"
                                  onClick={() => handleDeleteProduct(product)}
                                  title="Eliminar"
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
              </section>
            )}

            {/* ==================================
                AGREGAR Y EDITAR PRODUCTOS
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
                      Los cambios se guardarán mediante
                      la API administrativa.
                    </p>
                  </div>

                  <button
                    type="button"
                    className="adm-btn adm-btn-outline"
                    onClick={() => changeSection('products')}
                  >
                    <FiArrowLeft /> Volver
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
                    <p>Consultá y ajustá las existencias.</p>
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
                      {products.length === 0 && (
                        <tr>
                          <td colSpan={4} className="adm-empty">
                            No hay productos disponibles.
                          </td>
                        </tr>
                      )}

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
                              <FiEdit2 /> Actualizar
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
                    <p>Gestioná las cuentas de clientes.</p>
                  </div>
                </div>

                <div className="adm-search">
                  <FiSearch />

                  <input
                    type="search"
                    placeholder="Buscar nombre o correo..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
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
                      {filteredUsers.length === 0 && (
                        <tr>
                          <td colSpan={4} className="adm-empty">
                            No hay usuarios para mostrar.
                          </td>
                        </tr>
                      )}

                      {filteredUsers.map((user) => {
                        const protectedUser =
                          String(user.role || '')
                            .toUpperCase() === 'ADMIN'

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
                                  disabled={protectedUser}
                                  onClick={() => handleBlockUser(user)}
                                  title="Bloquear o desbloquear"
                                >
                                  {user.is_blocked
                                    ? <FiUnlock />
                                    : <FiLock />}
                                </button>

                                <button
                                  type="button"
                                  className="adm-icon-button danger"
                                  disabled={protectedUser}
                                  onClick={() => handleDeleteUser(user)}
                                  title="Eliminar usuario"
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

              </section>
            )}

            {/* ==================================
                PEDIDOS Y ENTREGAS
            ================================== */}

            {activeSection === 'orders' && (
              <section className="adm-panel">

                <div className="adm-panel-heading">
                  <div>
                    <h2>
                      <FiTruck /> Gestión de pedidos y entregas
                    </h2>

                    <p>
                      Consultá los envíos, las entregas
                      y las confirmaciones de clientes.
                    </p>
                  </div>

                  <button
                    type="button"
                    className="adm-btn adm-btn-outline"
                    onClick={loadData}
                    disabled={loading}
                  >
                    <FiRefreshCw /> Actualizar
                  </button>
                </div>

                {/* PANEL DE ESTADÍSTICAS */}
                <div
                  className="adm-delivery-stats"
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                    gap: 15,
                    marginBottom: 25
                  }}
                >
                  {ORDER_STATUSES.map((status) => {
                    const quantity = orders.filter(
                      (order) => getOrderStatus(order.status).value === status.value
                    ).length

                    return (
                      <div
                        key={status.value}
                        style={{
                          padding: 20,
                          borderRadius: 14,
                          border: '1px solid #e2e8f0',
                          background: '#ffffff'
                        }}
                      >
                        <span
                          style={{
                            display: 'block',
                            fontSize: 13,
                            color: '#64748b',
                            marginBottom: 10
                          }}
                        >
                          {status.label}
                        </span>

                        <strong
                          style={{
                            fontSize: 28,
                            fontWeight: 800,
                            color: status.color
                          }}
                        >
                          {quantity}
                        </strong>
                      </div>
                    )
                  })}
                </div>

                <div
                  style={{
                    display: 'flex',
                    gap: 12,
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    marginBottom: 20
                  }}
                >
                  <FiFilter color="#075cd8" />

                  <select
                    value={orderFilter}
                    onChange={(e) => setOrderFilter(e.target.value)}
                    style={{
                      padding: 11,
                      border: '1px solid #cbd5e1',
                      borderRadius: 9,
                      background: '#fff'
                    }}
                  >
                    <option value="todos">Todos los pedidos</option>
                    <option value="pendiente">Pendientes</option>
                    <option value="preparando">En preparación</option>
                    <option value="enviado">En camino</option>
                    <option value="entregado">Entregados</option>
                    <option value="confirmados">
                      Confirmados por cliente
                    </option>
                    <option value="sin-confirmar">
                      Entregados sin confirmar
                    </option>
                    <option value="cancelado">Cancelados</option>
                  </select>

                  <span style={{ color: '#64748b', fontSize: 13 }}>
                    {filteredOrders.length} pedido(s)
                  </span>
                </div>

                {orders.length === 0 ? (
                  <div className="adm-coming-soon">
                    <FiShoppingCart size={42} />
                    <h3>No hay pedidos registrados</h3>
                    <p>Las compras aparecerán aquí.</p>
                  </div>
                ) : filteredOrders.length === 0 ? (
                  <p className="adm-empty">
                    No hay pedidos con este filtro.
                  </p>
                ) : (
                  <div className="adm-table-wrap">
                    <table className="adm-table">

                      <thead>
                        <tr>
                          <th>Pedido</th>
                          <th>Cliente</th>
                          <th>Dirección</th>
                          <th>Productos</th>
                          <th>Total</th>
                          <th>Estado</th>
                          <th>Hora de envío</th>
                          <th>Hora de entrega</th>
                          <th>Confirmación</th>
                          <th>Evidencia</th>
                        </tr>
                      </thead>

                      <tbody>
                        {filteredOrders.map((order) => {
                          const status = getOrderStatus(order.status)
                          const confirmed =
                            Boolean(order.delivery_confirmed_at)

                          const items = Array.isArray(order.items)
                            ? order.items
                            : Array.isArray(order.order_items)
                              ? order.order_items
                              : []

                          return (
                            <tr key={order.id}>

                              <td>
                                <strong>#{order.id}</strong>
                                <small style={{ display: 'block' }}>
                                  {formatDate(order.created_at)}
                                </small>
                              </td>

                              <td>
                                <div className="adm-user-cell">
                                  <div className="adm-avatar">
                                    {String(order.customer_name || '?')
                                      .charAt(0).toUpperCase()}
                                  </div>

                                  <div>
                                    <strong>
                                      {order.customer_name || 'Cliente'}
                                    </strong>

                                    <small>
                                      {order.customer_email}
                                    </small>

                                    <small>
                                      {order.customer_phone}
                                    </small>
                                  </div>
                                </div>
                              </td>

                              <td>
                                <div style={{ minWidth: 160 }}>
                                  <span>
                                    {order.customer_address ||
                                      'Sin dirección'}
                                  </span>

                                  {order.customer_address && (
                                    <a
                                      href={
                                        'https://www.google.com/maps/search/?api=1&query=' +
                                        encodeURIComponent(
                                          `${order.customer_address}, Nicaragua`
                                        )
                                      }
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 6,
                                        marginTop: 8,
                                        color: '#075cd8',
                                        fontSize: 12
                                      }}
                                    >
                                      <FiNavigation /> Buscar en Maps
                                    </a>
                                  )}
                                </div>
                              </td>

                              <td>
                                {items.length > 0 ? (
                                  <ul
                                    style={{
                                      margin: 0,
                                      paddingLeft: 18,
                                      minWidth: 125
                                    }}
                                  >
                                    {items.map((item, index) => (
                                      <li key={item.id ?? index}>
                                        {item.quantity || 1}×{' '}
                                        {item.product_name ||
                                          item.name ||
                                          'Producto'}
                                      </li>
                                    ))}
                                  </ul>
                                ) : (
                                  <small>
                                    Sin productos disponibles
                                  </small>
                                )}
                              </td>

                              <td>
                                <strong>{money(order.total)}</strong>
                              </td>

                              <td>
                                <div
                                  style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: 10,
                                    minWidth: 150
                                  }}
                                >
                                  <span
                                    style={{
                                      padding: '8px 12px',
                                      borderRadius: 20,
                                      textAlign: 'center',
                                      fontSize: 12,
                                      fontWeight: 700,
                                      color: status.color,
                                      background: status.bg
                                    }}
                                  >
                                    {status.label}
                                  </span>

                                  <select
                                    value={status.value}
                                    disabled={
                                      updatingOrderId !== null ||
                                      confirmed
                                    }
                                    onChange={(e) =>
                                      handleUpdateOrderStatus(
                                        order.id,
                                        e.target.value
                                      )
                                    }
                                    style={{
                                      padding: 9,
                                      borderRadius: 8,
                                      border: '1px solid #cbd5e1',
                                      background: '#fff'
                                    }}
                                  >
                                    {!ORDER_STATUSES.some(
                                      (item) =>
                                        item.value === status.value
                                    ) && (
                                      <option value={status.value}>
                                        {status.label}
                                      </option>
                                    )}

                                    {ORDER_STATUSES.map((item) => (
                                      <option
                                        key={item.value}
                                        value={item.value}
                                      >
                                        {item.label}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              </td>

                              <td>
                                <FiClock />{' '}
                                {formatDate(order.shipped_at)}
                              </td>

                              <td>
                                <FiTruck />{' '}
                                {formatDate(order.delivered_at)}
                              </td>

                              <td>
                                <div
                                  style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: 8,
                                    minWidth: 155
                                  }}
                                >
                                  <span
                                    style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: 6,
                                      padding: '7px 11px',
                                      borderRadius: 20,
                                      fontSize: 12,
                                      fontWeight: 700,
                                      color: confirmed
                                        ? '#15803d'
                                        : '#a16207',
                                      background: confirmed
                                        ? '#dcfce7'
                                        : '#fef3c7'
                                    }}
                                  >
                                    {confirmed
                                      ? <FiCheckCircle />
                                      : <FiClock />}

                                    {confirmed
                                      ? 'Confirmado por cliente'
                                      : 'Sin confirmar'}
                                  </span>

                                  {confirmed && (
                                    <small>
                                      {formatDate(
                                        order.delivery_confirmed_at
                                      )}
                                    </small>
                                  )}
                                </div>
                              </td>

                              <td>
                                {order.has_delivery_photo ? (
                                  <button
                                    type="button"
                                    className="adm-btn adm-btn-outline"
                                    onClick={() =>
                                      setProofOrderId(order.id)
                                    }
                                  >
                                    <FiCamera /> Ver fotografía
                                  </button>
                                ) : (
                                  <small>
                                    Sin fotografía
                                  </small>
                                )}
                              </td>

                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )}

              </section>
            )}

          </div>
        )}

      </main>

      {/* MODAL DE EVIDENCIA */}

      {proofOrderId !== null && (
        <ProofViewer
          orderId={proofOrderId}
          onClose={() => setProofOrderId(null)}
        />
      )}

    </div>
  )
}

export default Admin