
import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
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
  FiAlertCircle
} from 'react-icons/fi'

import Header from '../components/Header'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

import '../styles/myOrders.css'

// ==========================================
// CONFIGURACIÓN DE API
// ==========================================

const API_URL = (
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV ? 'http://localhost:3000' : '')
).trim().replace(/\/$/, '')

// ==========================================
// FORMATO DE MONEDA
// ==========================================

const formatMoney = (value) =>
  `C$ ${Number(value || 0).toLocaleString('es-NI', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`

// ==========================================
// FORMATO DE FECHA
// ==========================================

const formatDate = (value) => {
  if (!value) return 'Fecha no disponible'

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return 'Fecha no disponible'
  }

  return date.toLocaleDateString('es-NI', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })
}

// ==========================================
// ESTADOS DE PEDIDOS
// ==========================================

const getStatusInfo = (status) => {
  const normalized = String(status || 'Registrado')
    .trim()
    .toLowerCase()

  if (['delivered', 'entregado', 'completed', 'completado'].includes(normalized)) {
    return {
      label: 'Entregado',
      className: 'delivered'
    }
  }

  if (['cancelled', 'canceled', 'cancelado'].includes(normalized)) {
    return {
      label: 'Cancelado',
      className: 'cancelled'
    }
  }

  if (['processing', 'en proceso', 'procesando'].includes(normalized)) {
    return {
      label: 'En proceso',
      className: 'processing'
    }
  }

  return {
    label: status || 'Registrado',
    className: 'registered'
  }
}

// ==========================================
// COMPONENTE PRINCIPAL
// ==========================================

function MyOrders() {
  const navigate = useNavigate()

  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [expandedOrders, setExpandedOrders] = useState({})

  // ==========================================
  // OBTENER PEDIDOS DE POSTGRESQL
  // ==========================================

  useEffect(() => {
    const controller = new AbortController()

    const fetchOrders = async () => {
      const token = localStorage.getItem('token')

      if (!token) {
        setError('Debes iniciar sesión para consultar tus pedidos.')
        setLoading(false)
        return
      }

      try {
        const response = await fetch(
          `${API_URL}/api/orders`,
          {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${token}`
            },
            signal: controller.signal
          }
        )

        const data = await response.json().catch(() => ({}))

        if (!response.ok) {
          throw new Error(
            response.status === 401
              ? 'Tu sesión expiró. Inicia sesión nuevamente.'
              : data.message ||
                data.error ||
                'No se pudieron cargar tus pedidos.'
          )
        }

        if (!Array.isArray(data)) {
          throw new Error('Respuesta inválida del servidor.')
        }

        setOrders(data)
      } catch (err) {
        if (err.name !== 'AbortError') {
          setError(err.message || 'Error al cargar los pedidos.')
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false)
        }
      }
    }

    fetchOrders()

    return () => controller.abort()
  }, [])

  // ==========================================
  // ABRIR Y CERRAR DETALLES
  // ==========================================

  const toggleOrder = (id) => {
    setExpandedOrders((previous) => ({
      ...previous,
      [id]: !previous[id]
    }))
  }

  return (
    <>
      <Header />
      <Navbar />

      <main className="my-orders-page">
        <div className="my-orders-container">

          {/* ==================================
              RUTA DE NAVEGACIÓN
          ================================== */}

          <nav
            className="my-orders-breadcrumb"
            aria-label="Ruta de navegación"
          >
            <Link to="/">Inicio</Link>

            <FiChevronRight />

            <Link to="/profile">Mi cuenta</Link>

            <FiChevronRight />

            <span>Mis pedidos</span>
          </nav>

          {/* ==================================
              ENCABEZADO
          ================================== */}

          <div className="my-orders-heading">

            <div>
              <h1>Mis pedidos</h1>

              <p>
                Consulta tu historial de compras en NICA S-MART.
              </p>
            </div>

            <div className="my-orders-decoration">
              <FiShoppingBag />
              <FiFileText />
            </div>

          </div>

          {/* ==================================
              CARGANDO
          ================================== */}

          {loading && (
            <div className="my-orders-message">
              <div className="my-orders-loader" />

              <h2>Cargando tus pedidos...</h2>

              <p>
                Estamos consultando tu historial de compras.
              </p>
            </div>
          )}

          {/* ==================================
              ERROR
          ================================== */}

          {!loading && error && (
            <div className="my-orders-message">

              <FiAlertCircle className="my-orders-message-icon" />

              <h2>No pudimos cargar tus pedidos</h2>

              <p role="alert">{error}</p>

              <button
                type="button"
                className="my-orders-button primary"
                onClick={() => navigate('/login')}
              >
                Iniciar sesión
              </button>

            </div>
          )}

          {/* ==================================
              SIN PEDIDOS
          ================================== */}

          {!loading && !error && orders.length === 0 && (
            <div className="my-orders-message">

              <FiPackage className="my-orders-message-icon" />

              <h2>Aún no tienes pedidos</h2>

              <p>
                Cuando realices tu primera compra,
                aparecerá en esta sección.
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
              HISTORIAL DE PEDIDOS
          ================================== */}

          {!loading && !error && orders.length > 0 && (
            <section className="my-orders-list">

              {orders.map((order) => {
                const status = getStatusInfo(order.status)

                const expanded = Boolean(
                  expandedOrders[order.id]
                )

                const items = Array.isArray(order.items)
                  ? order.items
                  : null

                return (
                  <article
                    className="my-order-card"
                    key={order.id}
                  >

                    {/* ENCABEZADO DE LA TARJETA */}

                    <div className="my-order-header">

                      <div className="my-order-title-block">

                        <div className="my-order-title-row">

                          <h2>
                            Pedido #{order.id}
                          </h2>

                          <span
                            className={`my-order-status ${status.className}`}
                          >
                            <FiCheckCircle />
                            {status.label}
                          </span>

                        </div>

                        <p>
                          Realizado el {formatDate(order.created_at)}
                        </p>

                      </div>

                      {/* ACCIONES */}

                      <div className="my-order-actions">

                        <button
                          type="button"
                          className="my-orders-button secondary"
                          onClick={() => toggleOrder(order.id)}
                          aria-expanded={expanded}
                        >
                          <FiFileText />

                          {expanded
                            ? 'Ocultar detalles'
                            : 'Ver detalles'}
                        </button>

                        <Link
                          to="/products"
                          className="my-orders-button primary"
                        >
                          <FiShoppingCart />
                          Volver a comprar
                        </Link>

                      </div>

                    </div>

                    {/* ==================================
                        RESUMEN DEL PEDIDO
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
                            {order.customer_name || 'Cliente'}
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

                      {/* PRECIOS */}

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
                        PRODUCTOS DEL PEDIDO
                    ================================== */}

                    {items && items.length > 0 && (
                      <div className="my-order-products">

                        <h3>
                          Productos del pedido ({items.length})
                        </h3>

                        <div className="my-order-product-list">

                          {items.map((item, index) => (
                            <div
                              key={item.id ?? index}
                              className="my-order-product"
                            >

                              <div className="my-order-product-image">

                                {item.image ? (
                                  <img
                                    src={item.image}
                                    alt={
                                      item.product_name ||
                                      'Producto'
                                    }
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
                                  Producto #{item.product_id}
                                </span>
                              </div>

                              <div className="my-order-product-quantity">
                                <span>Cantidad</span>
                                <strong>{item.quantity}</strong>
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

                        <h3>Información de tu compra</h3>

                        <div className="my-order-details-grid">

                          <div>
                            <FiCalendar />
                            <span>Fecha del pedido</span>
                            <strong>
                              {formatDate(order.created_at)}
                            </strong>
                          </div>

                          <div>
                            <FiPhone />
                            <span>Teléfono de contacto</span>
                            <strong>
                              {order.customer_phone ||
                                'No registrado'}
                            </strong>
                          </div>

                          <div>
                            <FiMapPin />
                            <span>Dirección de entrega</span>
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

                        {items === null && (
                          <p className="my-order-details-note">
                            El listado de productos estará disponible
                            cuando el servidor incluya los artículos
                            asociados a este pedido.
                          </p>
                        )}

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
