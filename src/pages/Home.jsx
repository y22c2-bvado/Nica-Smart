import { Link } from 'react-router-dom'

import Header from '../components/Header'
import Navbar from '../components/Navbar'
import Hero from '../components/Hero'
import CategoryCard from '../components/CategoryCard'
import ProductCard from '../components/ProductCard'
import Footer from '../components/Footer'

import products from '../data/products'

import '../styles/home.css'
import '../styles/products.css'

function Home() {
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

        <Hero />

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

        <section className="products-section">

          <div className="products-title">

            <div>
              <h2>
                Productos destacados
              </h2>

              <p>
                Encuentra accesorios y dispositivos tecnológicos
                seleccionados para ti.
              </p>
            </div>

            <Link
              to="/products"
              className="view-all-link"
            >
              Ver todos
            </Link>

          </div>

          <div className="products-grid">

            {featuredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
              />
            ))}

          </div>

        </section>

      </main>

      <Footer />
    </>
  )
}

export default Home