
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import "../styles/products.css";

// ==========================================
// CONFIGURACIÓN DE API
// ==========================================

const API_URL = String(
  import.meta.env.VITE_API_URL ||
    (import.meta.env.DEV
      ? "http://localhost:3000"
      : "https://nica-smart-backend.onrender.com")
)
  .trim()
  .replace(/\/+$/, "");

// Obtener origen del backend sin /api
function getBackendOrigin() {
  try {
    return new URL(
      API_URL,
      window.location.origin
    ).origin;
  } catch {
    return window.location.origin;
  }
}

const BACKEND_ORIGIN = getBackendOrigin();

// ==========================================
// NORMALIZAR IMÁGENES
// ==========================================

function extractImages(value) {
  if (!value) return [];

  // Arreglo de imágenes
  if (Array.isArray(value)) {
    return value.flatMap(extractImages);
  }

  // Objetos de imágenes
  if (typeof value === "object") {
    const values = [
      value.url,
      value.image_url,
      value.imageUrl,
      value.src,
      value.path,
      value.image,
      value.images,
    ];

    return values.flatMap(extractImages);
  }

  if (typeof value !== "string") {
    return [];
  }

  const image = value.trim();

  if (
    !image ||
    image === "null" ||
    image === "undefined"
  ) {
    return [];
  }

  // Arreglos u objetos guardados como JSON
  if (
    image.startsWith("[") ||
    image.startsWith("{")
  ) {
    try {
      return extractImages(JSON.parse(image));
    } catch {
      return [];
    }
  }

  return [image];
}

// ==========================================
// CONSTRUIR URL DE IMAGEN
// ==========================================

function resolveImageUrls(image) {
  if (!image) return [];

  const raw = String(image).trim();

  if (!raw) return [];

  // URL absoluta, Base64 o Blob
  if (/^(https?:|data:image\/|blob:)/i.test(raw)) {
    return [raw];
  }

  // URL sin protocolo
  if (raw.startsWith("//")) {
    return [`https:${raw}`];
  }

  const frontendOrigin = window.location.origin;

  // Convertir a ruta absoluta
  const path = `/${raw.replace(/^\/+/, "")}`;

  // Imágenes subidas al backend
  if (path.includes("/uploads/")) {
    const uploadPath =
      "/uploads/" + path.split("/uploads/")[1];

    return [
      `${BACKEND_ORIGIN}${uploadPath}`,
    ];
  }

  // Imágenes estáticas del frontend
  if (
    /^\/(Imagenes|images|assets)\//i.test(path)
  ) {
    return [
      `${frontendOrigin}${path}`,
      `${BACKEND_ORIGIN}${path}`,
    ];
  }

  // Nombre de archivo sin carpeta
  if (!raw.includes("/")) {
    return [
      `${BACKEND_ORIGIN}/uploads/${raw}`,
      `${frontendOrigin}/${raw}`,
    ];
  }

  // Otras rutas relativas
  return [
    `${BACKEND_ORIGIN}${path}`,
    `${frontendOrigin}${path}`,
  ];
}

// ==========================================
// OBTENER TODAS LAS IMÁGENES
// ==========================================

function getProductImages(product) {
  if (!product) return [];

  const sources = [
    product.images,
    product.image_url,
    product.imageUrl,
    product.image,
    product.image_path,
  ];

  const allImages = sources
    .flatMap(extractImages)
    .flatMap(resolveImageUrls);

  return [...new Set(allImages)];
}

// ==========================================
// FORMATO DE MONEDA
// ==========================================

function money(value) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return "C$ 0";
  }

  return `C$ ${number.toLocaleString("es-NI", {
    maximumFractionDigits: 0,
  })}`;
}

// ==========================================
// COMPONENTE DE IMAGEN
// ==========================================

function ProductImage({ product }) {
  const images = useMemo(
    () => getProductImages(product),
    [product]
  );

  const [imageIndex, setImageIndex] = useState(0);

  useEffect(() => {
    setImageIndex(0);
  }, [images]);

  const currentImage = images[imageIndex];

  if (!currentImage) {
    return (
      <div
        className="product-image-fallback"
        role="img"
        aria-label={`Imagen no disponible: ${product.name}`}
        style={{
          width: "100%",
          height: "100%",
          minHeight: "180px",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          background: "#f4f6f8",
          color: "#6b7280",
          fontSize: "14px",
          flexDirection: "column",
          gap: "8px",
        }}
      >
        <span style={{ fontSize: "38px" }}>
          📦
        </span>
        <span>Imagen no disponible</span>
      </div>
    );
  }

  return (
    <img
      src={currentImage}
      alt={product.name}
      loading="lazy"
      onError={() => {
        console.warn(
          "Error cargando imagen del producto:",
          product.name,
          currentImage
        );

        setImageIndex((index) => index + 1);
      }}
    />
  );
}

// ==========================================
// TARJETA DE PRODUCTO
// ==========================================

function ProductCard({ product }) {
  const navigate = useNavigate();
  const { addToCart } = useCart();

  // ========================================
  // PRECIOS Y DESCUENTOS
  // ========================================

  const price = Number(product.price);

  const originalPrice = Number(
    product.original_price ??
      product.originalPrice ??
      product.compare_at_price ??
      product.price
  );

  const hasDiscount =
    Number.isFinite(originalPrice) &&
    Number.isFinite(price) &&
    originalPrice > price;

  const discount = hasDiscount
    ? Math.round(
        ((originalPrice - price) / originalPrice) * 100
      )
    : 0;

  const savings = hasDiscount
    ? originalPrice - price
    : 0;

  // ========================================
  // DISPONIBILIDAD
  // ========================================

  const stock = Number(product.stock);

  const isAvailable =
    Number.isFinite(stock) && stock > 0;

  // ========================================
  // CATEGORÍA
  // ========================================

  const category =
    typeof product.category === "string"
      ? product.category
      : product.category?.name ||
        product.category_name ||
        "Sin categoría";

  // ========================================
  // MARCA
  // ========================================

  const brand =
    typeof product.brand === "string"
      ? product.brand
      : product.brand?.name ||
        product.brand_name ||
        "";

  // ========================================
  // AGREGAR AL CARRITO
  // ========================================

  const handleAddToCart = () => {
    if (!isAvailable) return;

    addToCart(product, 1);

    navigate("/cart");
  };

  // ========================================
  // INTERFAZ DE TARJETA
  // ========================================

  return (
    <article className="product-card">

      {/* ====================================
          IMAGEN DEL PRODUCTO
      ==================================== */}

      <Link
        to={`/product/${product.id}`}
        className="product-image-link"
      >
        <div className="product-image">

          <ProductImage product={product} />

          {/* DESCUENTO */}

          {hasDiscount && (
            <span className="product-discount-badge">
              🔥 -{discount}%
            </span>
          )}

          {/* DISPONIBILIDAD */}

          <span className="product-stock-badge">
            {isAvailable
              ? "Disponible"
              : "Agotado"}
          </span>

        </div>
      </Link>

      {/* ====================================
          INFORMACIÓN DEL PRODUCTO
      ==================================== */}

      <div className="product-card-content">

        {/* MARCA */}

        {brand && (
          <span
            style={{
              fontSize: "11px",
              fontWeight: "bold",
              color: "#0755d7",
              textTransform: "uppercase",
              letterSpacing: "1px",
              display: "block",
              marginBottom: "4px",
            }}
          >
            {brand}
          </span>
        )}

        {/* CATEGORÍA */}

        <p className="product-category">
          {category}
        </p>

        {/* NOMBRE */}

        <Link
          to={`/product/${product.id}`}
          className="product-name-link"
        >
          <h3>{product.name}</h3>
        </Link>

        {/* CALIFICACIÓN VISUAL */}

        <div className="product-rating">
          ★★★★★
        </div>

        {/* ==================================
            PRECIOS
        ================================== */}

        <div className="product-price-block">

          {hasDiscount && (
            <del className="product-price-original">
              {money(originalPrice)}
            </del>
          )}

          <p className="product-price">
            {money(price)}
          </p>

          {hasDiscount && (
            <span className="product-saving">
              Ahorras {money(savings)}
            </span>
          )}

        </div>

        {/* ==================================
            ACCIONES
        ================================== */}

        <div className="product-card-actions">

          <Link
            to={`/product/${product.id}`}
            className="details-button"
          >
            Ver detalles
          </Link>

          <button
            type="button"
            className="cart-button"
            onClick={handleAddToCart}
            disabled={!isAvailable}
            title={
              isAvailable
                ? "Agregar al carrito"
                : "Producto agotado"
            }
            aria-label={
              isAvailable
                ? `Agregar ${product.name} al carrito`
                : `${product.name} agotado`
            }
          >
            🛒
          </button>

        </div>

      </div>
    </article>
  );
}

export default ProductCard;
