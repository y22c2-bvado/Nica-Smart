
import { useEffect, useMemo, useState } from "react";
import {
  Link,
  useLocation,
  useNavigate,
} from "react-router-dom";

import Header from "../components/Header";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import SeasonalBanner from "../components/SeasonalBanner";

import useSeasonalPromotion from "../Hooks/useSeasonalPromotion";
import { getProducts } from "../services/api";
import { addPromoProduct } from "../Utils/promoCart";

import "./Promotions.css";

const TIMEZONE = "America/Managua";
const PRODUCTS_TO_SHOW = 4;

const money = (value) =>
  new Intl.NumberFormat("es-NI", {
    style: "currency",
    currency: "NIO",
    maximumFractionDigits: 0,
  }).format(value);

const categories = [
  ["🎧", "Audio"],
  ["⌚", "Wearables"],
  ["🎮", "Gaming"],
  ["💻", "Computadoras"],
  ["📱", "Celulares"],
  ["🔌", "Accesorios"],
  ["📷", "Cámaras"],
  ["🖥️", "Monitores"],
];

const seasonalKeywords = {
  halloween: [
    "gaming", "gamer", "rgb", "teclado",
    "mouse", "control", "audifono", "headset",
    "consola",
  ],

  "black-november": [
    "laptop", "computadora", "monitor",
    "celular", "tablet", "ssd", "gaming",
  ],

  "black-friday": [
    "laptop", "monitor", "celular",
    "computadora", "gaming",
  ],

  christmas: [
    "smartwatch", "reloj", "audifono",
    "parlante", "gaming", "regalo",
  ],

  navidad: [
    "smartwatch", "reloj", "audifono",
    "parlante", "gaming", "regalo",
  ],

  agosto: [
    "parlante", "audio", "audifono",
    "cargador", "celular",
  ],

  patrio: [
    "computadora", "laptop", "teclado",
    "mouse", "memoria", "usb",
  ],
};

// CONFIGURACIÓN GAMING
const gamingFilters = [
  {
    id: "all",
    label: "🎮 Todos",
    keywords: [],
  },
  {
    id: "keyboard",
    label: "⌨️ Teclados",
    keywords: ["teclado", "keyboard"],
  },
  {
    id: "mouse",
    label: "🖱️ Mouse",
    keywords: ["mouse", "raton"],
  },
  {
    id: "headset",
    label: "🎧 Audífonos",
    keywords: ["audifono", "headset", "auricular"],
  },
  {
    id: "controller",
    label: "🎮 Controles",
    keywords: ["control", "mando", "gamepad", "joystick"],
  },
  {
    id: "console",
    label: "🕹️ Consolas",
    keywords: [
      "consola", "playstation", "xbox", "nintendo",
    ],
  },
];

const gamingKeywords = [
  "gaming",
  "gamer",
  "rgb",
  "teclado",
  "keyboard",
  "mouse",
  "raton",
  "control",
  "mando",
  "headset",
  "audifono",
  "auricular",
  "joystick",
  "gamepad",
  "consola",
  "playstation",
  "xbox",
  "nintendo",
  "volante",
];

// NORMALIZAR TEXTO
function normalize(value) {
  return String(value ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function getProductText(product) {
  const category =
    typeof product.category === "string"
      ? product.category
      : product.category?.name || "";

  return normalize([
    product.name,
    product.description,
    product.category_name,
    category,
  ].join(" "));
}

// IDENTIFICAR PRODUCTOS GAMING
function isGamingProduct(product) {
  const category =
    typeof product.category === "string"
      ? product.category
      : product.category?.name ||
        product.category_name ||
        "";

  const normalizedCategory = normalize(category);

  if (
    normalizedCategory.includes("gaming") ||
    normalizedCategory.includes("gamer")
  ) {
    return true;
  }

  const text = getProductText(product);

  return gamingKeywords.some((keyword) =>
    text.includes(normalize(keyword))
  );
}

// PRIORIDAD POR TEMPORADA
function getSeasonalScore(product, campaign) {
  const keywords =
    campaign?.keywords ||
    seasonalKeywords[campaign?.id] ||
    [];

  const text = getProductText(product);

  return keywords.reduce(
    (score, keyword) =>
      score + (
        text.includes(normalize(keyword)) ? 1 : 0
      ),
    0
  );
}

// NORMALIZAR PRECIOS Y DESCUENTOS
function normalizeProduct(product, campaign) {
  const price = Number(product.price);

  if (!Number.isFinite(price) || price < 0) {
    return null;
  }

  const original = Number(
    product.original_price ??
    product.originalPrice ??
    product.compare_at_price ??
    price
  );

  const hasDiscount =
    Number.isFinite(original) &&
    original > price;

  const finalOriginal = hasDiscount
    ? original
    : price;

  const discount = hasDiscount
    ? Math.round(
        ((original - price) / original) * 100
      )
    : 0;

  return {
    ...product,
    price,
    original: finalOriginal,
    original_price: finalOriginal,
    discount,
    hasDiscount,
    savings: hasDiscount ? original - price : 0,
    seasonScore: getSeasonalScore(product, campaign),
  };
}

// COMPONENTE DE IMAGEN
function PromotionImage({ product }) {
  const rawImage =
    product.image_url ||
    product.image ||
    product.images?.[0]?.url ||
    product.images?.[0] ||
    null;

  const image =
    typeof rawImage === "string"
      ? rawImage
      : null;

  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [image]);

  if (!image || failed) {
    return (
      <span
        className="promotion-image-fallback"
        role="img"
        aria-label={product.name}
      >
        🎮
      </span>
    );
  }

  return (
    <img
      src={image}
      alt={product.name}
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
}

// CONTADOR REGRESIVO
function calculateCountdown(now, campaign) {
  const parts = new Intl.DateTimeFormat(
    "en-US",
    {
      timeZone: TIMEZONE,
      year: "numeric",
      month: "numeric",
    }
  ).formatToParts(now);

  const year = Number(
    parts.find((p) => p.type === "year")?.value
  );

  const month = Number(
    parts.find((p) => p.type === "month")?.value
  );

  // Fin del mes en Managua, UTC-6
  let deadline = Date.UTC(
    year,
    month,
    1,
    6,
    0,
    0
  );

  // Utilizar la fecha final de la campaña
  // cuando esté configurada y sea válida.
  if (campaign?.endsAt) {
    const configured = Date.parse(campaign.endsAt);

    if (
      Number.isFinite(configured) &&
      configured > now.getTime()
    ) {
      deadline = configured;
    }
  }

  const totalSeconds = Math.max(
    0,
    Math.ceil(
      (deadline - now.getTime()) / 1000
    )
  );

  return {
    days: Math.floor(totalSeconds / 86400),
    hours: Math.floor(
      (totalSeconds % 86400) / 3600
    ),
    minutes: Math.floor(
      (totalSeconds % 3600) / 60
    ),
    seconds: totalSeconds % 60,
  };
}

function Countdown({ now, campaign }) {
  const countdown = calculateCountdown(
    now,
    campaign
  );

  const units = [
    ["Días", countdown.days],
    ["Horas", countdown.hours],
    ["Min", countdown.minutes],
    ["Seg", countdown.seconds],
  ];

  return (
    <div className="promo-countdown">
      <span className="promo-countdown-label">
        ⏱️ La temporada termina en:
      </span>

      <div className="promo-countdown-units">
        {units.map(([label, value]) => (
          <div
            key={label}
            className="promo-countdown-unit"
          >
            <strong>
              {String(value).padStart(2, "0")}
            </strong>

            <small>{label}</small>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Promotions() {
  const campaign = useSeasonalPromotion();

  const navigate = useNavigate();
  const location = useLocation();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cartError, setCartError] = useState("");

  const [gamingSearch, setGamingSearch] = useState("");
  const [gamingFilter, setGamingFilter] = useState("all");

  const [now, setNow] = useState(
    () => new Date()
  );

  // ACTUALIZAR RELOJ
  useEffect(() => {
    const updateClock = () => setNow(new Date());

    const timer = window.setInterval(
      updateClock,
      1000
    );

    window.addEventListener(
      "focus",
      updateClock
    );

    document.addEventListener(
      "visibilitychange",
      updateClock
    );

    return () => {
      window.clearInterval(timer);

      window.removeEventListener(
        "focus",
        updateClock
      );

      document.removeEventListener(
        "visibilitychange",
        updateClock
      );
    };
  }, []);

  // CARGAR PRODUCTOS
  useEffect(() => {
    let active = true;

    async function loadProducts() {
      try {
        setLoading(true);
        setError("");

        const response = await getProducts();

        if (!active) return;

        const items = Array.isArray(response)
          ? response
          : response?.products ||
            response?.data?.products ||
            response?.data ||
            [];

        setProducts(
          Array.isArray(items) ? items : []
        );
      } catch (err) {
        if (!active) return;

        console.error(
          "Error cargando productos:",
          err
        );

        setError(
          "No se pudieron cargar los productos."
        );
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadProducts();

    return () => {
      active = false;
    };
  }, []);

  // NORMALIZAR CATÁLOGO
  const catalog = useMemo(() => {
    return products
      .filter(
        (product) =>
          product &&
          typeof product === "object"
      )
      .map((product) =>
        normalizeProduct(product, campaign)
      )
      .filter(Boolean);
  }, [products, campaign?.id]);

  // PRODUCTOS DESTACADOS DE TEMPORADA
  const featuredProducts = useMemo(() => {
    return [...catalog]
      .sort((a, b) => {
        const discountPriority =
          Number(b.hasDiscount) -
          Number(a.hasDiscount);

        if (discountPriority !== 0) {
          return discountPriority;
        }

        if (b.seasonScore !== a.seasonScore) {
          return b.seasonScore - a.seasonScore;
        }

        if (b.discount !== a.discount) {
          return b.discount - a.discount;
        }

        return String(a.id).localeCompare(
          String(b.id)
        );
      })
      .slice(0, PRODUCTS_TO_SHOW);
  }, [catalog]);

  // TODOS LOS PRODUCTOS GAMING
  const gamingProducts = useMemo(() => {
    return catalog
      .filter(isGamingProduct)
      .sort((a, b) => {
        if (b.discount !== a.discount) {
          return b.discount - a.discount;
        }

        return String(a.name).localeCompare(
          String(b.name)
        );
      });
  }, [catalog]);

  // FILTRAR PRODUCTOS GAMING
  const filteredGamingProducts = useMemo(() => {
    const selectedFilter = gamingFilters.find(
      (filter) => filter.id === gamingFilter
    );

    const search = normalize(gamingSearch.trim());

    return gamingProducts.filter((product) => {
      const text = getProductText(product);
      const name = normalize(product.name);

      const matchesSearch =
        !search || text.includes(search);

      const matchesFilter =
        gamingFilter === "all" ||
        selectedFilter?.keywords.some(
          (keyword) => name.includes(normalize(keyword))
        );

      return matchesSearch && matchesFilter;
    });
  }, [gamingProducts, gamingSearch, gamingFilter]);

  // AGREGAR AL CARRITO PROMOCIONAL
  const handleAddToPromoCart = (product) => {
    try {
      setCartError("");

      const added = addPromoProduct({
        ...product,
        original_price: product.original,
        price: product.price,
      });

      if (!added) {
        setCartError(
          "No se pudo agregar el producto."
        );
        return;
      }

      navigate("/promo-cart");
    } catch (err) {
      console.error("Error en carrito:", err);

      setCartError(
        "No se pudo guardar el producto."
      );
    }
  };

  // DESPLAZAMIENTO A SECCIONES
  useEffect(() => {
    const hash = location.hash.replace("#", "");

    if (!["offers", "gaming"].includes(hash)) {
      return;
    }

    document
      .getElementById(hash)
      ?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
  }, [location.hash, loading]);

  // HORA DE NICARAGUA
  const currentTime = new Intl.DateTimeFormat(
    "es-NI",
    {
      timeZone: TIMEZONE,
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hourCycle: "h23",
    }
  ).format(now);

  const seasonName =
    campaign?.name ||
    campaign?.monthName ||
    "Temporada";

  const hasDiscounts = featuredProducts.some(
    (product) => product.hasDiscount
  );

  return (
    <>
      <Header />
      <Navbar />

      <main className="promotions-page">

        {/* BANNER AUTOMÁTICO */}
        {campaign && (
          <SeasonalBanner campaign={campaign} />
        )}

        {/* OFERTAS DE TEMPORADA */}
        <section
          id="offers"
          className="promotions-content"
        >
          <div className="promo-vip-bar">
            <div className="promo-vip-title">
              <span>👑</span>
              <strong>
                Beneficios para clientes
              </strong>
            </div>

            <span className="promo-vip-message">
              Gracias por comprar en NICA S-MART
            </span>

            <span className="promo-vip-reward">
              🎁 Recompensas especiales próximamente
            </span>
          </div>

          <div className="promo-season-header">
            <div>
              <h2>
                ⚡ Ofertas de {seasonName}
              </h2>

              <p>
                {hasDiscounts
                  ? "Aprovecha nuestros productos con descuentos disponibles."
                  : "Explora nuestra selección especial de temporada."}
              </p>

              <span className="promo-local-time">
                🕒 Nicaragua: {currentTime}
              </span>
            </div>

            <Countdown
              now={now}
              campaign={campaign}
            />
          </div>

          {cartError && (
            <p
              className="promotions-message"
              role="alert"
            >
              {cartError}
            </p>
          )}

          {loading && (
            <div className="promotions-empty">
              <span>⏳</span>
              <h3>Cargando productos...</h3>
            </div>
          )}

          {!loading && error && (
            <div
              className="promotions-empty"
              role="alert"
            >
              <span>⚠️</span>
              <h3>No se pudo cargar el catálogo</h3>
              <p>{error}</p>
            </div>
          )}

          {!loading &&
            !error &&
            featuredProducts.length === 0 && (
              <div className="promotions-empty">
                <span>📦</span>
                <h3>No hay productos disponibles</h3>
              </div>
            )}

          {!loading &&
            !error &&
            featuredProducts.length > 0 && (
              <div className="promo-season-grid">
                {featuredProducts.map((product, index) => (
                  <article
                    key={product.id}
                    className={`promo-season-card ${
                      index === 0 && product.hasDiscount
                        ? "promo-season-card-featured"
                        : ""
                    }`}
                  >
                    <div className="promo-season-image">
                      {product.hasDiscount && (
                        <span className="promo-season-discount">
                          🔥 -{product.discount}%
                        </span>
                      )}

                      <Link
                        to={`/product/${product.id}`}
                      >
                        <PromotionImage product={product} />
                      </Link>
                    </div>

                    <div className="promo-season-info">
                      <h3>{product.name}</h3>

                      <p className="promo-season-description">
                        {product.description
                          ? String(product.description).slice(0, 90)
                          : "Tecnología disponible en NICA S-MART"}
                      </p>

                      <div className="promo-season-prices">
                        {product.hasDiscount && (
                          <del>{money(product.original)}</del>
                        )}

                        <strong>
                          {money(product.price)}
                        </strong>

                        {product.hasDiscount && (
                          <span className="promo-season-saving">
                            Ahorras {money(product.savings)}
                          </span>
                        )}
                      </div>

                      <div className="promo-season-benefit">
                        {product.hasDiscount
                          ? `✓ ${product.discount}% de descuento`
                          : "✓ Producto destacado"}
                      </div>

                      <button
                        type="button"
                        className="promo-season-buy"
                        onClick={() =>
                          handleAddToPromoCart(product)
                        }
                      >
                        🛒 Agregar al carrito
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}

          <div className="promo-season-footer">
            <Link to="/promo-cart">
              🛒 Ver carrito promocional
            </Link>

            <span> | </span>

            <Link to="/products">
              Explorar todos los productos →
            </Link>
          </div>
        </section>

        {/* =====================================
            GAMING ZONE
        ===================================== */}
        <section
          id="gaming"
          className="gaming-zone"
        >
          <div className="gaming-zone-header">
            <div>
              <span className="gaming-zone-label">
                🎮 NICA S-MART GAMING
              </span>

              <h2>Gaming Zone</h2>

              <p>
                Descubre teclados RGB, mouse gamer,
                controles, audífonos y accesorios
                para mejorar tu setup.
              </p>
            </div>

            <span className="gaming-zone-counter">
              {gamingProducts.length} productos gaming
            </span>
          </div>

          {/* BUSCADOR */}
          <div className="gaming-zone-search">
            <input
              type="search"
              value={gamingSearch}
              onChange={(event) =>
                setGamingSearch(event.target.value)
              }
              placeholder="🔎 Buscar productos gaming..."
              aria-label="Buscar productos gaming"
            />
          </div>

          {/* FILTROS */}
          <div className="gaming-zone-categories">
            {gamingFilters.map((filter) => (
              <button
                key={filter.id}
                type="button"
                className={
                  gamingFilter === filter.id
                    ? "gaming-filter-active"
                    : ""
                }
                onClick={() =>
                  setGamingFilter(filter.id)
                }
              >
                {filter.label}
              </button>
            ))}
          </div>

          {loading && (
            <div className="gaming-zone-empty">
              Cargando productos gaming...
            </div>
          )}

          {!loading && error && (
            <div
              className="gaming-zone-empty"
              role="alert"
            >
              No se pudo cargar el catálogo gaming.
            </div>
          )}

          {!loading &&
            !error &&
            filteredGamingProducts.length === 0 && (
              <div className="gaming-zone-empty">
                <span>🎮</span>

                <h3>
                  No se encontraron productos gaming
                </h3>

                <p>
                  Prueba otra búsqueda o categoría.
                </p>
              </div>
            )}

          {!loading &&
            !error &&
            filteredGamingProducts.length > 0 && (
              <div className="gaming-zone-grid">
                {filteredGamingProducts.map(
                  (product) => (
                    <article
                      key={product.id}
                      className="gaming-zone-card"
                    >
                      {/* IMAGEN */}
                      <div className="gaming-zone-image">
                        {product.hasDiscount && (
                          <span className="gaming-zone-discount">
                            🔥 -{product.discount}%
                          </span>
                        )}

                        <Link
                          to={`/product/${product.id}`}
                        >
                          <PromotionImage product={product} />
                        </Link>
                      </div>

                      {/* INFORMACIÓN */}
                      <div className="gaming-zone-info">
                        <span className="gaming-zone-type">
                          GAMING
                        </span>

                        <h3>{product.name}</h3>

                        <p>
                          {product.description
                            ? String(product.description).slice(0, 85)
                            : "Producto gaming disponible en NICA S-MART"}
                        </p>

                        <div className="gaming-zone-prices">
                          {product.hasDiscount && (
                            <del>
                              {money(product.original)}
                            </del>
                          )}

                          <strong>
                            {money(product.price)}
                          </strong>
                        </div>

                        {product.hasDiscount && (
                          <div className="gaming-zone-saving">
                            Ahorras {money(product.savings)}
                          </div>
                        )}

                        <div className="gaming-zone-actions">
                          <Link
                            to={`/product/${product.id}`}
                            className="gaming-zone-details"
                          >
                            Ver detalles
                          </Link>

                          <button
                            type="button"
                            className="gaming-zone-buy"
                            onClick={() =>
                              handleAddToPromoCart(product)
                            }
                          >
                            🛒 Agregar
                          </button>
                        </div>
                      </div>
                    </article>
                  )
                )}
              </div>
            )}
        </section>

        {/* CATEGORÍAS DESTACADAS */}
        <section className="seasonal-categories">
          <div className="promotions-header">
            <div>
              <span className="promotions-overline">
                EXPLORA NICA S-MART
              </span>

              <h2>
                🏷️ Categorías destacadas
              </h2>

              <p>
                Encuentra tecnología para cada ocasión.
              </p>
            </div>

            <Link
              to="/categories"
              className="view-all-link"
            >
              Ver todas →
            </Link>
          </div>

          <div className="seasonal-categories-grid">
            {categories.map(([icon, name]) => (
              <Link
                key={name}
                to="/categories"
                className="seasonal-category"
              >
                <span>{icon}</span>
                <strong>{name}</strong>
              </Link>
            ))}
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
