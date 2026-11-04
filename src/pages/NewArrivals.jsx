
import {
  useEffect,
  useMemo,
  useState,
  useCallback,
  useRef
} from 'react'

import { Link } from 'react-router-dom'

import Header from '../components/Header'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

import { getProducts } from '../services/api'
import { getProductImages } from '../utils/productImages'

import './NewArrivals.css'

// ==========================================
// CONFIGURACIÓN
// ==========================================

const TIMEZONE = 'America/Managua'

const money = (value) =>
  new Intl.NumberFormat('es-NI', {
    style: 'currency',
    currency: 'NIO',
    maximumFractionDigits: 0
  }).format(Number(value) || 0)

// ==========================================
// FUNCIONES AUXILIARES
// ==========================================

function normalizeText(value) {
  return String(value ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
}

function getCategoryName(product) {
  if (typeof product.category === 'string') {
    return product.category
  }

  return (
    product.category?.name ||
    product.category_name ||
    'Sin categoría'
  )
}

function getCreatedTime(product) {
  const value =
    product.created_at ??
    product.createdAt

  if (!value) return 0

  const time = Date.parse(value)

  return Number.isFinite(time) ? time : 0
}

function formatDate(product) {
  const time = getCreatedTime(product)

  if (!time) return 'Fecha no disponible'

  return new Intl.DateTimeFormat('es-NI', {
    timeZone: TIMEZONE,
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  }).format(new Date(time))
}

// ==========================================
// IDENTIFICAR PRODUCTOS NUEVOS
// ==========================================

function isNewProduct(product) {
  const value = product?.is_new

  return (
    value === true ||
    value === 1 ||
    value === 'true' ||
    value === '1'
  )
}

// ==========================================
// DESCUENTOS
// ==========================================

function getDiscount(product) {
  const price = Number(product.price)

  const original = Number(
    product.original_price ??
    product.originalPrice ??
    price
  )

  if (
    !Number.isFinite(price) ||
    !Number.isFinite(original) ||
    original <= price ||
    price < 0
  ) {
    return null
  }

  return {
    original,
    percentage: Math.round(
      ((original - price) / original) * 100
    )
  }
}

// ==========================================
// IMÁGENES DEL PRODUCTO
// ==========================================

function ProductImage({ product }) {
  const images = getProductImages(product)
  const imagesKey = images.join('|')

  const [index, setIndex] = useState(0)

  useEffect(() => {
    setIndex(0)
  }, [imagesKey])

  const image = images[index]

  if (!image) {
    return (
      <span className="new-product-placeholder">
        📦
      </span>
    )
  }

  return (
    <img
      key={image}
      src={image}
      alt={product.name || 'Producto'}
      loading="lazy"
      onError={() => {
        setIndex((previous) => previous + 1)
      }}
      style={{
        width: '100%',
        height: '100%',
        objectFit: 'contain'
      }}
    />
  )
}

// ==========================================
// COMPONENTE PRINCIPAL
// ==========================================

export default function NewArrivals() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [category, setCategory] = useState('all')
  const [order, setOrder] = useState('newest')
  const [search, setSearch] = useState('')

  const requestId = useRef(0)
  const mounted = useRef(false)

  // ========================================
  // CARGAR PRODUCTOS DESDE POSTGRESQL
  // ========================================

  const loadProducts = useCallback(async () => {
    const currentRequest = ++requestId.current

    try {
      setLoading(true)
      setError('')

      const response = await getProducts()

      if (
        !mounted.current ||
        currentRequest !== requestId.current
      ) {
        return
      }

      const data = Array.isArray(response)
        ? response
        : response?.products ??
          response?.data?.products ??
          response?.data ??
          []

      if (!Array.isArray(data)) {
        throw new Error(
          'La API no devolvió una lista válida.'
        )
      }

      const validProducts = data.filter(
        (product) =>
          product &&
          typeof product === 'object' &&
          product.id != null
      )

      setProducts(validProducts)
    } catch (err) {
      if (
        !mounted.current ||
        currentRequest !== requestId.current
      ) {
        return
      }

      console.error(
        'Error cargando nuevos ingresos:',
        err
      )

      setError(
        'No se pudieron cargar los productos nuevos.'
      )

      setProducts([])
    } finally {
      if (
        mounted.current &&
        currentRequest === requestId.current
      ) {
        setLoading(false)
      }
    }
  }, [])

  // ========================================
  // CARGAR AL ABRIR LA PÁGINA
  // ========================================

  useEffect(() => {
    mounted.current = true

    loadProducts()

    return () => {
      mounted.current = false
      requestId.current += 1
    }
  }, [loadProducts])

  // ========================================
  // ACTUALIZACIÓN AUTOMÁTICA
  // ========================================

  useEffect(() => {
    const refresh = () => {
      if (document.visibilityState === 'visible') {
        loadProducts()
      }
    }

    window.addEventListener('focus', refresh)
    document.addEventListener('visibilitychange', refresh)

    return () => {
      window.removeEventListener('focus', refresh)
      document.removeEventListener(
        'visibilitychange',
        refresh
      )
    }
  }, [loadProducts])

  // ========================================
  // PRODUCTOS MARCADOS COMO NUEVOS
  // ========================================

  const recentProducts = useMemo(() => {
    return products.filter((product) => {
      const price = Number(product.price)

      return (
        product.id != null &&
        isNewProduct(product) &&
        Number.isFinite(price) &&
        price >= 0
      )
    })
  }, [products])

  // ========================================
  // CATEGORÍAS DINÁMICAS
  // ========================================

  const categories = useMemo(() => {
    return [
      ...new Set(
        recentProducts.map(getCategoryName)
      )
    ].sort((a, b) => a.localeCompare(b, 'es'))
  }, [recentProducts])

  // ========================================
  // BUSCADOR, FILTROS Y ORDENAMIENTO
  // ========================================

  const visibleProducts = useMemo(() => {
    const term = normalizeText(search)

    return [...recentProducts]
      .filter((product) => {
        const matchesCategory =
          category === 'all' ||
          normalizeText(getCategoryName(product)) ===
            normalizeText(category)

        const text = normalizeText(
          [
            product.name,
            product.description,
            getCategoryName(product),
            product.brand?.name ?? product.brand
          ].join(' ')
        )

        return (
          matchesCategory &&
          (!term || text.includes(term))
        )
      })
      .sort((a, b) => {
        if (order === 'oldest') {
          return (
            getCreatedTime(a) -
            getCreatedTime(b)
          )
        }

        if (order === 'price-low') {
          return (
            Number(a.price) -
            Number(b.price)
          )
        }

        if (order === 'price-high') {
          return (
            Number(b.price) -
            Number(a.price)
          )
        }

        return (
          getCreatedTime(b) -
          getCreatedTime(a)
        )
      })
  }, [recentProducts, category, order, search])

  // ========================================
  // INTERFAZ
  // ========================================

  return (
    <>
      <Header />
      <Navbar />

      <main className="new-arrivals-page">

        {/* BANNER PRINCIPAL */}

        <section className="new-arrivals-hero">
          <div className="new-arrivals-hero-content">

            <span className="new-arrivals-eyebrow">
              🚀 ÚLTIMAS NOVEDADES EN TECH
            </span>

            <h1>
              Nuevos <span>ingresos</span>
            </h1>

            <p>
              Descubre la tecnología recién llegada a
              NICA S-MART. Nuevos equipos, accesorios
              y dispositivos.
            </p>

            <a href="#new-products">
              Explorar novedades ↓
            </a>
          </div>

          <div
            className="new-arrivals-hero-art"
            aria-hidden="true"
          >
            <span>🎧</span>
            <span>⌨️</span>
            <span>⌚</span>
          </div>
        </section>

        {/* BENEFICIOS */}

        <section className="new-arrivals-benefits">
          <div>✨ Últimos ingresos del mercado</div>
          <div>🚚 Envíos a toda Nicaragua</div>
          <div>🛡️ Compra segura</div>
          <div>💳 Múltiples métodos de pago</div>
        </section>

        {/* NUEVOS PRODUCTOS */}

        <section
          id="new-products"
          className="new-arrivals-content"
        >
          <div className="new-arrivals-heading">
            <div>
              <span className="new-arrivals-kicker">
                RECIÉN LLEGADOS
              </span>

              <h2>✨ Nuevos productos</h2>

              <p>
                Productos recién agregados por
                NICA S-MART.
              </p>
            </div>

            {/* FILTROS */}

            <div className="new-arrivals-filters">
              <label>
                Filtrar por:

                <select
                  value={category}
                  onChange={(event) =>
                    setCategory(event.target.value)
                  }
                >
                  <option value="all">
                    Todas las categorías
                  </option>

                  {categories.map((name) => (
                    <option
                      key={name}
                      value={name}
                    >
                      {name}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Ordenar por:

                <select
                  value={order}
                  onChange={(event) =>
                    setOrder(event.target.value)
                  }
                >
                  <option value="newest">
                    Más recientes
                  </option>

                  <option value="oldest">
                    Más antiguos
                  </option>

                  <option value="price-low">
                    Menor precio
                  </option>

                  <option value="price-high">
                    Mayor precio
                  </option>
                </select>
              </label>
            </div>
          </div>

          {/* BUSCADOR */}

          <div className="new-arrivals-toolbar">
            <input
              type="search"
              placeholder="Buscar entre los nuevos productos..."
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              aria-label="Buscar nuevos productos"
            />

            <span>
              {visibleProducts.length}{' '}
              {visibleProducts.length === 1
                ? 'producto'
                : 'productos'}
            </span>
          </div>

          {/* CARGANDO */}

          {loading && (
            <div className="new-arrivals-empty">
              <span>⏳</span>

              <h3>
                Cargando nuevos ingresos...
              </h3>
            </div>
          )}

          {/* ERROR */}

          {!loading && error && (
            <div
              className="new-arrivals-empty"
              role="alert"
            >
              <span>⚠️</span>

              <h3>
                No se pudo cargar el catálogo
              </h3>

              <p>{error}</p>

              <button
                type="button"
                onClick={() => loadProducts()}
              >
                Reintentar
              </button>
            </div>
          )}

          {/* SIN PRODUCTOS */}

          {!loading &&
            !error &&
            visibleProducts.length === 0 && (
              <div className="new-arrivals-empty">
                <span>📦</span>

                <h3>
                  {recentProducts.length === 0
                    ? 'Aún no hay nuevos ingresos'
                    : 'No encontramos coincidencias'}
                </h3>

                <p>
                  {recentProducts.length === 0
                    ? 'Cuando el administrador agregue productos marcados como nuevos, aparecerán aquí automáticamente.'
                    : 'Prueba con otro nombre o categoría.'}
                </p>

                <Link to="/products">
                  Ver catálogo completo
                </Link>
              </div>
            )}

          {/* TARJETAS */}

          {!loading &&
            !error &&
            visibleProducts.length > 0 && (
              <div className="new-arrivals-grid">
                {visibleProducts.map((product) => {
                  const discount = getDiscount(product)

                  const createdAt =
                    product.created_at ??
                    product.createdAt

                  return (
                    <article
                      className="new-arrivals-card"
                      key={product.id}
                    >
                      {/* IMAGEN */}

                      <div className="new-arrivals-image">
                        <span className="new-arrivals-badge">
                          ✨ Nuevo
                        </span>

                        {discount && (
                          <span className="new-arrivals-discount">
                            -{discount.percentage}%
                          </span>
                        )}

                        <Link to={`/product/${product.id}`}>
                          <ProductImage product={product} />
                        </Link>
                      </div>

                      {/* INFORMACIÓN */}

                      <div className="new-arrivals-info">
                        <small className="new-arrivals-category">
                          {getCategoryName(product)}
                        </small>

                        <h3>{product.name}</h3>

                        <p>
                          {product.description
                            ? String(product.description).slice(0, 90)
                            : 'Nuevo producto disponible en NICA S-MART'}
                        </p>

                        {/* PRECIOS */}

                        <div className="new-arrivals-prices">
                          {discount && (
                            <del>
                              {money(discount.original)}
                            </del>
                          )}

                          <strong>
                            {money(product.price)}
                          </strong>
                        </div>

                        {/* FECHA */}

                        {createdAt && (
                          <span className="new-arrivals-date">
                            📅 Agregado el{' '}
                            {formatDate(product)}
                          </span>
                        )}

                        {/* VER PRODUCTO */}

                        <Link
                          className="new-arrivals-buy"
                          to={`/product/${product.id}`}
                        >
                          🛒 Ver producto
                        </Link>
                      </div>
                    </article>
                  )
                })}
              </div>
            )}

        </section>
      </main>

      <Footer />
    </>
  )
}
