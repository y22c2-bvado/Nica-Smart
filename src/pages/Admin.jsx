import Header from '../components/Header'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

import '../styles/admin.css'

export default function Admin() {
  const recentOrders = [
    {
      id: 'ORD-1001',
      customer: 'Carlos López',
      total: 2490,
      status: 'Pendiente',
    },
    {
      id: 'ORD-1002',
      customer: 'María González',
      total: 1850,
      status: 'En preparación',
    },
    {
      id: 'ORD-1003',
      customer: 'José Martínez',
      total: 3200,
      status: 'Enviado',
    },
    {
      id: 'ORD-1004',
      customer: 'Ana Rivera',
      total: 1450,
      status: 'Entregado',
    },
  ]

  const lowStockProducts = [
    {
      id: 1,
      name: 'Smartwatch X1',
      stock: 5,
    },
    {
      id: 2,
      name: 'Power Bank 20,000 mAh',
      stock: 4,
    },
    {
      id: 3,
      name: 'Teclado Mecánico RGB',
      stock: 3,
    },
  ]

  return (
    <>
      <Header />
      <Navbar />

      <main className="admin-page">

        <section className="admin-header">
          <div>
            <span>PANEL ADMINISTRATIVO</span>

            <h1>Dashboard</h1>

            <p>
              Administra productos, pedidos, clientes e inventario
              desde un solo lugar.
            </p>
          </div>
        </section>

        <section className="admin-container">

          <div className="admin-menu">

            <button type="button">
              📊 Dashboard
            </button>

            <button type="button">
              📦 Productos
            </button>

            <button type="button">
              🛒 Pedidos
            </button>

            <button type="button">
              👥 Clientes
            </button>

            <button type="button">
              🏷️ Categorías
            </button>

            <button type="button">
              📋 Inventario
            </button>

            <button type="button">
              📈 Reportes
            </button>

            <button type="button">
              ⚙️ Configuración
            </button>

          </div>

          <div className="admin-content">

            <section className="admin-stats">

              <div className="stat-card">
                <div className="stat-icon">
                  💰
                </div>

                <div>
                  <span>Ventas del mes</span>
                  <h2>C$ 84,550</h2>
                  <small>+12% este mes</small>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon">
                  🛒
                </div>

                <div>
                  <span>Pedidos</span>
                  <h2>128</h2>
                  <small>14 pendientes</small>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon">
                  📦
                </div>

                <div>
                  <span>Productos</span>
                  <h2>20</h2>
                  <small>3 con bajo stock</small>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon">
                  👥
                </div>

                <div>
                  <span>Clientes</span>
                  <h2>76</h2>
                  <small>8 nuevos</small>
                </div>
              </div>

            </section>

            <section className="admin-panels">

              <div className="admin-panel">

                <div className="admin-panel-title">
                  <div>
                    <h2>Pedidos recientes</h2>

                    <p>
                      Últimas órdenes registradas.
                    </p>
                  </div>

                  <button type="button">
                    Ver todos
                  </button>
                </div>

                <div className="admin-table-container">

                  <table className="admin-table">

                    <thead>
                      <tr>
                        <th>Pedido</th>
                        <th>Cliente</th>
                        <th>Total</th>
                        <th>Estado</th>
                      </tr>
                    </thead>

                    <tbody>

                      {recentOrders.map((order) => (
                        <tr key={order.id}>

                          <td>
                            {order.id}
                          </td>

                          <td>
                            {order.customer}
                          </td>

                          <td>
                            C$ {order.total.toLocaleString()}
                          </td>

                          <td>
                            <span
                              className={`order-status ${order.status
                                .toLowerCase()
                                .replace(' ', '-')}`}
                            >
                              {order.status}
                            </span>
                          </td>

                        </tr>
                      ))}

                    </tbody>

                  </table>

                </div>

              </div>

              <div className="admin-panel">

                <div className="admin-panel-title">
                  <div>
                    <h2>Inventario bajo</h2>

                    <p>
                      Productos que requieren reposición.
                    </p>
                  </div>
                </div>

                <div className="low-stock-list">

                  {lowStockProducts.map((product) => (

                    <div
                      key={product.id}
                      className="low-stock-item"
                    >

                      <div>
                        <strong>
                          {product.name}
                        </strong>

                        <span>
                          Stock disponible
                        </span>
                      </div>

                      <div className="stock-number">
                        {product.stock}
                      </div>

                    </div>

                  ))}

                </div>

              </div>

            </section>

            <section className="admin-actions">

              <h2>Acciones rápidas</h2>

              <div className="quick-actions">

                <button type="button">
                  <span>➕</span>
                  Agregar producto
                </button>

                <button type="button">
                  <span>📦</span>
                  Gestionar inventario
                </button>

                <button type="button">
                  <span>🛒</span>
                  Revisar pedidos
                </button>

                <button type="button">
                  <span>📊</span>
                  Ver reportes
                </button>

              </div>

            </section>

          </div>

        </section>

      </main>

      <Footer />
    </>
  )
}
