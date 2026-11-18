
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { getProducts } from '../services/api'

import './SeasonalBanner.css'

// ==========================================
// NICA S-MART - SEASONAL BANNER
// DISEÑO RESPONSIVE
// ==========================================

// ==========================================
// 1. CONFIGURACIÓN DE API
// ==========================================

const API_URL = String(
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV ? 'http://localhost:3000' : '')
)
  .trim()
  .replace(/\/+$/, '')

// ==========================================
// 2. FORMATO DE PRECIOS
// ==========================================

function money(value) {
  return new Intl.NumberFormat('es-NI', {
    style: 'currency',
    currency: 'NIO',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(Number(value) || 0)
}

// ==========================================
// 3. DECORACIONES POR TEMPORADA
// ==========================================

const decorations = {
  halloween: {
    main: '🎃',
    second: '🎃',
    top: '🦇',
    side: '🦇',
    details: '🍂',
    combo: '🎮',
    special: '🎧',
    background: '/seasons/halloween-decoracion.png'
  },

  'black-november': {
    main: '🛍️',
    second: '🎁',
    top: '⚡',
    side: '✨',
    details: '💎',
    combo: '🎮',
    special: '💻',
    background: '/seasons/noviembre-banner.png'
  },

  'black-friday': {
    main: '🛍️',
    second: '🎁',
    top: '⚡',
    side: '✨',
    details: '💎',
    combo: '🎮',
    special: '💻',
    background: '/seasons/noviembre-banner.png'
  },

  navidad: {
    main: '🎄',
    second: '🎁',
    top: '⭐',
    side: '❄️',
    details: '🎀',
    combo: '🎧',
    special: '🎁',
    background: '/seasons/diciembre-banner.png'
  },

  christmas: {
    main: '🎄',
    second: '🎁',
    top: '⭐',
    side: '❄️',
    details: '🎀',
    combo: '🎧',
    special: '🎁',
    background: '/seasons/diciembre-banner.png'
  },

  agosto: {
    main: '🇳🇮',
    second: '🎉',
    top: '✨',
    side: '🎊',
    details: '🎆',
    combo: '⌚',
    special: '🎧',
    background: '/seasons/agosto-banner.png'
  },

  patrio: {
    main: '🇳🇮',
    second: '🎉',
    top: '⭐',
    side: '🎊',
    details: '🌼',
    combo: '⌚',
    special: '💻',
    background: '/seasons/septiembre-banner.png'
  }
}

// ==========================================
// 4. DECORACIÓN PREDETERMINADA
// ==========================================

const defaultDecor = {
  main: '🎁',
  second: '✨',
  top: '⭐',
  side: '🎊',
  details: '✨',
  combo: '🎧',
  special: '💻',
  background: null
}

const categoryIcons = ['🎧', '⌚', '🔌', '🎮']

// ==========================================
// 5. OBTENER IMÁGENES DE PRODUCTOS
// ==========================================

function getImageUrl(value) {
  if (!value) return null

  if (Array.isArray(value)) {
    for (const entry of value) {
      const image = getImageUrl(entry)

      if (image) return image
    }

    return null
  }

  if (typeof value === 'object') {
    return getImageUrl(
      value.url ||
      value.src ||
      value.image_url ||
      value.imageUrl ||
      value.path ||
      value.image
    )
  }

  if (typeof value !== 'string') return null

  const image = value.trim()

  if (!image) return null

  // Imágenes guardadas como JSON

  if (
    image.startsWith('[') ||
    image.startsWith('{')
  ) {
    try {
      return getImageUrl(JSON.parse(image))
    } catch {
      return null
    }
  }

  // Imágenes con URL completa

  if (
    /^(https?:\/\/|data:image\/|blob:)/i.test(image)
  ) {
    return image
  }

  if (image.startsWith('//')) {
    return `${window.location.protocol}${image}`
  }

  const normalized = image.replace(/\\/g, '/')

  // Archivos públicos del frontend

  if (/^\/?public\//i.test(normalized)) {
    return `/${normalized.replace(/^\/*public\//i, '')}`
  }

  if (
    /^\/?(seasons|imagenes|images|assets)\//i.test(normalized)
  ) {
    return `/${normalized.replace(/^\/+/, '')}`
  }

  // Imágenes del backend

  if (/^\/?uploads\//i.test(normalized)) {
    return `${API_URL}/${normalized.replace(/^\/+/, '')}`
  }

  // Rutas absolutas del frontend

  if (normalized.startsWith('/')) {
    return normalized
  }

  // Rutas relativas del backend

  return `${API_URL}/${normalized}`
}

// ==========================================
// 6. IMAGEN DE UN PRODUCTO
// ==========================================

function getProductImage(product) {
  const candidates = [
    product?.image_url,
    product?.image,
    product?.images,
    product?.imageUrl,
    product?.thumbnail,
    product?.photo,
    product?.picture
  ]

  for (const candidate of candidates) {
    const image = getImageUrl(candidate)

    if (image) return image
  }

  return null
}

// ==========================================
// 7. COMPONENTE DE IMAGEN
// ==========================================

function ProductImage({
  src,
  name,
  fallbackIcon
}) {
  const [failedUrl, setFailedUrl] = useState(null)

  const failed = Boolean(
    !src || failedUrl === src
  )

  if (failed) {
    return (
      <span
        className="seasonal-product-fallback"
        role="img"
        aria-label={`Imagen no disponible: ${name}`}
      >
        {fallbackIcon}
      </span>
    )
  }

  return (
    <img
      src={src}
      alt={name || 'Producto'}
      loading="lazy"
      decoding="async"
      onError={() => setFailedUrl(src)}
    />
  )
}

// ==========================================
// 8. COMPONENTE PRINCIPAL
// ==========================================

export default function SeasonalBanner({
  campaign
}) {
  // ==========================================
  // ESTADOS
  // ==========================================

  const [products, setProducts] = useState([])
  const [backgroundFailed, setBackgroundFailed] =
    useState(false)

  const [showShipping, setShowShipping] =
    useState(false)

  const closeButtonRef = useRef(null)

  // ==========================================
  // CARGAR PRODUCTOS
  // ==========================================

  useEffect(() => {
    let active = true

    getProducts()
      .then((data) => {
        if (!active) return

        const items = Array.isArray(data)
          ? data
          : Array.isArray(data?.products)
            ? data.products
            : Array.isArray(data?.data)
              ? data.data
              : Array.isArray(data?.data?.products)
                ? data.data.products
                : []

        setProducts(items)
      })
      .catch((error) => {
        if (!active) return

        console.error(
          'Error cargando productos del banner:',
          error
        )

        setProducts([])
      })

    return () => {
      active = false
    }
  }, [])

  // ==========================================
  // PRODUCTOS DESTACADOS
  // ==========================================

  const displayedProducts = useMemo(() => {
    return products
      .map((product, index) => {
        const price = Number(product.price)

        const original = Number(
          product.original_price ??
          product.originalPrice ??
          price
        )

        const validPrice =
          Number.isFinite(price) &&
          price >= 0

        const hasDiscount =
          validPrice &&
          Number.isFinite(original) &&
          original > price

        const discount = hasDiscount
          ? Math.round(
              ((original - price) / original) * 100
            )
          : 0

        return {
          ...product,
          price,
          original,
          discount,
          validPrice,
          fallbackIcon:
            categoryIcons[
              index % categoryIcons.length
            ]
        }
      })
      .filter((product) => product.validPrice)
      .sort((a, b) => b.discount - a.discount)
      .slice(0, 4)
  }, [products])

  // ==========================================
  // TEMA Y CONFIGURACIÓN DE CAMPAÑA
  // ==========================================

  const theme =
    decorations[campaign?.id] || defaultDecor

  const colors =
    Array.isArray(campaign?.colors) &&
    campaign.colors.length >= 2
      ? campaign.colors
      : ['#0755d7', '#38bdf8']

  const name =
    campaign?.name ||
    campaign?.monthName ||
    'temporada'

  const title =
    campaign?.titleMain ||
    campaign?.title ||
    `Ofertas de ${name}`

  const accent =
    campaign?.titleAccent ||
    (campaign?.titleMain ? 'Tech' : '')

  // Evita duplicar la palabra del acento
  // si ya está al final del título.

  const normalizedTitle = String(title).trim()
  const normalizedAccent = String(accent).trim()

  const titleHasAccent =
    normalizedAccent &&
    normalizedTitle
      .toLowerCase()
      .endsWith(
        normalizedAccent.toLowerCase()
      )

  const mainTitle = titleHasAccent
    ? normalizedTitle
        .slice(
          0,
          normalizedTitle.length -
            normalizedAccent.length
        )
        .trim()
    : normalizedTitle

  const background =
    theme.background ||
    campaign?.heroImage ||
    campaign?.image ||
    null

  const hasBackground = Boolean(
    background && !backgroundFailed
  )

  // ==========================================
  // REINICIAR ESTADO DE IMAGEN
  // ==========================================

  useEffect(() => {
    setBackgroundFailed(false)
  }, [background])

  // ==========================================
  // CONTROL DEL MODAL
  // ==========================================

  useEffect(() => {
    if (!showShipping) return

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setShowShipping(false)
      }
    }

    const previousOverflow =
      document.body.style.overflow

    document.body.style.overflow = 'hidden'

    closeButtonRef.current?.focus()

    document.addEventListener(
      'keydown',
      handleEscape
    )

    return () => {
      document.body.style.overflow =
        previousOverflow

      document.removeEventListener(
        'keydown',
        handleEscape
      )
    }
  }, [showShipping])

  // ==========================================
  // OCULTAR SI NO HAY CAMPAÑA
  // ==========================================

  if (!campaign) return null

  // ==========================================
  // INTERFAZ PRINCIPAL
  // ==========================================

  return (
    <div
      className={`seasonal-layout seasonal-theme-${campaign.id}`}
    >

      {/* =====================================
          BANNER PRINCIPAL
      ===================================== */}

      <section
        className="seasonal-hero"
        style={{
          '--season-start': colors[0],
          '--season-end': colors[1]
        }}
      >

        {/* =================================
            FONDO DECORATIVO
        ================================= */}

        {hasBackground && (
          <img
            key={background}
            src={getImageUrl(background)}
            alt=""
            aria-hidden="true"
            className="seasonal-background-image"
            onError={() =>
              setBackgroundFailed(true)
            }
          />
        )}

        {/* =================================
            DECORACIONES
        ================================= */}

        <div
          className={`seasonal-decorations ${
            hasBackground
              ? 'has-background'
              : ''
          }`}
          aria-hidden="true"
        >
          {!hasBackground && (
            <>
              <span className="seasonal-moon" />

              <span className="decor decor-top">
                {theme.top}
              </span>

              <span className="decor decor-side">
                {theme.side}
              </span>

              <span className="decor decor-main">
                {theme.main}
              </span>

              <span className="decor decor-second">
                {theme.second}
              </span>

              <span className="decor decor-details">
                {theme.details}
              </span>
            </>
          )}

          <span className="seasonal-spark spark-one">
            ✦
          </span>

          <span className="seasonal-spark spark-two">
            ✦
          </span>
        </div>

        {/* =================================
            CONTENIDO DEL BANNER
        ================================= */}

        <div className="seasonal-hero-copy">

          {/* ETIQUETA DE TEMPORADA */}

          <span className="seasonal-ribbon">
            ✦ {campaign.badge ||
              campaign.label ||
              name} ✦
          </span>

          {/* TÍTULO */}

          <h1>
            {mainTitle}

            {normalizedAccent && (
              <>
                {' '}
                <em>
                  {normalizedAccent}
                </em>
              </>
            )}
          </h1>

          {/* DESCRIPCIÓN */}

          {campaign.description && (
            <p>
              {campaign.description}
            </p>
          )}

          {/* BOTÓN DE PROMOCIONES */}

          <Link
            className="seasonal-cta"
            to="/promotions#offers"
          >
            {campaign.buttonText ||
              'Ver promociones'}

            <span aria-hidden="true">
              ❯
            </span>
          </Link>
        </div>

        {/* =================================
            PRODUCTOS DESTACADOS
        ================================= */}

        <div className="seasonal-hero-showcase">

          {/* CLIENTE RECURRENTE */}

          <div className="seasonal-recurring">

            <span
              className="seasonal-crown"
              aria-hidden="true"
            >
              👑
            </span>

            <div className="seasonal-recurring-text">
              <strong>
                Cliente recurrente
              </strong>

              <span>
                ¡Gracias por seguir con nosotros!
              </span>
            </div>

            <div className="seasonal-recurring-reward">
              ⭐ Beneficios exclusivos

              <small>
                Para clientes frecuentes
              </small>
            </div>

          </div>

          {/* CUATRO PRODUCTOS */}

          <div className="seasonal-featured-products">

            {displayedProducts.map((product) => {
              const productImage =
                getProductImage(product)

              return (
                <Link
                  key={product.id}
                  to={`/product/${product.id}`}
                  className="seasonal-product-card"
                >

                  {/* DESCUENTO */}

                  {product.discount > 0 && (
                    <span className="seasonal-product-badge">
                      -{product.discount}%
                    </span>
                  )}

                  {/* IMAGEN */}

                  <div className="seasonal-product-image">
                    <ProductImage
                      src={productImage}
                      name={product.name}
                      fallbackIcon={
                        product.fallbackIcon
                      }
                    />
                  </div>

                  {/* NOMBRE */}

                  <h3>
                    {product.name}
                  </h3>

                  {/* PRECIOS */}

                  <div className="seasonal-product-prices">

                    {product.discount > 0 && (
                      <del>
                        {money(product.original)}
                      </del>
                    )}

                    <strong>
                      {money(product.price)}
                    </strong>

                  </div>
                </Link>
              )
            })}

          </div>

          {/* SIN PRODUCTOS */}

          {displayedProducts.length === 0 && (
            <div className="seasonal-no-products">

              <span aria-hidden="true">
                🎧 ⌚ 🎮 💻
              </span>

              <p>
                Próximamente, productos destacados
              </p>

            </div>
          )}
        </div>
      </section>

      {/* =====================================
          TARJETAS INFERIORES
      ===================================== */}

      <section className="seasonal-promo-strip">

        {/* =================================
            COMBOS TECNOLÓGICOS
        ================================= */}

        <div className="seasonal-mini-card mini-blue">

          <span
            className="mini-decoration"
            aria-hidden="true"
          >
            {theme.combo}
          </span>

          <div>
            <h3>
              {campaign.miniPromo1Title ||
                'Combo tecnológico'}
            </h3>

            <p>
              {campaign.miniPromo1Text ||
                'Accesorios y dispositivos tecnológicos'}
            </p>

            <Link
              to="/products"
              className="mini-pill"
            >
              Explorar productos
            </Link>
          </div>
        </div>

        {/* =================================
            CUPÓN SORPRESA
        ================================= */}

        <div className="seasonal-mini-card mini-cream">

          <span
            className="mini-decoration"
            aria-hidden="true"
          >
            🎁
          </span>

          <div>
            <h3>
              Premio sorpresa
            </h3>

            <p>
              Compra y participa por un cupón
              para tu próxima compra.
            </p>

            <Link
              to="/promotions#offers"
              className="mini-pill"
            >
              Ver productos en promoción
            </Link>

            <small>
              Recompensas sujetas a activación.
            </small>
          </div>
        </div>

        {/* =================================
            TECNOLOGÍA EN OFERTA
        ================================= */}

        <div className="seasonal-mini-card mini-blue">

          <span
            className="mini-decoration"
            aria-hidden="true"
          >
            {theme.special}
          </span>

          <div>
            <h3>
              {campaign.miniPromo2Title ||
                'Tecnología en oferta'}
            </h3>

            <p>
              {campaign.miniPromo2Text ||
                'Descubre nuestros productos destacados'}
            </p>

            <Link
              to="/promotions#offers"
              className="mini-pill"
            >
              Ver ofertas
            </Link>
          </div>
        </div>

        {/* =================================
            ENVÍOS A NICARAGUA
        ================================= */}

        <div className="seasonal-mini-card mini-cream">

          <span
            className="mini-decoration"
            aria-hidden="true"
          >
            🚚
          </span>

          <div>
            <h3>
              Envíos a toda Nicaragua
            </h3>

            <p>
              Recibe tus productos de forma segura
            </p>

            <button
              type="button"
              className="mini-pill mini-action-button"
              onClick={() =>
                setShowShipping(true)
              }
            >
              Ver condiciones
            </button>
          </div>
        </div>

      </section>

      {/* =====================================
          MODAL DE ENVÍOS
      ===================================== */}

      {showShipping && (
        <div
          className="shipping-modal-overlay"
          onClick={() =>
            setShowShipping(false)
          }
        >
          <section
            className="shipping-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="shipping-modal-title"
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            {/* CERRAR MODAL */}

            <button
              ref={closeButtonRef}
              type="button"
              className="shipping-modal-close"
              aria-label="Cerrar ventana"
              onClick={() =>
                setShowShipping(false)
              }
            >
              ✕
            </button>

            <span
              className="shipping-modal-icon"
              aria-hidden="true"
            >
              🚚
            </span>

            <h2 id="shipping-modal-title">
              Envíos a toda Nicaragua
            </h2>

            <p>
              El costo, los plazos y la disponibilidad
              de entrega dependen de tu ubicación
              y de las condiciones vigentes de la tienda.
            </p>

            <Link
              to="/cart"
              className="shipping-modal-link"
              onClick={() =>
                setShowShipping(false)
              }
            >
              Revisar mi carrito
            </Link>

          </section>
        </div>
      )}
    </div>
  )
}
