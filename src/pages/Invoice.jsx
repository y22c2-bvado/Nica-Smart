
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { jsPDF } from 'jspdf';

import Header from '../components/Header';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

import '../styles/invoice.css';

// ==========================================
// CONFIGURACIÓN
// ==========================================

const API_URL = String(
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV ? 'http://localhost:3000' : '')
)
  .trim()
  .replace(/\/+$/, '');

// ==========================================
// UTILIDADES
// ==========================================

const money = (value) =>
  `C$ ${Number(value || 0).toLocaleString('es-NI', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;

const formatDate = (value) => {
  if (!value) return 'Sin fecha';

  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? 'Sin fecha'
    : date.toLocaleDateString('es-NI', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
};

const paymentLabel = (method) => {
  switch (method) {
    case 'tarjeta_simulada':
      return 'Tarjeta (demostración)';

    case 'transferencia_simulada':
      return 'Transferencia (demostración)';

    default:
      return 'No especificado';
  }
};

const cardLabel = (brand) => {
  if (brand === 'visa') return 'Visa';
  if (brand === 'mastercard') return 'Mastercard';
  return '';
};

const orderLabel = (status) => {
  const names = {
    pendiente: 'Pendiente',
    preparando: 'Preparando',
    enviado: 'Enviado',
    entregado: 'Entregado',
    cancelado: 'Cancelado'
  };

  return names[status] || status || 'Pendiente';
};

const getItems = (items) => {
  if (Array.isArray(items)) return items;

  if (typeof items === 'string') {
    try {
      const parsed = JSON.parse(items);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  return [];
};

// ==========================================
// GENERAR PDF RESPONSIVE A4
// ==========================================

function downloadInvoicePDF(order) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = 210;
  const pageHeight = 297;

  const left = 18;
  const right = 192;
  const maxWidth = right - left;

  const blue = [21, 101, 216];
  const dark = [18, 24, 38];
  const muted = [100, 116, 139];
  const border = [226, 232, 240];

  let y = 20;

  const setText = (
    color,
    size,
    weight = 'normal'
  ) => {
    doc.setTextColor(...color);
    doc.setFont('helvetica', weight);
    doc.setFontSize(size);
  };

  const addPageIfNeeded = (required = 12) => {
    if (y + required > pageHeight - 20) {
      doc.addPage();
      y = 20;
      return true;
    }

    return false;
  };

  const line = () => {
    doc.setDrawColor(...border);
    doc.line(left, y, right, y);
  };

  const addParagraph = (
    text,
    options = {}
  ) => {
    const {
      width = maxWidth,
      size = 9,
      color = muted,
      weight = 'normal',
      lineHeight = 5
    } = options;

    setText(color, size, weight);

    const lines = doc.splitTextToSize(
      String(text ?? ''),
      width
    );

    for (const content of lines) {
      addPageIfNeeded(lineHeight + 2);

      setText(color, size, weight);
      doc.text(String(content), left, y);

      y += lineHeight;
    }
  };

  const addSectionTitle = (title) => {
    addPageIfNeeded(18);

    setText(dark, 12, 'bold');
    doc.text(title, left, y);

    y += 9;
  };

  // ========================================
  // CABECERA DEL DOCUMENTO
  // ========================================

  // Colocamos todos los textos en filas
  // independientes para evitar superposición.

  setText(dark, 23, 'bold');
  doc.text('NICA S-MART', left, y);

  y += 7;

  setText(blue, 9, 'bold');
  doc.text('TECH STORE - NICARAGUA', left, y);

  y += 12;

  setText(dark, 15, 'bold');
  doc.text('COMPROBANTE DIGITAL', left, y);

  y += 7;

  setText(muted, 9);
  doc.text(`Pedido #${order.id}`, left, y);

  y += 9;

  line();

  y += 11;

  // ========================================
  // DATOS DEL CLIENTE
  // ========================================

  addSectionTitle('Datos del cliente');

  addParagraph(
    `Nombre: ${order.customer_name || 'Cliente'}`
  );

  addParagraph(
    `Correo: ${order.customer_email || 'No indicado'}`
  );

  addParagraph(
    `Telefono: ${order.customer_phone || 'No indicado'}`
  );

  addParagraph(
    `Direccion: ${order.customer_address || 'No indicada'}`
  );

  y += 5;

  addPageIfNeeded(12);
  line();

  y += 10;

  // ========================================
  // INFORMACIÓN DEL PEDIDO
  // ========================================

  addSectionTitle('Informacion del pedido');

  addParagraph(
    `Fecha: ${formatDate(order.created_at)}`
  );

  addParagraph(
    `Numero de pedido: #${order.id}`
  );

  addParagraph(
    `Estado: ${orderLabel(order.status)}`
  );

  addParagraph(
    `Metodo: ${paymentLabel(order.payment_method)}`
  );

  if (order.payment_card_brand) {
    addParagraph(
      `Tarjeta: ${cardLabel(order.payment_card_brand)}`
    );
  }

  addParagraph(
    'Estado del pago: No se realizo un cobro bancario'
  );

  y += 5;

  addPageIfNeeded(12);
  line();

  y += 10;

  // ========================================
  // DETALLE DE PRODUCTOS
  // ========================================

  addSectionTitle('Detalle de productos');

  const items = getItems(order.items);

  const drawTableHeader = () => {
    addPageIfNeeded(16);

    doc.setFillColor(241, 245, 249);
    doc.rect(
      left,
      y - 5,
      maxWidth,
      10,
      'F'
    );

    setText(dark, 9, 'bold');

    doc.text('Producto', left + 3, y + 1);
    doc.text('Cant.', 126, y + 1);

    doc.text(
      'Importe',
      right - 3,
      y + 1,
      { align: 'right' }
    );

    y += 14;
  };

  drawTableHeader();

  if (items.length === 0) {
    addParagraph('No hay productos registrados.');
    y += 4;
  }

  for (const item of items) {
    const quantity = Number(item.quantity) || 1;
    const price = Number(item.price) || 0;
    const amount = price * quantity;

    const name = String(
      item.product_name ||
      item.name ||
      'Producto'
    );

    setText(dark, 9);

    const nameLines = doc.splitTextToSize(
      name,
      91
    );

    let remainingLines = [...nameLines];

    // Divide productos con descripciones
    // extensas entre páginas sin pisar totales.
    while (remainingLines.length > 0) {
      const availableHeight =
        pageHeight - 23 - y;

      const maxLines = Math.max(
        1,
        Math.floor(
          (availableHeight - 5) / 5
        )
      );

      const portion = remainingLines.splice(
        0,
        maxLines
      );

      const rowHeight = Math.max(
        12,
        portion.length * 5 + 4
      );

      if (addPageIfNeeded(rowHeight + 4)) {
        drawTableHeader();
      }

      setText(dark, 9);

      doc.text(
        portion,
        left + 3,
        y
      );

      if (
        remainingLines.length === 0
      ) {
        doc.text(
          String(quantity),
          128,
          y
        );

        doc.text(
          money(amount),
          right - 3,
          y,
          { align: 'right' }
        );
      }

      y += rowHeight;

      line();
      y += 5;

      if (remainingLines.length > 0) {
        doc.addPage();
        y = 20;
        drawTableHeader();
      }
    }
  }

  y += 8;

  // ========================================
  // TOTALES
  // ========================================

  addPageIfNeeded(55);

  const drawTotal = (
    label,
    value,
    strong = false
  ) => {
    setText(
      strong ? blue : muted,
      strong ? 12 : 10,
      strong ? 'bold' : 'normal'
    );

    doc.text(label, 112, y);

    doc.text(
      money(value),
      right,
      y,
      { align: 'right' }
    );

    y += strong ? 11 : 8;
  };

  drawTotal(
    'Subtotal',
    order.subtotal
  );

  drawTotal(
    'Envio',
    order.shipping
  );

  drawTotal(
    'TOTAL',
    order.total,
    true
  );

  y += 7;

  // ========================================
  // AVISO LEGAL
  // ========================================

  addPageIfNeeded(40);

  doc.setFillColor(239, 246, 255);

  doc.roundedRect(
    left,
    y - 5,
    maxWidth,
    25,
    3,
    3,
    'F'
  );

  setText(dark, 9, 'bold');

  doc.text(
    'IMPORTANTE',
    left + 5,
    y + 1
  );

  setText(muted, 8);

  doc.text(
    'Documento de demostracion. No es factura fiscal.',
    left + 5,
    y + 8
  );

  doc.text(
    'No acredita un pago bancario real.',
    left + 5,
    y + 14
  );

  y += 35;

  // ========================================
  // DESPEDIDA
  // ========================================

  addPageIfNeeded(20);

  setText(dark, 11, 'bold');

  doc.text(
    'Gracias por elegir NICA S-MART',
    pageWidth / 2,
    y,
    { align: 'center' }
  );

  y += 7;

  setText(muted, 8);

  doc.text(
    'NICA S-MART - TECH STORE',
    pageWidth / 2,
    y,
    { align: 'center' }
  );

  // ========================================
  // NÚMEROS DE PÁGINA
  // ========================================

  const totalPages =
    doc.getNumberOfPages();

  for (
    let page = 1;
    page <= totalPages;
    page++
  ) {
    doc.setPage(page);

    setText(muted, 8);

    doc.text(
      `Pagina ${page} de ${totalPages}`,
      right,
      pageHeight - 10,
      { align: 'right' }
    );
  }

  doc.save(
    `NICA-SMART-Pedido-${order.id}.pdf`
  );
}

// ==========================================
// COMPONENTE INVOICE
// ==========================================

function Invoice() {
  const { id } = useParams();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // ========================================
  // CARGAR PEDIDO DESDE EL BACKEND
  // ========================================

  useEffect(() => {
    const controller =
      new AbortController();

    const loadInvoice = async () => {
      setLoading(true);
      setError('');
      setOrder(null);

      try {
        const token =
          localStorage.getItem('token');

        if (!token) {
          throw new Error(
            'Debés iniciar sesión para ver tu comprobante.'
          );
        }

        if (!/^\d+$/.test(String(id || ''))) {
          throw new Error(
            'Número de pedido inválido.'
          );
        }

        const response = await fetch(
          `${API_URL}/api/orders/${encodeURIComponent(id)}`,
          {
            headers: {
              Authorization: `Bearer ${token}`
            },
            signal: controller.signal
          }
        );

        const data = await response
          .json()
          .catch(() => ({}));

        if (!response.ok) {
          throw new Error(
            data.message ||
            data.error ||
            'No se pudo cargar el comprobante.'
          );
        }

        if (!controller.signal.aborted) {
          setOrder(data.order || data);
        }

      } catch (err) {
        if (err.name !== 'AbortError') {
          setError(
            err.message || 'Error inesperado.'
          );
        }

      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    loadInvoice();

    return () => controller.abort();
  }, [id]);

  const items = getItems(order?.items);

  // ========================================
  // INTERFAZ
  // ========================================

  return (
    <>
      <Header />
      <Navbar />

      <main className="invoice-page">

        {/* ================================
            BARRA DE ACCIONES
        ================================ */}

        <div className="invoice-toolbar">

          <Link
            to="/my-orders"
            className="invoice-back"
          >
            ← Mis pedidos
          </Link>

          {order && (
            <button
              type="button"
              className="invoice-download"
              onClick={() =>
                downloadInvoicePDF(order)
              }
            >
              Descargar PDF
            </button>
          )}

        </div>

        {/* ================================
            CARGANDO
        ================================ */}

        {loading && (
          <div
            className="invoice-message"
            role="status"
          >
            Cargando comprobante...
          </div>
        )}

        {/* ================================
            ERRORES
        ================================ */}

        {!loading && error && (
          <div
            className="invoice-message invoice-error"
            role="alert"
          >
            <h2>
              No se pudo abrir el comprobante
            </h2>

            <p>{error}</p>

            <Link to="/my-orders">
              Volver a mis pedidos
            </Link>
          </div>
        )}

        {/* ================================
            FACTURA
        ================================ */}

        {!loading && order && (
          <article className="invoice-paper">

            {/* ENCABEZADO */}

            <header className="invoice-header">

              <div className="invoice-brand">
                <h1>
                  NICA <span>S-MART</span>
                </h1>

                <p>
                  TECH STORE · MANAGUA, NICARAGUA
                </p>
              </div>

              <div className="invoice-heading-right">
                <h2>
                  COMPROBANTE DIGITAL
                </h2>

                <p>
                  Pedido #{order.id}
                </p>

                <span className="invoice-demo-badge">
                  MODELO NO FISCAL
                </span>
              </div>

            </header>

            <div className="invoice-divider" />

            {/* DATOS GENERALES */}

            <div className="invoice-information">

              <section>
                <h3>
                  Datos del emisor
                </h3>

                <p>
                  <strong>
                    NICA S-MART
                  </strong>
                </p>

                <p>Tech Store</p>
                <p>Managua, Nicaragua</p>
                <p>Proyecto académico</p>
              </section>

              <section>
                <h3>
                  Información del pedido
                </h3>

                <p>
                  Pedido: #{order.id}
                </p>

                <p>
                  Fecha: {formatDate(order.created_at)}
                </p>

                <p>
                  Moneda: NIO (C$)
                </p>

                <p>
                  Estado: {orderLabel(order.status)}
                </p>
              </section>

            </div>

            {/* CLIENTE */}

            <section className="invoice-customer">
              <h3>
                Facturado a
              </h3>

              <strong>
                {order.customer_name || 'Cliente'}
              </strong>

              <p>
                {order.customer_email || 'Sin correo'}
              </p>

              <p>
                {order.customer_phone || 'Sin teléfono'}
              </p>

              <p>
                {order.customer_address || 'Sin dirección'}
              </p>
            </section>

            {/* PRODUCTOS */}

            <section className="invoice-products">
              <h3>
                Detalle de productos
              </h3>

              <div className="invoice-table-scroll">
                <table>
                  <thead>
                    <tr>
                      <th>Descripción</th>
                      <th>Cantidad</th>
                      <th>Precio unitario</th>
                      <th>Importe</th>
                    </tr>
                  </thead>

                  <tbody>
                    {items.length === 0 ? (
                      <tr>
                        <td colSpan={4}>
                          No hay productos registrados.
                        </td>
                      </tr>
                    ) : (
                      items.map((item, index) => {
                        const quantity =
                          Number(item.quantity) || 1;

                        const price =
                          Number(item.price) || 0;

                        const name =
                          item.product_name ||
                          item.name ||
                          'Producto';

                        return (
                          <tr
                            key={`${item.product_id || index}-${index}`}
                          >
                            <td data-label="Descripción">
                              {name}
                            </td>

                            <td data-label="Cantidad">
                              {quantity}
                            </td>

                            <td data-label="Precio unitario">
                              {money(price)}
                            </td>

                            <td data-label="Importe">
                              {money(price * quantity)}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            {/* TOTALES */}

            <div className="invoice-totals-container">
              <div className="invoice-totals">

                <div>
                  <span>Subtotal</span>
                  <strong>
                    {money(order.subtotal)}
                  </strong>
                </div>

                <div>
                  <span>Entrega</span>
                  <strong>
                    {money(order.shipping)}
                  </strong>
                </div>

                <div className="invoice-total">
                  <span>
                    Total del pedido
                  </span>

                  <strong>
                    {money(order.total)}
                  </strong>
                </div>

              </div>
            </div>

            {/* INFORMACIÓN DE PAGO */}

            <section className="invoice-payment">
              <h3>
                Información de pago
              </h3>

              <p>
                Método: {paymentLabel(order.payment_method)}
              </p>

              {order.payment_card_brand && (
                <p>
                  Tipo de tarjeta:{' '}
                  {cardLabel(order.payment_card_brand)}
                </p>
              )}

              <p>
                Referencia:{' '}
                {order.payment_reference || 'N/A'}
              </p>

              <p className="invoice-unpaid">
                No se realizó un cobro bancario real.
              </p>
            </section>

            {/* PIE DE FACTURA */}

            <footer className="invoice-footer">
              <h3>
                ¡Gracias por elegir NICA S-MART!
              </h3>

              <p>
                Este comprobante corresponde al registro
                de un pedido de demostración.
              </p>

              <p>
                No constituye una factura fiscal ni acredita
                el pago de los productos.
              </p>
            </footer>

          </article>
        )}

      </main>

      <Footer />
    </>
  );
}

export default Invoice;
