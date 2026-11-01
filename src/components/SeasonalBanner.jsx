
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getProducts } from "../services/api";
import "./SeasonalBanner.css";

// FORMATO DE PRECIOS
const money = (value) =>
  new Intl.NumberFormat("es-NI", {
    style: "currency",
    currency: "NIO",
    maximumFractionDigits: 0,
  }).format(value);

// TEMAS DECORATIVOS
const decorations = {
  halloween: {
    main: "🎃",
    second: "🎃",
    top: "🦇",
    side: "🦇",
    details: "🍂",
    combo: "🎮",
    special: "🎧",
    background: "/seasons/halloween-decoracion.png",
  },
  "black-november": {
    main: "🛍️",
    second: "🎁",
    top: "⚡",
    side: "✨",
    details: "💎",
    combo: "🎮",
    special: "💻",
    background: "/seasons/noviembre-banner.png",
  },
  "black-friday": {
    main: "🛍️",
    second: "🎁",
    top: "⚡",
    side: "✨",
    details: "💎",
    combo: "🎮",
    special: "💻",
    background: "/seasons/noviembre-banner.png",
  },
  navidad: {
    main: "🎄",
    second: "🎁",
    top: "⭐",
    side: "❄️",
    details: "🎀",
    combo: "🎧",
    special: "🎁",
    background: "/seasons/diciembre-banner.png",
  },
  christmas: {
    main: "🎄",
    second: "🎁",
    top: "⭐",
    side: "❄️",
    details: "🎀",
    combo: "🎧",
    special: "🎁",
    background: "/seasons/diciembre-banner.png",
  },
  agosto: {
    main: "🇳🇮",
    second: "🎉",
    top: "✨",
    side: "🎊",
    details: "🎆",
    combo: "⌚",
    special: "🎧",
    background: "/seasons/agosto-banner.png",
  },
  patrio: {
    main: "🇳🇮",
    second: "🎉",
    top: "⭐",
    side: "🎊",
    details: "🌼",
    combo: "⌚",
    special: "💻",
    background: "/seasons/septiembre-banner.png",
  },
};

const defaultDecor = {
  main: "🎁",
  second: "✨",
  top: "⭐",
  side: "🎊",
  details: "✨",
  combo: "🎧",
  special: "💻",
  background: null,
};

const categoryIcons = ["🎧", "⌚", "🔌", "🎮"];

// IMAGEN DE PRODUCTO
function ProductImage({ src, name, fallbackIcon }) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  if (!src || failed) {
    return (
      <span
        className="seasonal-product-fallback"
        role="img"
        aria-label={name}
      >
        {fallbackIcon}
      </span>
    );
  }

  return (
    <img
      src={src}
      alt={name}
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
}

// BANNER PRINCIPAL
export default function SeasonalBanner({ campaign }) {
  const [products, setProducts] = useState([]);
  const [backgroundFailed, setBackgroundFailed] =
    useState(false);
  const [showShipping, setShowShipping] = useState(false);

  // CARGAR PRODUCTOS
  useEffect(() => {
    let active = true;

    getProducts()
      .then((data) => {
        if (!active) return;

        const items = Array.isArray(data)
          ? data
          : data?.products || data?.data || [];

        setProducts(
          Array.isArray(items) ? items : []
        );
      })
      .catch((error) => {
        console.error(
          "Error cargando productos del banner:",
          error
        );
      });

    return () => {
      active = false;
    };
  }, []);

  // MOSTRAR PRIMERO PRODUCTOS CON DESCUENTOS
  const displayedProducts = useMemo(() => {
    return products
      .map((product, index) => {
        const price = Number(product.price);

        const original = Number(
          product.original_price ??
          product.originalPrice ??
          price
        );

        const validPrice =
          Number.isFinite(price) && price >= 0;

        const hasDiscount =
          validPrice &&
          Number.isFinite(original) &&
          original > price;

        const discount = hasDiscount
          ? Math.round(
              ((original - price) / original) * 100
            )
          : 0;

        return {
          ...product,
          price,
          original,
          discount,
          validPrice,
          fallbackIcon:
            categoryIcons[index % categoryIcons.length],
        };
      })
      .filter((product) => product.validPrice)
      .sort((a, b) => b.discount - a.discount)
      .slice(0, 4);
  }, [products]);

  const theme =
    decorations[campaign?.id] || defaultDecor;

  const background =
    theme.background ||
    campaign?.heroImage ||
    campaign?.image ||
    null;

  useEffect(() => {
    setBackgroundFailed(false);
  }, [background]);

  // CERRAR MODAL CON ESC
  useEffect(() => {
    if (!showShipping) return;

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setShowShipping(false);
      }
    };

    document.addEventListener(
      "keydown",
      handleEscape
    );

    return () => {
      document.removeEventListener(
        "keydown",
        handleEscape
      );
    };
  }, [showShipping]);

  if (!campaign) return null;

  const colors = campaign.colors || [
    "#0755d7",
    "#38bdf8",
  ];

  const name =
    campaign.name ||
    campaign.monthName ||
    "temporada";

  const title =
    campaign.titleMain ||
    campaign.title ||
    `Ofertas de ${name}`;

  const accent =
    campaign.titleAccent ||
    (campaign.titleMain ? "Tech" : "");

  const hasBackground = Boolean(
    background && !backgroundFailed
  );

  return (
    <div
      className={`seasonal-layout seasonal-theme-${campaign.id}`}
    >
      {/* BANNER DE TEMPORADA */}
      <section
        className="seasonal-hero"
        style={{
          "--season-start": colors[0],
          "--season-end": colors[1],
        }}
      >
        {/* IMAGEN DECORATIVA */}
        {hasBackground && (
          <img
            key={background}
            src={background}
            alt=""
            aria-hidden="true"
            className="seasonal-background-image"
            onError={() => setBackgroundFailed(true)}
          />
        )}

        {/* DECORACIONES */}
        <div
          className={`seasonal-decorations ${
            hasBackground ? "has-background" : ""
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

        {/* INFORMACIÓN IZQUIERDA */}
        <div className="seasonal-hero-copy">
          <span className="seasonal-ribbon">
            ✦ {campaign.badge || campaign.label || name} ✦
          </span>

          <h1>
            {title}{" "}
            {accent && <em>{accent}</em>}
          </h1>

          <p>{campaign.description}</p>

          <Link
            className="seasonal-cta"
            to="/promotions#offers"
          >
            {campaign.buttonText || "Ver promociones"}
            <span>❯</span>
          </Link>
        </div>

        {/* PRODUCTOS DESTACADOS */}
        <div className="seasonal-hero-showcase">
          {/* CLIENTE RECURRENTE */}
          <div className="seasonal-recurring">
            <span className="seasonal-crown">
              👑
            </span>

            <div className="seasonal-recurring-text">
              <strong>Cliente recurrente</strong>
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
                product.image_url ||
                product.image ||
                product.images?.[0]?.url ||
                null;

              return (
                <Link
                  key={product.id}
                  to={`/product/${product.id}`}
                  className="seasonal-product-card"
                >
                  {product.discount > 0 && (
                    <span className="seasonal-product-badge">
                      -{product.discount}%
                    </span>
                  )}

                  <div className="seasonal-product-image">
                    <ProductImage
                      src={productImage}
                      name={product.name}
                      fallbackIcon={product.fallbackIcon}
                    />
                  </div>

                  <h3>{product.name}</h3>

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
              );
            })}
          </div>

          {displayedProducts.length === 0 && (
            <div className="seasonal-no-products">
              <span>🎧 ⌚ 🎮 💻</span>
              <p>
                Próximamente, productos destacados
              </p>
            </div>
          )}
        </div>
      </section>

      {/* TARJETAS INFERIORES */}
      <section className="seasonal-promo-strip">

        {/* COMBOS */}
        <div className="seasonal-mini-card mini-blue">
          <span className="mini-decoration">
            {theme.combo}
          </span>

          <div>
            <h3>
              {campaign.miniPromo1Title ||
                "Combo tecnológico"}
            </h3>

            <p>
              {campaign.miniPromo1Text ||
                "Accesorios y dispositivos tecnológicos"}
            </p>

            <Link
              to="/products"
              className="mini-pill"
            >
              Explorar productos
            </Link>
          </div>
        </div>

        {/* CUPÓN SORPRESA */}
        <div className="seasonal-mini-card mini-cream">
          <span className="mini-decoration">
            🎁
          </span>

          <div>
            <h3>Premio sorpresa</h3>

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

        {/* OFERTAS */}
        <div className="seasonal-mini-card mini-blue">
          <span className="mini-decoration">
            {theme.special}
          </span>

          <div>
            <h3>
              {campaign.miniPromo2Title ||
                "Tecnología en oferta"}
            </h3>

            <p>
              {campaign.miniPromo2Text ||
                "Descubre nuestros productos destacados"}
            </p>

            <Link
              to="/promotions#offers"
              className="mini-pill"
            >
              Ver ofertas
            </Link>
          </div>
        </div>

        {/* ENVÍOS */}
        <div className="seasonal-mini-card mini-cream">
          <span className="mini-decoration">
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
              onClick={() => setShowShipping(true)}
            >
              Ver condiciones
            </button>
          </div>
        </div>
      </section>

      {/* MODAL DE ENVÍOS */}
      {showShipping && (
        <div
          className="shipping-modal-overlay"
          onClick={() => setShowShipping(false)}
        >
          <section
            className="shipping-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="shipping-modal-title"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className="shipping-modal-close"
              aria-label="Cerrar ventana"
              onClick={() => setShowShipping(false)}
            >
              ✕
            </button>

            <span className="shipping-modal-icon">
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
              onClick={() => setShowShipping(false)}
            >
              Revisar mi carrito
            </Link>
          </section>
        </div>
      )}
    </div>
  );
}
