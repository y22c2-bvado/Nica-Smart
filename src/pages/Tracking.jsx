
import {
  useCallback,
  useEffect,
  useRef,
  useState
} from 'react'

import {
  Link,
  useParams
} from 'react-router-dom'

import {
  FiPackage,
  FiTruck,
  FiCheckCircle,
  FiClock,
  FiArrowRight,
  FiArrowLeft,
  FiMessageCircle,
  FiMapPin,
  FiRefreshCw,
  FiShoppingBag,
  FiCalendar,
  FiCreditCard,
  FiAlertCircle,
  FiXCircle,
  FiNavigation,
  FiChevronRight,
  FiCamera,
  FiUploadCloud,
  FiImage,
  FiShield,
  FiCheck
} from 'react-icons/fi'

import Header from '../components/Header'
import Navbar from '../components/Navbar'

import Footer, {
  getWhatsAppLink
} from '../components/Footer'

import './SupportPages.css'

// ==========================================
// CONFIGURACIÓN
// ==========================================

const API_URL = String(
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV ? 'http://localhost:3000' : '')
)
  .trim()
  .replace(/\/+$/, '')

const MAX_PHOTO_SIZE = 5 * 1024 * 1024

const ALLOWED_PHOTO_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp'
]

// ==========================================
// UTILIDADES
// ==========================================

const money = (value) =>
  `C$ ${Number(value || 0).toLocaleString('es-NI', {
    maximumFractionDigits: 0
  })}`

function formatDate(value) {
  if (!value) return 'No registrado'

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return 'Fecha no disponible'
  }

  return date.toLocaleString('es-NI', {
    timeZone: 'America/Managua',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function normalizeStatus(value) {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[_-]+/g, ' ')
}

// ==========================================
// ESTADOS DE PEDIDOS
// ==========================================

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
      description:
        'El administrador marcó el pedido como entregado.',
      step: 4,
      type: 'delivered',
      Icon: FiCheckCircle
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
      description:
        'Tu pedido fue marcado como enviado.',
      step: 3,
      type: 'shipped',
      Icon: FiTruck
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
      description:
        'Estamos preparando los productos de tu compra.',
      step: 2,
      type: 'processing',
      Icon: FiPackage
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
      description: 'Este pedido fue cancelado.',
      step: 0,
      type: 'cancelled',
      Icon: FiXCircle
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
      description:
        'Hemos registrado tu compra correctamente.',
      step: 1,
      type: 'registered',
      Icon: FiClock
    }
  }

  return {
    label: String(value || 'Estado no disponible'),
    description:
      'Consultá el estado de tu pedido.',
    step: 0,
    type: 'unknown',
    Icon: FiClock
  }
}

// ==========================================
// ETAPAS DE SEGUIMIENTO
// ==========================================

const STEPS = [
  {
    label: 'Pedido recibido',
    description: 'Compra registrada',
    Icon: FiShoppingBag
  },
  {
    label: 'En preparación',
    description: 'Preparando tu compra',
    Icon: FiPackage
  },
  {
    label: 'En camino',
    description: 'Pedido enviado',
    Icon: FiTruck
  },
  {
    label: 'Entregado',
    description: 'Entrega registrada',
    Icon: FiCheckCircle
  }
]

function getOrderItems(order) {
  if (Array.isArray(order?.items)) {
    return order.items
  }

  if (Array.isArray(order?.order_items)) {
    return order.order_items
  }

  return []
}

function getConfirmationDate(order) {
  return (
    order.delivery_confirmed_at ||
    order.customer_confirmed_at ||
    null
  )
}

function isDeliveryConfirmed(order) {
  return Boolean(getConfirmationDate(order))
}

// ==========================================
// FOTO PROTEGIDA DE EVIDENCIA
// ==========================================

function DeliveryPhoto({ orderId }) {
  const [photoUrl, setPhotoUrl] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const controller = new AbortController()
    let objectUrl = ''

    async function loadPhoto() {
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
            signal: controller.signal,
            cache: 'no-store'
          }
        )

        if (!response.ok) {
          throw new Error(
            'No se pudo cargar la fotografía.'
          )
        }

        const blob = await response.blob()

        if (!blob.type.startsWith('image/')) {
          throw new Error(
            'El servidor no devolvió una imagen válida.'
          )
        }

        if (controller.signal.aborted) return

        objectUrl = URL.createObjectURL(blob)
        setPhotoUrl(objectUrl)

      } catch (err) {
        if (err.name !== 'AbortError') {
          setError(err.message)
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false)
        }
      }
    }

    loadPhoto()

    return () => {
      controller.abort()

      if (objectUrl) {
        URL.revokeObjectURL(objectUrl)
      }
    }
  }, [orderId])

  if (loading) {
    return (
      <p style={{ color: '#64748b' }}>
        Cargando fotografía...
      </p>
    )
  }

  if (error) {
    return (
      <p role="alert" style={{ color: '#b91c1c' }}>
        {error}
      </p>
    )
  }

  return photoUrl ? (
    <img
      src={photoUrl}
      alt={`Fotografía de recepción del pedido ${orderId}`}
      style={{
        width: '100%',
        maxWidth: 440,
        maxHeight: 400,
        objectFit: 'contain',
        borderRadius: 12,
        border: '1px solid #e2e8f0'
      }}
    />
  ) : null
}

// ==========================================
// CONFIRMACIÓN DE RECEPCIÓN
// ==========================================

function DeliveryConfirmation({
  order,
  onConfirmed
}) {
  const inputRef = useRef(null)

  const [photo, setPhoto] = useState(null)
  const [preview, setPreview] = useState('')
  const [accepted, setAccepted] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const confirmed = isDeliveryConfirmed(order)

  const status = normalizeStatus(order.status)

  const canConfirm =
    [
      'enviado',
      'entregado'
    ].includes(status) && !confirmed

  useEffect(() => {
    if (!photo) {
      setPreview('')
      return
    }

    const url = URL.createObjectURL(photo)
    setPreview(url)

    return () => URL.revokeObjectURL(url)
  }, [photo])

  const handlePhotoChange = (event) => {
    const file = event.target.files?.[0]

    setError('')
    setNotice('')

    if (!file) {
      setPhoto(null)
      return
    }

    if (!ALLOWED_PHOTO_TYPES.includes(file.type)) {
      setPhoto(null)
      event.target.value = ''

      setError(
        'Seleccioná una fotografía JPG, PNG o WEBP.'
      )
      return
    }

    if (file.size > MAX_PHOTO_SIZE) {
      setPhoto(null)
      event.target.value = ''

      setError(
        'La fotografía no puede superar los 5 MB.'
      )
      return
    }

    setPhoto(file)
  }

  const handleConfirm = async (event) => {
    event.preventDefault()

    if (sending || !canConfirm) return

    if (!photo) {
      setError(
        'Necesitás adjuntar una foto del producto recibido.'
      )
      return
    }

    if (!accepted) {
      setError(
        'Debés confirmar que recibiste el pedido.'
      )
      return
    }

    const token = localStorage.getItem('token')

    if (!token) {
      setError('Tu sesión expiró. Iniciá sesión nuevamente.')
      return
    }

    const formData = new FormData()

    formData.append('photo', photo)

    setSending(true)
    setError('')
    setNotice('')

    try {
      const response = await fetch(
        `${API_URL}/api/orders/${encodeURIComponent(order.id)}/confirm-delivery`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`
          },
          body: formData
        }
      )

      const data = await response
        .json()
        .catch(() => ({}))

      if (!response.ok) {
        throw new Error(
          data.message ||
          data.error ||
          'No se pudo confirmar la recepción.'
        )
      }

      setNotice(
        '¡Recepción confirmada! Tu fotografía fue enviada correctamente.'
      )

      setPhoto(null)
      setAccepted(false)

      if (inputRef.current) {
        inputRef.current.value = ''
      }

      await onConfirmed?.()

    } catch (err) {
      setError(
        err.message ||
        'Ocurrió un error enviando la confirmación.'
      )
    } finally {
      setSending(false)
    }
  }

  // ==========================================
  // CONFIRMACIÓN YA REGISTRADA
  // ==========================================

  if (confirmed) {
    return (
      <section
        className="tracking-confirmation-card"
        style={{
          background: '#ffffff',
          border: '1px solid #bbf7d0',
          borderRadius: 18,
          padding: 28
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            color: '#15803d',
            marginBottom: 14
          }}
        >
          <FiCheckCircle size={28} />

          <h3 style={{ margin: 0 }}>
            Recepción confirmada por el cliente
          </h3>
        </div>

        <p style={{ color: '#475569' }}>
          Confirmaste que recibiste los productos de
          este pedido.
        </p>

        <p>
          <strong>Fecha de confirmación:</strong>{' '}
          {formatDate(getConfirmationDate(order))}
        </p>

        <div style={{ marginTop: 22 }}>
          <h4 style={{ color: '#09295f' }}>
            <FiImage
              style={{ verticalAlign: 'middle' }}
            />{' '}
            Fotografía de recepción
          </h4>

          {order.has_delivery_photo ? (
            <DeliveryPhoto orderId={order.id} />
          ) : (
            <p style={{ color: '#64748b' }}>
              No hay fotografía disponible.
            </p>
          )}
        </div>
      </section>
    )
  }

  // ==========================================
  // ENTREGA AÚN NO CONFIRMABLE
  // ==========================================

  if (!canConfirm) {
    return (
      <section
        className="tracking-confirmation-card"
        style={{
          background: '#fff',
          border: '1px solid #e3e9f3',
          borderRadius: 18,
          padding: 26
        }}
      >
        <h3 style={{ color: '#09295f' }}>
          <FiCamera
            style={{ verticalAlign: 'middle' }}
          />{' '}
          Confirmación de recepción
        </h3>

        <p style={{ color: '#64748b', lineHeight: 1.7 }}>
          {status === 'cancelado'
            ? 'Este pedido fue cancelado y no permite confirmar una entrega.'
            : 'Cuando el pedido sea marcado como enviado, podrás confirmar que recibiste los productos y adjuntar una fotografía.'}
        </p>
      </section>
    )
  }

  // ==========================================
  // FORMULARIO PARA EL CLIENTE
  // ==========================================

  return (
    <section
      className="tracking-confirmation-card"
      style={{
        background: '#fff',
        border: '1px solid #d6e4fb',
        borderRadius: 18,
        padding: 28
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 13,
          marginBottom: 12
        }}
      >
        <FiCamera size={28} color="#0755d7" />

        <h3
          style={{
            color: '#09295f',
            margin: 0
          }}
        >
          Confirmá que recibiste tu pedido
        </h3>
      </div>

      <p
        style={{
          color: '#64748b',
          lineHeight: 1.7
        }}
      >
        Si ya tenés los productos en tus manos,
        confirmá la recepción y enviá una foto
        donde se pueda ver el pedido recibido.
      </p>

      <form onSubmit={handleConfirm}>

        <div
          style={{
            border: '2px dashed #bfdbfe',
            borderRadius: 14,
            padding: 24,
            textAlign: 'center',
            background: '#f8fbff',
            marginTop: 22
          }}
        >
          <FiUploadCloud
            size={38}
            color="#0755d7"
          />

          <p
            style={{
              color: '#09295f',
              fontWeight: 700
            }}
          >
            Subí una fotografía de los productos
          </p>

          <p
            style={{
              color: '#64748b',
              fontSize: 13
            }}
          >
            JPG, PNG o WEBP. Máximo 5 MB.
          </p>

          <input
            ref={inputRef}
            type="file"
            name="photo"
            accept="image/jpeg,image/png,image/webp"
            onChange={handlePhotoChange}
            disabled={sending}
            aria-label="Fotografía del pedido recibido"
            style={{
              display: 'block',
              width: '100%',
              maxWidth: 320,
              margin: '18px auto 0'
            }}
          />

          {preview && (
            <div style={{ marginTop: 18 }}>
              <img
                src={preview}
                alt="Vista previa de la fotografía seleccionada"
                style={{
                  width: '100%',
                  maxWidth: 320,
                  maxHeight: 270,
                  objectFit: 'contain',
                  borderRadius: 12
                }}
              />

              <p
                style={{
                  fontSize: 12,
                  color: '#64748b',
                  overflowWrap: 'anywhere'
                }}
              >
                {photo?.name}
              </p>
            </div>
          )}
        </div>

        <label
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 12,
            marginTop: 22,
            color: '#334155',
            lineHeight: 1.7,
            cursor: 'pointer'
          }}
        >
          <input
            type="checkbox"
            checked={accepted}
            onChange={(event) =>
              setAccepted(event.target.checked)
            }
            disabled={sending}
            style={{
              marginTop: 5,
              width: 18,
              height: 18,
              accentColor: '#0755d7'
            }}
          />

          <span>
            Confirmo que recibí los productos del
            pedido #{order.id} y autorizo el
            envío de esta fotografía como evidencia
            de recepción.
          </span>
        </label>

        <p
          style={{
            fontSize: 12,
            color: '#64748b',
            lineHeight: 1.7
          }}
        >
          La fotografía se asociará a tu pedido y
          estará disponible para el personal
          autorizado de NICA S-MART.
        </p>

        {error && (
          <div
            role="alert"
            className="tracking-alert"
            style={{ marginTop: 18 }}
          >
            <FiAlertCircle />
            <span>{error}</span>
          </div>
        )}

        {notice && (
          <p
            role="status"
            style={{
              color: '#15803d',
              fontWeight: 700
            }}
          >
            <FiCheck
              style={{ verticalAlign: 'middle' }}
            />{' '}
            {notice}
          </p>
        )}

        <button
          type="submit"
          className="support-button"
          disabled={
            sending ||
            !photo ||
            !accepted
          }
          style={{
            marginTop: 22,
            opacity:
              sending || !photo || !accepted
                ? 0.6
                : 1,
            cursor:
              sending || !photo || !accepted
                ? 'not-allowed'
                : 'pointer'
          }}
        >
          <FiCheckCircle />

          {sending
            ? 'Enviando confirmación...'
            : 'Confirmar recepción y enviar foto'}
        </button>

      </form>
    </section>
  )
}

// ==========================================
// COMPONENTE PRINCIPAL
// ==========================================

function Tracking() {
  const { id } = useParams()

  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')
  const [updatedAt, setUpdatedAt] = useState(null)

  const requestRef = useRef(null)
  const mountedRef = useRef(false)

  // ==========================================
  // CONSULTAR PEDIDOS
  // ==========================================

  const loadOrders = useCallback(async (silent = false) => {
    const token = localStorage.getItem('token')

    if (!token) {
      setError('Iniciá sesión para consultar tus pedidos.')
      setLoading(false)
      setRefreshing(false)
      return
    }

    requestRef.current?.abort()

    const controller = new AbortController()

    requestRef.current = controller

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
          cache: 'no-store',
          signal: controller.signal
        }
      )

      const data = await response
        .json()
        .catch(() => null)

      if (
        controller.signal.aborted ||
        !mountedRef.current
      ) {
        return
      }

      if (response.status === 401) {
        throw new Error(
          'Tu sesión expiró. Iniciá sesión nuevamente.'
        )
      }

      if (!response.ok) {
        throw new Error(
          data?.message ||
          data?.error ||
          'No se pudo consultar el seguimiento.'
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
          'El servidor devolvió un formato de pedidos no válido.'
        )
      }

      setOrders(
        [...list].sort(
          (a, b) =>
            new Date(
              b.created_at || b.createdAt || 0
            ) -
            new Date(
              a.created_at || a.createdAt || 0
            )
        )
      )

      setError('')
      setUpdatedAt(new Date())

    } catch (err) {
      if (
        controller.signal.aborted ||
        !mountedRef.current
      ) {
        return
      }

      console.error('Error consultando pedidos:', err)

      setError(
        err.message ||
        'No se pudo consultar tu pedido.'
      )
    } finally {
      if (
        mountedRef.current &&
        requestRef.current === controller
      ) {
        setLoading(false)
        setRefreshing(false)
      }
    }
  }, [])

  // ==========================================
  // ACTUALIZACIÓN AUTOMÁTICA
  // ==========================================

  useEffect(() => {
    mountedRef.current = true

    loadOrders()

    const refresh = () => {
      if (document.visibilityState === 'visible') {
        loadOrders(true)
      }
    }

    const interval = window.setInterval(
      refresh,
      30000
    )

    window.addEventListener('focus', refresh)

    return () => {
      mountedRef.current = false
      requestRef.current?.abort()
      window.clearInterval(interval)
      window.removeEventListener('focus', refresh)
    }
  }, [loadOrders])

  const selectedOrder = id
    ? orders.find(
        (order) =>
          String(order.id) === String(id)
      )
    : null

  const whatsappLink = getWhatsAppLink()

  return (
    <>
      <Header />
      <Navbar />

      <main className="support-page tracking-page">

        <section className="support-hero">
          <span>
            NICA S-MART · MIS ENTREGAS
          </span>

          <h1>Seguimiento de pedido</h1>

          <p>
            Consultá el progreso de tus compras,
            verificá las fechas de envío y confirmá
            cuando recibás tus productos.
          </p>
        </section>

        <section className="support-container">

          {/* NAVEGACIÓN */}

          <div className="tracking-toolbar">

            <Link
              to="/orders"
              className="tracking-back"
            >
              <FiArrowLeft />
              Mis pedidos
            </Link>

            <div className="tracking-toolbar-right">

              {updatedAt && (
                <span className="tracking-last-update">
                  Actualizado:{' '}
                  {updatedAt.toLocaleTimeString(
                    'es-NI',
                    {
                      timeZone: 'America/Managua',
                      hour: '2-digit',
                      minute: '2-digit'
                    }
                  )}
                </span>
              )}

              <button
                type="button"
                className="tracking-refresh"
                disabled={loading || refreshing}
                onClick={() => loadOrders(true)}
              >
                <FiRefreshCw />

                {refreshing
                  ? 'Actualizando...'
                  : 'Actualizar'}
              </button>
            </div>
          </div>

          {/* CARGANDO */}

          {loading && (
            <div className="tracking-empty-panel">
              <FiPackage className="tracking-empty-icon" />

              <h2>Cargando seguimiento...</h2>

              <p>
                Estamos consultando tus pedidos.
              </p>
            </div>
          )}

          {/* ERROR */}

          {!loading && error && (
            <div
              className="tracking-alert"
              role="alert"
            >
              <FiAlertCircle />

              <span>{error}</span>

              <button
                type="button"
                onClick={() => loadOrders()}
              >
                Reintentar
              </button>
            </div>
          )}

          {/* LISTA DE PEDIDOS */}

          {!loading && !error && !id && (
            <>
              <div className="support-heading">
                <h2>Tus pedidos</h2>

                <p>
                  Seleccioná una compra para
                  consultar su seguimiento.
                </p>
              </div>

              {orders.length === 0 ? (
                <div className="tracking-empty-panel">

                  <FiShoppingBag className="tracking-empty-icon" />

                  <h2>Aún no tenés pedidos</h2>

                  <p>
                    Tus compras aparecerán aquí.
                  </p>

                  <Link
                    to="/products"
                    className="support-button"
                  >
                    Explorar productos
                    <FiArrowRight />
                  </Link>
                </div>
              ) : (
                <div className="tracking-orders-list">

                  {orders.map((order) => {
                    const status = getStatusInfo(order.status)
                    const StatusIcon = status.Icon

                    return (
                      <Link
                        key={order.id}
                        to={`/tracking/${encodeURIComponent(order.id)}`}
                        className="tracking-order-link"
                      >
                        <div className="tracking-order-link-icon">
                          <FiPackage />
                        </div>

                        <div className="tracking-order-link-info">
                          <strong>
                            Pedido #{order.id}
                          </strong>

                          <span>
                            {formatDate(order.created_at)}
                          </span>

                          <small>{money(order.total)}</small>

                          {isDeliveryConfirmed(order) && (
                            <small
                              style={{
                                color: '#15803d',
                                fontWeight: 700
                              }}
                            >
                              <FiCheckCircle
                                style={{
                                  verticalAlign: 'middle'
                                }}
                              />{' '}
                              Recepción confirmada
                            </small>
                          )}
                        </div>

                        <span
                          className={`tracking-status ${status.type}`}
                        >
                          <StatusIcon />
                          {status.label}
                        </span>

                        <FiChevronRight className="tracking-order-arrow" />
                      </Link>
                    )
                  })}

                </div>
              )}
            </>
          )}

          {/* PEDIDO NO ENCONTRADO */}

          {!loading &&
            !error &&
            id &&
            !selectedOrder && (
              <div className="tracking-empty-panel">

                <FiAlertCircle className="tracking-empty-icon" />

                <h2>Pedido no encontrado</h2>

                <p>
                  El pedido #{id} no está disponible
                  en tu cuenta.
                </p>

                <Link
                  to="/tracking"
                  className="support-button"
                >
                  Ver mis pedidos
                </Link>
              </div>
            )}

          {/* SEGUIMIENTO INDIVIDUAL */}

          {!loading &&
            !error &&
            selectedOrder && (
              <OrderTrackingDetail
                order={selectedOrder}
                whatsappLink={whatsappLink}
                onConfirmed={() => loadOrders(true)}
              />
            )}

        </section>
      </main>

      <Footer />
    </>
  )
}

// ==========================================
// DETALLE DEL PEDIDO
// ==========================================

function OrderTrackingDetail({
  order,
  whatsappLink,
  onConfirmed
}) {
  const status = getStatusInfo(order.status)
  const StatusIcon = status.Icon
  const items = getOrderItems(order)

  const confirmed = isDeliveryConfirmed(order)

  return (
    <div className="tracking-detail">

      {/* ENCABEZADO */}

      <div className="tracking-order-heading">
        <div>
          <span className="tracking-kicker">
            INFORMACIÓN DE TU ENTREGA
          </span>

          <h2>Pedido #{order.id}</h2>

          <p>
            Realizado el {formatDate(order.created_at)}
          </p>
        </div>

        <span className={`tracking-status ${status.type}`}>
          <StatusIcon />
          {status.label}
        </span>
      </div>

      {/* ESTADO ACTUAL */}

      <div className="tracking-current-status">

        <div className="tracking-current-icon">
          <StatusIcon />
        </div>

        <div>
          <span>Estado actual</span>

          <h3>{status.label}</h3>

          <p>{status.description}</p>

          {confirmed && (
            <p
              style={{
                color: '#15803d',
                fontWeight: 700,
                marginTop: 8
              }}
            >
              <FiCheckCircle
                style={{ verticalAlign: 'middle' }}
              />{' '}
              Recepción confirmada por vos
            </p>
          )}
        </div>
      </div>

      {/* PROGRESO */}

      {status.step > 0 && (
        <div className="tracking-progress-card">

          <h3>Progreso de tu pedido</h3>

          <div className="tracking-timeline">

            {STEPS.map((step, index) => {
              const StepIcon = step.Icon
              const completed = index + 1 <= status.step
              const current = index + 1 === status.step

              return (
                <div
                  key={step.label}
                  className={`tracking-timeline-step ${
                    completed ? 'completed' : ''
                  } ${current ? 'current' : ''}`}
                >
                  <div className="tracking-timeline-icon">
                    {completed && !current
                      ? <FiCheckCircle />
                      : <StepIcon />}
                  </div>

                  <div className="tracking-timeline-content">
                    <strong>{step.label}</strong>
                    <span>{step.description}</span>

                    {current && (
                      <small>Estado actual</small>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* FECHAS DE ENTREGA */}

      <div className="tracking-info-grid">

        <div className="tracking-info-card">
          <div className="tracking-info-icon">
            <FiMapPin />
          </div>

          <h3>Dirección de entrega</h3>

          <p>
            {order.customer_address ||
              'Dirección no disponible'}
          </p>
        </div>

        <div className="tracking-info-card">
          <div className="tracking-info-icon">
            <FiCalendar />
          </div>

          <h3>Fecha del pedido</h3>

          <p>{formatDate(order.created_at)}</p>
        </div>

        <div className="tracking-info-card">
          <div className="tracking-info-icon">
            <FiCreditCard />
          </div>

          <h3>Total del pedido</h3>

          <p className="tracking-total">
            {money(order.total)}
          </p>
        </div>

        <div className="tracking-info-card">
          <div className="tracking-info-icon">
            <FiTruck />
          </div>

          <h3>Fecha y hora de envío</h3>

          <p>{formatDate(order.shipped_at)}</p>
        </div>

        <div className="tracking-info-card">
          <div className="tracking-info-icon">
            <FiCheckCircle />
          </div>

          <h3>Fecha y hora de entrega</h3>

          <p>{formatDate(order.delivered_at)}</p>
        </div>

        <div className="tracking-info-card">
          <div className="tracking-info-icon">
            <FiShield />
          </div>

          <h3>Confirmación del cliente</h3>

          <p
            style={{
              color: confirmed
                ? '#15803d'
                : '#a16207',
              fontWeight: 700
            }}
          >
            {confirmed
              ? formatDate(getConfirmationDate(order))
              : 'Pendiente de confirmación'}
          </p>
        </div>

      </div>

      {/* PRODUCTOS */}

      <div className="tracking-products-card">
        <h3>
          <FiShoppingBag />
          Productos de tu pedido
        </h3>

        {items.length > 0 ? (
          <div className="tracking-product-list">

            {items.map((item, index) => (
              <div
                key={`${item.product_id ?? 'item'}-${index}`}
                className="tracking-product"
              >
                <div className="tracking-product-icon">
                  <FiPackage />
                </div>

                <div className="tracking-product-details">
                  <strong>
                    {item.product_name ||
                      item.name ||
                      'Producto'}
                  </strong>

                  <span>
                    Cantidad: {item.quantity || 1}
                  </span>
                </div>

                <strong className="tracking-product-price">
                  {money(
                    Number(item.price || 0) *
                    Number(item.quantity || 1)
                  )}
                </strong>
              </div>
            ))}

          </div>
        ) : (
          <p className="tracking-products-empty">
            El detalle de productos no está disponible.
          </p>
        )}
      </div>

      {/* CONFIRMACIÓN CON FOTOGRAFÍA */}

      <DeliveryConfirmation
        key={order.id}
        order={order}
        onConfirmed={onConfirmed}
      />

      {/* INFORMACIÓN GPS */}

      <div className="tracking-delivery-note">
        <FiNavigation />

        <p>
          Estas fechas y estados corresponden
          a los registros del pedido.
          No representan una ubicación GPS
          en tiempo real del repartidor.
        </p>
      </div>

      {/* SOPORTE */}

      <div className="support-contact">
        <h2>¿Necesitás ayuda con tu entrega?</h2>

        <p>
          Contactanos e indicá el número
          del pedido #{order.id}.
        </p>

        {whatsappLink && (
          <a
            href={whatsappLink}
            target="_blank"
            rel="noopener noreferrer"
            className="support-button"
          >
            <FiMessageCircle />
            Consultar por WhatsApp
          </a>
        )}
      </div>

    </div>
  )
}

export default Tracking
