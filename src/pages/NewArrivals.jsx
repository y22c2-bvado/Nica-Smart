import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import Header from "../components/Header";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

import { getProducts } from "../services/api";

import "./NewArrivals.css";

const TIMEZONE = "America/Managua";

const money = (value) =>
  new Intl.NumberFormat("es-NI", {
    style: "currency",
    currency: "NIO",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);

function getCategoryName(product) {
  if (typeof product.category === "string") {
    return product.category;
  }

  return (
    product.category?.name ||
    product.category_name ||
    "Sin categoría"
  );
}

function getCreatedTime(product) {
  const value = product.created_at ?? product.createdAt;
  if (!value) return null;
  const time = Date.parse(value);
  return Number.isFinite(time) ? time : null;
}

function getImage(product) {
  const raw =
    product.image_url ||
    product.image ||
    product.images?.[0]?.url ||
    product.images?.[0];

  return typeof raw === "string" ? raw : null;
}

function getDiscount(product) {
  const price = Number(product.price);
  const original = Number(product.original_price ?? product.originalPrice ?? price);

  if (
    !Number.isFinite(price) ||
    !Number.isFinite(original) ||
    original <= price ||
    price < 0
  ) {
    return null;
  }

  return {
    original,
    percentage: Math.round(((original - price) / original) * 100),
  };
}

function ProductImage({ product }) {
  const image = getImage(product);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [image]);

  if (!image || failed) {
    return <span className="new-product-placeholder">📦</span>;
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

export default function NewArrivals() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [category, setCategory] = useState("all");
  const [order, setOrder] = useState("newest");
  const [search, setSearch] = useState("");

  // CONSULTAR PRODUCTOS DE POSTGRESQL A TRAVÉS DE LA API
  useEffect(() => {
    let active = true;

    async function loadProducts() {
      try {
        setLoading(true);
        setError("");

        const response = await getProducts();

        if (!active) return;

        const data = Array.isArray(response)
          ? response
          : response?.products ?? response?.data?.products ?? response?.data ?? [];

        setProducts(Array.isArray(data) ? data : []);
      } catch (err) {
        if (!active) return;

        console.error("Error cargando nuevos ingresos:", err);
        setError("No se pudieron cargar los productos nuevos.");
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

  // NUEVA LÓGICA: FILTRAR ESTRICTAMENTE POR is_new === true
  const recentProducts = useMemo(() => {
    return products.filter((product) => {
      if (!product || product.id == null) return false;
      const price = Number(product.price);
      
      return (
        product.is_new === true &&
        Number.isFinite(price) &&
        price >= 0
      );
    });
  }, [products]);

  // CATEGORÍAS PRESENTES ENTRE LOS NUEVOS INGRESOS
  const categories = useMemo(() => {
    return [...new Set(recentProducts.map(getCategoryName))].sort((a, b) =>
      a.localeCompare(b)
    );
  }, [recentProducts]);

  // BUSCAR, FILTRAR Y ORDENAR
  const visibleProducts = useMemo(() => {
    const term = search.trim().toLowerCase();

    return recentProducts
      .filter((product) => {
        const matchesCategory =
          category === "all" || getCategoryName(product) === category;

        const text = [product.name, product.description, getCategoryName(product)]
          .join(" ")
          .toLowerCase();

        const matchesSearch = !term || text.includes(term);

        return matchesCategory && matchesSearch;
      })
      .sort((a, b) => {
        if (order === "oldest") {
          return (getCreatedTime(a) || 0) - (getCreatedTime(b) || 0);
        }
        if (order === "price-low") {
          return Number(a.price) - Number(b.price);
        }
        if (order === "price-high") {
          return Number(b.price) - Number(a.price);
        }
        // Por defecto: Más recientes
        return (getCreatedTime(b) || 0) - (getCreatedTime(a) || 0);
      });
  }, [recentProducts, category, order, search]);

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
              Descubre la tecnología recién llegada a NICA S-MART. Nuevos equipos,
              accesorios y dispositivos.
            </p>

            <a href="#new-products">Explorar novedades ↓</a>
          </div>

          <div className="new-arrivals-hero-art" aria-hidden="true">
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

        {/* LISTADO DE PRODUCTOS */}
        <section id="new-products" className="new-arrivals-content">
          <div className="new-arrivals-heading">
            <div>
              <span className="new-arrivals-kicker">RECIÉN LLEGADOS</span>
              <h2>✨ Nuevos productos</h2>
              <p>Los productos más recientes agregados a nuestro catálogo.</p>
            </div>

            <div className="new-arrivals-filters">
              <label>
                Filtrar por:
                <select
                  value={category}
                  onChange={(event) => setCategory(event.target.value)}
                >
                  <option value="all">Todas las categorías</option>
                  {categories.map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Ordenar por:
                <select
                  value={order}
                  onChange={(event) => setOrder(event.target.value)}
                >
                  <option value="newest">Más recientes</option>
                  <option value="oldest">Más antiguos</option>
                  <option value="price-low">Menor precio</option>
                  <option value="price-high">Mayor precio</option>
                </select>
              </label>
            </div>
          </div>

          {/* BÚSQUEDA */}
          <div className="new-arrivals-toolbar">
            <input
              type="search"
              placeholder="Buscar entre los nuevos productos..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              aria-label="Buscar nuevos productos"
            />
            <span>{visibleProducts.length} productos</span>
          </div>

          {/* CARGANDO */}
          {loading && (
            <div className="new-arrivals-empty">
              <span>⏳</span>
              <h3>Cargando nuevos ingresos...</h3>
            </div>
          )}

          {/* ERROR */}
          {!loading && error && (
            <div className="new-arrivals-empty" role="alert">
              <span>⚠️</span>
              <h3>No se pudo cargar el catálogo</h3>
              <p>{error}</p>
            </div>
          )}

          {/* SIN PRODUCTOS NUEVOS */}
          {!loading && !error && visibleProducts.length === 0 && (
            <div className="new-arrivals-empty">
              <span>📦</span>
              <h3>
                {recentProducts.length === 0
                  ? "Aún no hay nuevos ingresos"
                  : "No encontramos coincidencias"}
              </h3>
              <p>
                {recentProducts.length === 0
                  ? "Los productos registrados recientemente desde administración aparecerán aquí."
                  : "Prueba con otro nombre o categoría."}
              </p>
              <Link to="/products">Ver catálogo completo</Link>
            </div>
          )}

          {/* TARJETAS */}
          {!loading && !error && visibleProducts.length > 0 && (
            <div className="new-arrivals-grid">
              {visibleProducts.map((product) => {
                const discount = getDiscount(product);
                const createdAt = product.created_at ?? product.createdAt;

                return (
                  <article className="new-arrivals-card" key={product.id}>
                    <div className="new-arrivals-image">
                      <span className="new-arrivals-badge">✨ Nuevo</span>

                      {discount && (
                        <span className="new-arrivals-discount">
                          -{discount.percentage}%
                        </span>
                      )}

                      <Link to={`/product/${product.id}`}>
                        <ProductImage product={product} />
                      </Link>
                    </div>

                    <div className="new-arrivals-info">
                      <small className="new-arrivals-category">
                        {getCategoryName(product)}
                      </small>

                      <h3>{product.name}</h3>

                      <p>
                        {product.description
                          ? String(product.description).slice(0, 90)
                          : "Nuevo producto disponible en NICA S-MART"}
                      </p>

                      <div className="new-arrivals-prices">
                        {discount && <del>{money(discount.original)}</del>}
                        <strong>{money(product.price)}</strong>
                      </div>

                      {createdAt && (
                        <span className="new-arrivals-date">
                          📅 Agregado el{" "}
                          {new Intl.DateTimeFormat("es-NI", {
                            timeZone: TIMEZONE,
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          }).format(new Date(createdAt))}
                        </span>
                      )}

                      <Link
                        className="new-arrivals-buy"
                        to={`/product/${product.id}`}
                      >
                        🛒 Ver producto
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </main>

      <Footer />
    </>
  );
}