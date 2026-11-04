
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import Header from "../components/Header";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

import {
  getPromoCart,
  savePromoCart,
  clearPromoCart,
} from "../utils/promoCart";

import "./PromoCart.css";

// FORMATO DE MONEDA NICARAGÜENSE
const money = (value) =>
  new Intl.NumberFormat("es-NI", {
    style: "currency",
    currency: "NIO",
    maximumFractionDigits: 0,
  }).format(value);

// VALIDAR Y NORMALIZAR PRODUCTOS DEL CARRITO
function normalizeCartItem(item) {
  const price = Number(item.price);
  const original = Number(item.original);
  const quantity = Math.max(
    1,
    Math.floor(Number(item.quantity) || 1)
  );

  if (
    item.id == null ||
    !Number.isFinite(price) ||
    price < 0
  ) {
    return null;
  }

  return {
    ...item,
    price,
    original:
      Number.isFinite(original) && original > price
        ? original
        : price,
    quantity,
  };
}

// IMAGEN CON RESPALDO
function CartProductImage({ image, name }) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [image]);

  if (
    !image ||
    typeof image !== "string" ||
    failed
  ) {
    return (
      <span
        className="promo-cart-image-fallback"
        role="img"
        aria-label={name}
      >
        📦
      </span>
    );
  }

  return (
    <img
      src={image}
      alt={name}
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
}

export default function PromoCart() {
  const [items, setItems] = useState(() =>
    getPromoCart()
      .map(normalizeCartItem)
      .filter(Boolean)
  );

  const [notice, setNotice] = useState("");

  // ACTUALIZAR CARRITO Y LOCALSTORAGE
  const updateItems = (newItems) => {
    setItems(newItems);
    savePromoCart(newItems);
    setNotice("");
  };

  // AUMENTAR O DISMINUIR CANTIDAD
  const changeQuantity = (id, change) => {
    const updated = items
      .map((item) => {
        if (String(item.id) !== String(id)) {
          return item;
        }

        return {
          ...item,
          quantity: Math.max(
            0,
            item.quantity + change
          ),
        };
      })
      .filter((item) => item.quantity > 0);

    updateItems(updated);
  };

  // ELIMINAR UN PRODUCTO
  const removeProduct = (id) => {
    const updated = items.filter(
      (item) => String(item.id) !== String(id)
    );

    updateItems(updated);
  };

  // VACIAR TODO EL CARRITO
  const emptyCart = () => {
    clearPromoCart();
    setItems([]);
    setNotice("El carrito promocional está vacío.");
  };

  // CALCULAR TOTALES
  const totals = useMemo(() => {
    const originalTotal = items.reduce(
      (sum, item) =>
        sum + item.original * item.quantity,
      0
    );

    const subtotal = items.reduce(
      (sum, item) =>
        sum + item.price * item.quantity,
      0
    );

    const quantity = items.reduce(
      (sum, item) => sum + item.quantity,
      0
    );

    const savings = Math.max(
      0,
      originalTotal - subtotal
    );

    const discountPercent =
      originalTotal > 0
        ? Math.round(
            (savings / originalTotal) * 100
          )
        : 0;

    return {
      originalTotal,
      subtotal,
      savings,
      quantity,
      discountPercent,
    };
  }, [items]);

  return (
    <>
      <Header />
      <Navbar />

      <main className="promo-cart-page">
        {/* ENCABEZADO */}
        <div className="promo-cart-heading">
          <div>
            <span className="promo-cart-overline">
              🎁 NICA S-MART
            </span>

            <h1>Mi carrito promocional</h1>

            <p>
              Consulta los descuentos y ahorros
              de los productos seleccionados.
            </p>
          </div>

          <Link
            to="/promotions#offers"
            className="promo-cart-back"
          >
            ← Seguir viendo promociones
          </Link>
        </div>

        {/* MENSAJES */}
        {notice && (
          <p className="promo-cart-notice" role="status">
            {notice}
          </p>
        )}

        {/* CARRITO VACÍO */}
        {items.length === 0 ? (
          <div className="promo-cart-empty">
            <span>🛒</span>

            <h2>
              Tu carrito promocional está vacío
            </h2>

            <p>
              Explora nuestros productos destacados
              y agrega los que quieras comprar.
            </p>

            <Link to="/promotions#offers">
              Ver promociones
            </Link>
          </div>
        ) : (
          <div className="promo-cart-layout">

            {/* LISTA DE PRODUCTOS */}
            <section className="promo-cart-products">

              <div className="promo-cart-section-heading">
                <h2>
                  Productos seleccionados
                  ({totals.quantity})
                </h2>

                <button
                  type="button"
                  onClick={emptyCart}
                >
                  Vaciar carrito
                </button>
              </div>

              {items.map((item) => {
                const discount =
                  item.original > item.price
                    ? Math.round(
                        ((item.original - item.price) /
                          item.original) * 100
                      )
                    : 0;

                const itemSavings =
                  (item.original - item.price) *
                  item.quantity;

                const lineTotal =
                  item.price * item.quantity;

                return (
                  <article
                    key={item.id}
                    className="promo-cart-item"
                  >
                    {/* IMAGEN */}
                    <div className="promo-cart-item-image">
                      <CartProductImage
                        image={item.image}
                        name={item.name}
                      />
                    </div>

                    {/* INFORMACIÓN */}
                    <div className="promo-cart-item-info">

                      <h3>{item.name}</h3>

                      {discount > 0 ? (
                        <span className="promo-cart-discount">
                          🔥 {discount}% de descuento
                        </span>
                      ) : (
                        <span className="promo-cart-regular">
                          Producto destacado
                        </span>
                      )}

                      {/* PRECIOS */}
                      <div className="promo-cart-prices">
                        {discount > 0 && (
                          <del>
                            {money(item.original)}
                          </del>
                        )}

                        <strong>
                          {money(item.price)}
                        </strong>
                      </div>

                      {/* AHORRO INDIVIDUAL */}
                      {discount > 0 && (
                        <p className="promo-cart-savings">
                          Ahorras {money(itemSavings)}
                        </p>
                      )}

                      {/* CANTIDAD Y ELIMINAR */}
                      <div className="promo-cart-actions">

                        <div className="promo-cart-quantity">
                          <button
                            type="button"
                            aria-label={`Quitar una unidad de ${item.name}`}
                            onClick={() =>
                              changeQuantity(
                                item.id,
                                -1
                              )
                            }
                          >
                            −
                          </button>

                          <span>{item.quantity}</span>

                          <button
                            type="button"
                            aria-label={`Agregar una unidad de ${item.name}`}
                            onClick={() =>
                              changeQuantity(
                                item.id,
                                1
                              )
                            }
                          >
                            +
                          </button>
                        </div>

                        <button
                          type="button"
                          className="promo-cart-remove"
                          onClick={() =>
                            removeProduct(item.id)
                          }
                        >
                          Eliminar
                        </button>
                      </div>
                    </div>

                    {/* TOTAL POR PRODUCTO */}
                    <strong className="promo-cart-line-total">
                      {money(lineTotal)}
                    </strong>
                  </article>
                );
              })}
            </section>

            {/* RESUMEN DE DESCUENTOS */}
            <aside className="promo-cart-summary">

              <h2>Resumen de la promoción</h2>

              <div>
                <span>Productos</span>
                <strong>{totals.quantity}</strong>
              </div>

              <div>
                <span>Precio original</span>
                <del>
                  {money(totals.originalTotal)}
                </del>
              </div>

              <div>
                <span>Descuentos</span>
                <strong className="promo-cart-green">
                  -{money(totals.savings)}
                </strong>
              </div>

              {totals.savings > 0 && (
                <div>
                  <span>Descuento equivalente</span>
                  <strong className="promo-cart-green">
                    {totals.discountPercent}%
                  </strong>
                </div>
              )}

              <div className="promo-cart-total">
                <span>Total antes del envío</span>

                <strong>
                  {money(totals.subtotal)}
                </strong>
              </div>

              {/* MENSAJE DE AHORRO */}
              {totals.savings > 0 && (
                <p className="promo-cart-congratulations">
                  🎉 ¡Estás ahorrando{" "}
                  {money(totals.savings)}!
                </p>
              )}

              <p className="promo-cart-notice">
                Los descuentos mostrados se basan
                en los precios del catálogo al
                agregar los productos. El servidor
                deberá verificarlos antes de
                confirmar el pedido.
              </p>

              <Link
                to="/promotions#offers"
                className="promo-cart-continue"
              >
                Agregar más productos
              </Link>

              <p className="promo-cart-notice">
                La compra de este carrito se
                habilitará cuando se integre
                con el proceso de pago.
              </p>
            </aside>
          </div>
        )}
      </main>

      <Footer />
    </>
  );
}
