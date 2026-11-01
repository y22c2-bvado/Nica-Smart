
import { Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { getProducts } from '../services/api'

// Componentes existentes
import Header from '../components/Header'
import Navbar from '../components/Navbar'
import Hero from '../components/Hero'
import CategoryCard from '../components/CategoryCard'
import ProductCard from '../components/ProductCard'
import Footer from '../components/Footer'

// Sistema de promociones automáticas
import SeasonalBanner from '../components/SeasonalBanner'
import useSeasonalPromotion from '../Hooks/useSeasonalPromotion'

// Estilos existentes
import '../styles/home.css'
import '../styles/products.css'

function Home() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)

  // Detectar automáticamente la temporada en Nicaragua
  const campaign = useSeasonalPromotion()

  useEffect(() => {
    let active = true

    getProducts()
      .then((data) => {
        if (active) {
          setProducts(Array.isArray(data) ? data : [])
        }
      })
      .catch((err) => {
        console.error('Error cargando productos:', err)
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [])

  const categories = [
    {
      id: 1,
      icon: '🎧',
      name: 'Audio',
    },
    {
      id: 2,
      icon: '🔌',
      name: 'Cargadores',
    },
    {
      id: 3,
      icon: '⌚',
      name: 'Relojes',
    },
    {
      id: 4,
      icon: '💻',
      name: 'Computación',
    },
    {
      id: 5,
      icon: '🎮',
      name: 'Gaming',
    },
    {
      id: 6,
      icon: '🔗',
      name: 'Cables',
    },
  ]

  const featuredProducts = products.slice(0, 8)

  return (
    <>
      <Header />

      <Navbar />

      <main>

        {/* BANNER PRINCIPAL AUTOMÁTICO */}
        {campaign ? (
          <SeasonalBanner campaign={campaign} />
        ) : (
          <Hero />
        )}

        {/* ACCESO A PROMOCIONES DE TEMPORADA */}
        {campaign && (
          <section className="home-seasonal-promo">
            <div className="home-seasonal-promo-info">
              <span className="home-seasonal-label">
                ✨ PROMOCIÓN DE TEMPORADA
              </span>

              <h2>
                Descubre nuestras ofertas de {campaign.name}
              </h2>

              <p>
                {campaign.description}
              </p>
            </div>

            <Link
              to="/promotions"
              className="home-seasonal-link"
            >
              Ver promociones →
            </Link>
          </section>
        )}

        {/* CATEGORÍAS */}
        <section className="categories-section">

          <div className="categories-title">
            <h2>Categorías</h2>

            <Link
              to="/categories"
              className="view-all-link"
            >
              Ver todas
            </Link>
          </div>

          <div className="categories">
            {categories.map((category) => (
              <CategoryCard
                key={category.id}
                icon={category.icon}
                name={category.name}
              />
            ))}
          </div>

        </section>

        {/* PRODUCTOS DESTACADOS */}
        <section className="products-section">

          <div className="products-title">
            <div>
              <h2>Productos destacados</h2>

              <p>
                Encuentra accesorios y dispositivos
                tecnológicos seleccionados para ti.
              </p>
            </div>

            <Link
              to="/products"
              className="view-all-link"
            >
              Ver todos
            </Link>
          </div>

          {loading ? (
            <p>Cargando productos...</p>
          ) : (
            <div className="products-grid">
              {featuredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                />
              ))}
            </div>
          )}

        </section>

      </main>

      <Footer />
    </>
  )
}

export default Home
