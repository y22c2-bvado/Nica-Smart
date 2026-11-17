
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { jsPDF } from 'jspdf';

import Header from '../components/Header';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

import '../styles/invoice.css';

const API_URL = String(
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV ? 'http://localhost:3000' : '')
).trim().replace(/\/+$/, '');

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

function downloadInvoicePDF(order) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = 210;
  const left = 18;
  const right = 192;
  const maxWidth = right - left;

  let y = 20;

  const blue = [21, 101, 216];
  const dark = [18, 24, 38];
  const muted = [100, 116, 139];

  const setText = (color, size, weight = 'normal') => {
    doc.setTextColor(...color);
    doc.setFont('helvetica', weight);
    doc.setFontSize(size);
  };

  const line = () => {
    doc.setDrawColor(226, 232, 240);
    doc.line(left, y, right, y);
  };

  const addPageIfNeeded = (required = 12) => {
    if (y + required > 270) {
      doc.addPage();
      y = 20;
    }
  };

  const addParagraph = (text, options = {}) => {
    const {
      width = maxWidth,
      size = 9,
      color = muted,
      weight = 'normal',
      lineHeight = 5
    } = options;

    setText(color, size, weight);

    const lines = doc.splitTextToSize(
      String(text || ''),
      width
    );

    addPageIfNeeded(lines.length * lineHeight);

    doc.text(lines, left, y);
    y += lines.length * lineHeight;
  };

  // CABECERA

  setText(dark, 23, 'bold');
  doc.text('NICA S-MART', left, y);

  y += 7;
  setText(blue, 9, 'bold');
  doc.text('TECH STORE - NICARAGUA', left, y);

  setText(dark, 15, 'bold');
  doc.text('COMPROBANTE DIGITAL', right, 20, {
    align: 'right'
  });

  setText(muted, 9);
  doc.text(
    `Pedido #${order.id}`,
    right,
    27,
    { align: 'right' }
  );

  y += 12;
  line();
  y += 10;

  // DATOS DEL CLIENTE

  setText(dark, 12, 'bold');
  doc.text('Datos del cliente', left, y);

  y += 8;

  addParagraph(`Nombre: ${order.customer_name || 'Cliente'}`);
  addParagraph(`Correo: ${order.customer_email || 'No indicado'}`);
  addParagraph(`Telefono: ${order.customer_phone || 'No indicado'}`);

  addParagraph(
    `Direccion: ${order.customer_address || 'No indicada'}`
  );

  y += 5;
  line();
  y += 10;

  // INFORMACIÓN DEL PEDIDO

  setText(dark, 12, 'bold');
  doc.text('Informacion del pedido', left, y);

  y += 8;

  addParagraph(`Fecha: ${formatDate(order.created_at)}`);
  addParagraph(`Numero de pedido: #${order.id}`);
  addParagraph(`Estado: ${orderLabel(order.status)}`);
  addParagraph(`Metodo: ${paymentLabel(order.payment_method)}`);

  if (order.payment_card_brand) {
    addParagraph(
      `Tarjeta: ${cardLabel(order.payment_card_brand)}`
    );
  }

  addParagraph('Estado del pago: No se realizo un cobro bancario');

  y += 5;
  line();
  y += 10;

  // PRODUCTOS

  setText(dark, 12, 'bold');
  doc.text('Detalle de productos', left, y);
  y += 10;

  const items = getItems(order.items);

  doc.setFillColor(241, 245, 249);
  doc.rect(left, y - 5, maxWidth, 10, 'F');

  setText(dark, 9, 'bold');
  doc.text('Producto', left + 3, y + 1);
  doc.text('Cant.', 125, y + 1);
  doc.text('Importe', right - 3, y + 1, {
    align: 'right'
  });

  y += 14;

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

    const nameLines = doc.splitTextToSize(name, 91);
    const rowHeight = Math.max(12, nameLines.length * 5 + 4);

    addPageIfNeeded(rowHeight + 5);

    doc.text(nameLines, left + 3, y);
    doc.text(String(quantity), 128, y);
    doc.text(money(amount), right - 3, y, {
      align: 'right'
    });

    y += rowHeight;
    line();
    y += 5;
  }

  y += 8;
  addPageIfNeeded(48);

  // TOTALES

  const drawTotal = (label, value, strong = false) => {
    setText(
      strong ? blue : muted,
      strong ? 13 : 10,
      strong ? 'bold' : 'normal'
    );

    doc.text(label, 122, y);

    doc.text(money(value), right, y, {
      align: 'right'
    });

    y += strong ? 11 : 8;
  };

  drawTotal('Subtotal', order.subtotal);
  drawTotal('Envio', order.shipping);
  drawTotal('TOTAL', order.total, true);

  y += 8;
  addPageIfNeeded(30);

  doc.setFillColor(239, 246, 255);
  doc.roundedRect(left, y - 5, maxWidth, 23, 3, 3, 'F');

  setText(dark, 9, 'bold');
  doc.text('IMPORTANTE', left + 5, y + 1);

  setText(muted, 8);
  doc.text(
    'Documento de demostracion. No es factura fiscal.',
    left + 5,
    y + 8
  );
  doc.text(
    'No acredita un pago bancario real.',
    left + 5,
    y + 13
  );

  y += 35;
  addPageIfNeeded(15);

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

  doc.save(`NICA-SMART-Pedido-${order.id}.pdf`);
}

function Invoice() {
  const { id } = useParams();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const controller = new AbortController();

    const loadInvoice = async () => {
      setLoading(true);
      setError('');

      try {
        const token = localStorage.getItem('token');

        if (!token) {
          throw new Error(
            'Debés iniciar sesión para ver tu comprobante.'
          );
        }

        if (!/^\d+$/.test(String(id || ''))) {
          throw new Error('Número de pedido inválido.');
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

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(
            data.message ||
            'No se pudo cargar el comprobante.'
          );
        }

        setOrder(data);
      } catch (err) {
        if (err.name !== 'AbortError') {
          setError(err.message || 'Error inesperado.');
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

  return (
    <>
      <Header />
      <Navbar />

      <main className="invoice-page">
        <div className="invoice-toolbar">
          <Link to="/orders" className="invoice-back">
            ← Mis pedidos
          </Link>

          {order && (
            <button
              type="button"
              className="invoice-download"
              onClick={() => downloadInvoicePDF(order)}
            >
              ↓ Descargar PDF
            </button>
          )}
        </div>

        {loading && (
          <div className="invoice-message">
            Cargando comprobante...
          </div>
        )}

        {!loading && error && (
          <div className="invoice-message invoice-error">
            <h2>No se pudo abrir el comprobante</h2>
            <p>{error}</p>
            <Link to="/orders">Volver a mis pedidos</Link>
          </div>
        )}

        {!loading && order && (
          <article className="invoice-paper">
            <header className="invoice-header">
              <div>
                <h1>
                  NICA <span>S-MART</span>
                </h1>
                <p>TECH STORE · MANAGUA, NICARAGUA</p>
              </div>

              <div className="invoice-heading-right">
                <h2>COMPROBANTE DIGITAL</h2>
                <p>Pedido #{order.id}</p>
                <span className="invoice-demo-badge">
                  MODELO NO FISCAL
                </span>
              </div>
            </header>

            <div className="invoice-divider" />

            <div className="invoice-information">
              <section>
                <h3>Datos del emisor</h3>
                <p><strong>NICA S-MART</strong></p>
                <p>Tech Store</p>
                <p>Managua, Nicaragua</p>
                <p>Proyecto académico</p>
              </section>

              <section>
                <h3>Información del pedido</h3>
                <p>Pedido: #{order.id}</p>
                <p>Fecha: {formatDate(order.created_at)}</p>
                <p>Moneda: NIO (C$)</p>
                <p>Estado: {orderLabel(order.status)}</p>
              </section>
            </div>

            <section className="invoice-customer">
              <h3>Facturado a</h3>
              <strong>{order.customer_name || 'Cliente'}</strong>
              <p>{order.customer_email || 'Sin correo'}</p>
              <p>{order.customer_phone || 'Sin teléfono'}</p>
              <p>{order.customer_address || 'Sin dirección'}</p>
            </section>

            <section className="invoice-products">
              <h3>Detalle de productos</h3>

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
                    {items.map((item, index) => {
                      const quantity = Number(item.quantity) || 1;
                      const price = Number(item.price) || 0;

                      return (
                        <tr key={`${item.product_id}-${index}`}>
                          <td>
                            {item.product_name ||
                              item.name ||
                              'Producto'}
                          </td>

                          <td>{quantity}</td>

                          <td>{money(price)}</td>

                          <td>
                            {money(price * quantity)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>

            <div className="invoice-totals-container">
              <div className="invoice-totals">
                <div>
                  <span>Subtotal</span>
                  <strong>{money(order.subtotal)}</strong>
                </div>

                <div>
                  <span>Entrega</span>
                  <strong>{money(order.shipping)}</strong>
                </div>

                <div className="invoice-total">
                  <span>Total del pedido</span>
                  <strong>{money(order.total)}</strong>
                </div>
              </div>
            </div>

            <section className="invoice-payment">
              <h3>Información de pago</h3>

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
                Referencia: {order.payment_reference || 'N/A'}
              </p>

              <p className="invoice-unpaid">
                No se realizó un cobro bancario real.
              </p>
            </section>

            <footer className="invoice-footer">
              <h3>¡Gracias por elegir NICA S-MART!</h3>

              <p>
                Este comprobante corresponde al registro de
                un pedido de demostración.
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
