
import {
  useEffect,
  useState,
  useCallback
} from 'react'

import {
  Link,
  useNavigate
} from 'react-router-dom'

import {
  FiShoppingBag,
  FiFileText,
  FiShoppingCart,
  FiCreditCard,
  FiUser,
  FiMapPin,
  FiTruck,
  FiPackage,
  FiCheckCircle,
  FiChevronRight,
  FiCalendar,
  FiPhone,
  FiAlertCircle,
  FiClock,
  FiRefreshCw,
  FiNavigation,
  FiArrowRight,
  FiXCircle
} from 'react-icons/fi'

import Header from '../components/Header'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

import '../styles/myOrders.css'

// ==========================================
// CONFIGURACIÓN DE API
// ==========================================

const API_URL = String(
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV ? 'http://localhost:3000' : '')
)
  .trim()
  .replace(/\/+$/, '')

// ==========================================
// FORMATO DE MONEDA
// ==========================================

const formatMoney = (value) =>
  new Intl.NumberFormat('es-NI', {
    style: 'currency',
    currency: 'NIO',
    maximumFractionDigits: 0
  }).format(Number(value) || 0)

// ==========================================
// FORMATO DE FECHA
// ==========================================

const formatDate = (value) => {
  if (!value) return 'Fecha no disponible'

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return 'Fecha no disponible'
  }

  return new Intl.DateTimeFormat('es-NI', {
    timeZone: 'America/Managua',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(date)
}

// ==========================================
// IDENTIFICAR ESTADOS REALES
// ==========================================

const normalizeStatus = (value) =>
  String(value ?? '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[_-]+/g, ' ')

function getStatusInfo(value) {
  const status = normalizeStatus(value)

  if (
    [
      'delivered',
      'entregado',
      'completed',
      'completado'
    ].includes(status)
  ) {
    return {
      label: 'Entregado',
      className: 'delivered',
      Icon: FiCheckCircle,
      step: 4
    }
  }

  if (
    [
      'cancelled',
      'canceled',
      'cancelado',
      'rechazado'
    ].includes(status)
  ) {
    return {
      label: 'Cancelado',
      className: 'cancelled',
      Icon: FiXCircle,
      step: 0
    }
  }

  if (
    [
      'shipped',
      'shipping',
      'enviado',
      'en camino',
      'en reparto',
      'out for delivery'
    ].includes(status)
  ) {
    return {
      label: 'En camino',
      className: 'shipped',
      Icon: FiTruck,
      step: 3
    }
  }

  if (
    [
      'processing',
      'preparing',
      'preparando',
      'en preparacion',
      'en proceso',
      'procesando'
    ].includes(status)
  ) {
    return {
      label: 'En preparación',
      className: 'processing',
      Icon: FiPackage,
      step: 2
    }
  }

  if (
    [
      'pending',
      'pendiente',
      'registered',
      'registrado',
      'received',
      'recibido'
    ].includes(status)
  ) {
    return {
      label: 'Pedido recibido',
      className: 'registered',
      Icon: FiClock,
      step: 1
    }
  }

  return {
    label: String(value || 'Estado no disponible'),
    className: 'registered',
    Icon: FiClock,
    step: 0
  }
}

// ==========================================
// ETAPAS DE ENTREGA
// ==========================================

const ORDER_STEPS = [
  {
    label: 'Pedido recibido',
    Icon: FiShoppingBag
  },
  {
    label: 'En preparación',
    Icon: FiPackage
  },
  {
    label: 'En camino',
    Icon: FiTruck
  },
  {
    label: 'Entregado',
    Icon: FiCheckCircle
  }
]

// ==========================================
// OBTENER ARTÍCULOS
// ==========================================

function getOrderItems(order) {
  if (Array.isArray(order.items)) {
    return order.items
  }

  if (Array.isArray(order.order_items)) {
    return order.order_items
  }

  return []
}

// ==========================================
// COMPONENTE PRINCIPAL
// ==========================================

function MyOrders() {
  const navigate = useNavigate()

  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')
  const [expandedOrders, setExpandedOrders] = useState({})
  const [lastUpdated, setLastUpdated] = useState(null)

  // ==========================================
  // CONSULTAR PEDIDOS DE POSTGRESQL
  // ==========================================

  const fetchOrders = useCallback(
    async ({ signal, silent = false } = {}) => {
      const token = localStorage.getItem('token')

      if (!token) {
        setError(
          'Debés iniciar sesión para consultar tus pedidos.'
        )
        setLoading(false)
        setRefreshing(false)
        return
      }

      if (silent) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }

      try {
        const response = await fetch(
          `${API_URL}/api/orders`,
          {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${token}`
            },
            signal,
            cache: 'no-store'
          }
        )

        const data = await response
          .json()
          .catch(() => null)

        if (signal?.aborted) return

        if (response.status === 401) {
          throw new Error(
            'Tu sesión expiró. Iniciá sesión nuevamente.'
          )
        }

        if (!response.ok) {
          throw new Error(
            data?.message ||
            data?.error ||
            'No se pudieron cargar tus pedidos.'
          )
        }

        const list = Array.isArray(data)
          ? data
          : Array.isArray(data?.orders)
            ? data.orders
            : Array.isArray(data?.data)
              ? data.data
              : null

        if (!list) {
          throw new Error(
            'El servidor no devolvió una lista válida de pedidos.'
          )
        }

        const sortedOrders = [...list].sort(
          (a, b) =>
            new Date(b.created_at || b.createdAt || 0) -
            new Date(a.created_at || a.createdAt || 0)
        )

        setOrders(sortedOrders)
        setError('')
        setLastUpdated(new Date())

      } catch (err) {
        if (signal?.aborted || err.name === 'AbortError') {
          return
        }

        console.error('Error cargando pedidos:', err)

        setError(
          err.message || 'Error al cargar los pedidos.'
        )

      } finally {
        if (!signal?.aborted) {
          setLoading(false)
          setRefreshing(false)
        }
      }
    },
    []
  )

  // ==========================================
  // CARGAR PEDIDOS Y ACTUALIZAR ESTADOS
  // ==========================================

  useEffect(() => {
    const controller = new AbortController()

    let inFlight = false

    const load = async (silent = false) => {
      if (inFlight) return

      inFlight = true

      try {
        await fetchOrders({
          signal: controller.signal,
          silent
        })
      } finally {
        inFlight = false
      }
    }

    load()

    // Actualizar cada 30 segundos cuando
    // la página esté visible.

    const interval = window.setInterval(() => {
      if (document.visibilityState === 'visible') {
        load(true)
      }
    }, 30000)

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        load(true)
      }
    }

    document.addEventListener(
      'visibilitychange',
      handleVisibilityChange
    )

    return () => {
      controller.abort()
      window.clearInterval(interval)

      document.removeEventListener(
        'visibilitychange',
        handleVisibilityChange
      )
    }
  }, [fetchOrders])

  // ==========================================
  // ABRIR Y CERRAR DETALLES
  // ==========================================

  const toggleOrder = (id) => {
    setExpandedOrders((previous) => ({
      ...previous,
      [id]: !previous[id]
    }))
  }

  // ==========================================
  // INTERFAZ
  // ==========================================

  return (
    <>
      <Header />
      <Navbar />

      <main className="my-orders-page">

        <div className="my-orders-container">

          {/* RUTA DE NAVEGACIÓN */}

          <nav
            className="my-orders-breadcrumb"
            aria-label="Ruta de navegación"
          >
            <Link to="/">Inicio</Link>

            <FiChevronRight />

            <Link to="/profile">
              Mi cuenta
            </Link>

            <FiChevronRight />

            <span>Mis pedidos</span>
          </nav>

          {/* ==================================
              ENCABEZADO
          ================================== */}

          <div className="my-orders-heading">

            <div>
              <span className="my-orders-eyebrow">
                NICA S-MART · MI CUENTA
              </span>

              <h1>Mis pedidos</h1>

              <p>
                Consultá tus compras, revisá los
                productos y seguí el estado de
                tus entregas.
              </p>
            </div>

            <div className="my-orders-decoration">
              <FiShoppingBag />
              <FiFileText />
            </div>

          </div>

          {/* ==================================
              BARRA DE ACTUALIZACIÓN
          ================================== */}

          {!loading && (
            <div className="my-orders-toolbar">

              <div className="my-orders-toolbar-info">
                <FiPackage />

                <span>
                  {orders.length}
                  {' '}
                  {orders.length === 1
                    ? 'pedido registrado'
                    : 'pedidos registrados'}
                </span>

                {lastUpdated && (
                  <small>
                    Actualizado a las{' '}
                    {lastUpdated.toLocaleTimeString(
                      'es-NI',
                      {
                        timeZone: 'America/Managua',
                        hour: '2-digit',
                        minute: '2-digit'
                      }
                    )}
                  </small>
                )}
              </div>

              <button
                type="button"
                className="my-orders-refresh"
                disabled={refreshing}
                onClick={() =>
                  fetchOrders({ silent: true })
                }
              >
                <FiRefreshCw />

                {refreshing
                  ? 'Actualizando...'
                  : 'Actualizar pedidos'}
              </button>

            </div>
          )}

          {/* ==================================
              CARGANDO
          ================================== */}

          {loading && (
            <div className="my-orders-message">

              <div className="my-orders-loader" />

              <h2>Cargando tus pedidos...</h2>

              <p>
                Estamos consultando tu historial
                de compras.
              </p>

            </div>
          )}

          {/* ==================================
              ERROR
          ================================== */}

          {!loading && error && (
            <div className="my-orders-alert" role="alert">

              <FiAlertCircle />

              <span>{error}</span>

              <button
                type="button"
                onClick={() => fetchOrders()}
              >
                Reintentar
              </button>

              {error.toLowerCase().includes('sesión') && (
                <button
                  type="button"
                  onClick={() => navigate('/login')}
                >
                  Iniciar sesión
                </button>
              )}

            </div>
          )}

          {/* ==================================
              SIN PEDIDOS
          ================================== */}

          {!loading &&
            !error &&
            orders.length === 0 && (

              <div className="my-orders-message">

                <FiPackage className="my-orders-message-icon" />

                <h2>Aún no tenés pedidos</h2>

                <p>
                  Cuando realicés tu primera compra,
                  aparecerá aquí para que podás
                  consultar su estado.
                </p>

                <Link
                  to="/products"
                  className="my-orders-button primary"
                >
                  <FiShoppingCart />
                  Explorar productos
                </Link>

              </div>
            )}

          {/* ==================================
              LISTADO DE PEDIDOS
          ================================== */}

          {!loading && orders.length > 0 && (

            <section className="my-orders-list">

              {orders.map((order) => {
                const status = getStatusInfo(order.status)

                const StatusIcon = status.Icon

                const expanded = Boolean(
                  expandedOrders[order.id]
                )

                const items = getOrderItems(order)

                const orderId = order.id

                return (
                  <article
                    className="my-order-card"
                    key={orderId}
                  >

                    {/* ENCABEZADO DEL PEDIDO */}

                    <div className="my-order-header">

                      <div className="my-order-title-block">

                        <div className="my-order-title-row">

                          <h2>
                            Pedido #{orderId}
                          </h2>

                          <span
                            className={
                              `my-order-status ${status.className}`
                            }
                          >
                            <StatusIcon />
                            {status.label}
                          </span>

                        </div>

                        <p>
                          Realizado el{' '}
                          {formatDate(
                            order.created_at ||
                            order.createdAt
                          )}
                        </p>

                      </div>

                      {/* ACCIONES */}

                      <div className="my-order-actions">

                        <Link
                          to={`/tracking/${encodeURIComponent(orderId)}`}
                          className="my-orders-button primary"
                        >
                          <FiNavigation />
                          Seguir pedido
                        </Link>

                        <button
                          type="button"
                          className="my-orders-button secondary"
                          onClick={() => toggleOrder(orderId)}
                          aria-expanded={expanded}
                        >
                          <FiFileText />

                          {expanded
                            ? 'Ocultar detalles'
                            : 'Ver detalles'}
                        </button>

                      </div>

                    </div>

                    {/* ==================================
                        PROGRESO DEL PEDIDO
                    ================================== */}

                    {status.step > 0 && (
                      <div className="my-order-progress">

                        {ORDER_STEPS.map((step, index) => {
                          const StepIcon = step.Icon

                          const done =
                            index + 1 <= status.step

                          return (
                            <div
                              className={
                                done
                                  ? 'my-order-progress-step complete'
                                  : 'my-order-progress-step'
                              }
                              key={step.label}
                            >

                              <div className="my-order-progress-icon">
                                <StepIcon />
                              </div>

                              <span>
                                {step.label}
                              </span>

                            </div>
                          )
                        })}

                      </div>
                    )}

                    {/* ==================================
                        RESUMEN
                    ================================== */}

                    <div className="my-order-summary">

                      {/* TOTAL */}

                      <div className="my-order-summary-item">

                        <div className="my-order-summary-icon">
                          <FiCreditCard />
                        </div>

                        <div>
                          <span>Total del pedido</span>

                          <strong className="my-order-total">
                            {formatMoney(order.total)}
                          </strong>
                        </div>

                      </div>

                      {/* CLIENTE */}

                      <div className="my-order-summary-item">

                        <div className="my-order-summary-icon">
                          <FiUser />
                        </div>

                        <div>
                          <span>Cliente</span>

                          <strong>
                            {order.customer_name ||
                              'Cliente'}
                          </strong>
                        </div>

                      </div>

                      {/* DIRECCIÓN */}

                      <div className="my-order-summary-item">

                        <div className="my-order-summary-icon">
                          <FiMapPin />
                        </div>

                        <div>
                          <span>Dirección de entrega</span>

                          <strong>
                            {order.customer_address ||
                              'No registrada'}
                          </strong>
                        </div>

                      </div>

                      {/* SUBTOTAL Y ENVÍO */}

                      <div className="my-order-summary-item">

                        <div className="my-order-summary-icon">
                          <FiTruck />
                        </div>

                        <div className="my-order-price-breakdown">

                          <div>
                            <span>Subtotal</span>

                            <strong>
                              {formatMoney(order.subtotal)}
                            </strong>
                          </div>

                          <div>
                            <span>Envío</span>

                            <strong>
                              {formatMoney(order.shipping)}
                            </strong>
                          </div>

                        </div>

                      </div>

                    </div>

                    {/* ==================================
                        PRODUCTOS COMPRADOS
                    ================================== */}

                    {items.length > 0 && (

                      <div className="my-order-products">

                        <h3>
                          Productos del pedido
                          {' '}
                          ({items.length})
                        </h3>

                        <div className="my-order-product-list">

                          {items.map((item, index) => (

                            <div
                              key={
                                item.id ??
                                item.product_id ??
                                index
                              }
                              className="my-order-product"
                            >

                              <div className="my-order-product-image">

                                {item.image ? (
                                  <img
                                    src={item.image}
                                    alt={
                                      item.product_name ||
                                      item.name ||
                                      'Producto'
                                    }
                                    loading="lazy"
                                  />
                                ) : (
                                  <FiPackage />
                                )}

                              </div>

                              <div className="my-order-product-info">

                                <strong>
                                  {item.product_name ||
                                    item.name ||
                                    'Producto'}
                                </strong>

                                <span>
                                  Producto #
                                  {item.product_id ?? 'N/D'}
                                </span>

                              </div>

                              <div className="my-order-product-quantity">

                                <span>Cantidad</span>

                                <strong>
                                  {item.quantity || 1}
                                </strong>

                              </div>

                              <div className="my-order-product-price">

                                <span>Precio</span>

                                <strong>
                                  {formatMoney(item.price)}
                                </strong>

                              </div>

                            </div>
                          ))}

                        </div>

                      </div>
                    )}

                    {/* ==================================
                        DETALLES ADICIONALES
                    ================================== */}

                    {expanded && (

                      <div className="my-order-details">

                        <h3>
                          Información de tu compra
                        </h3>

                        <div className="my-order-details-grid">

                          <div>
                            <FiCalendar />

                            <span>Fecha del pedido</span>

                            <strong>
                              {formatDate(
                                order.created_at ||
                                order.createdAt
                              )}
                            </strong>
                          </div>

                          <div>
                            <FiPhone />

                            <span>Teléfono</span>

                            <strong>
                              {order.customer_phone ||
                                'No registrado'}
                            </strong>
                          </div>

                          <div>
                            <FiMapPin />

                            <span>Dirección</span>

                            <strong>
                              {order.customer_address ||
                                'No registrada'}
                            </strong>
                          </div>

                          <div>
                            <FiCreditCard />

                            <span>Total registrado</span>

                            <strong>
                              {formatMoney(order.total)}
                            </strong>
                          </div>

                        </div>

                        {items.length === 0 && (
                          <p className="my-order-details-note">
                            El servidor todavía no ha
                            proporcionado el detalle
                            de los productos de este pedido.
                          </p>
                        )}

                        <Link
                          to={`/tracking/${encodeURIComponent(orderId)}`}
                          className="my-orders-track-link"
                        >
                          <FiNavigation />
                          Consultar seguimiento
                          <FiArrowRight />
                        </Link>

                      </div>
                    )}

                  </article>
                )
              })}

            </section>
          )}

        </div>

      </main>

      <Footer />
    </>
  )
}

export default MyOrders
