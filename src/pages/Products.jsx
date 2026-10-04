import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'

import Header from '../components/Header'
import Navbar from '../components/Navbar'
import ProductCard from '../components/ProductCard'
import Footer from '../components/Footer'

import products from '../data/products'

import '../styles/products.css'

function Products() {
  const [searchParams, setSearchParams] = useSearchParams()

  const initialCategory =
    searchParams.get('category') || 'Todos'

  const [search, setSearch] = useState('')
  const [category, setCategory] = useState(initialCategory)

  const categories = [
    'Todos',
    'Audio',
    'Cargadores',
    'Cables',
    'Energía',
    'Relojes',
    'Soportes',
    'Computación',
    'Gaming',
    'Adaptadores',
  ]

  const changeCategory = (item) => {
    setCategory(item)

    if (item === 'Todos') {
      setSearchParams({})
    } else {
      setSearchParams({
        category: item,
      })
    }
  }

  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name
        .toLowerCase()
        .includes(search.toLowerCase())

    const matchesCategory =
      category === 'Todos' ||
      product.category === category

    return matchesSearch && matchesCategory
  })

  return (
    <>
      <Header />
      <Navbar />

      <main className="products-page">

        <section className="products-page-header">

          <div>
            <span>NICA S-MART</span>

            <h1>
              {category === 'Todos'
                ? 'Todos los productos'
                : category}
            </h1>

            <p>
              Explora nuestro catálogo de accesorios
              y dispositivos tecnológicos.
            </p>
          </div>

        </section>

        <section className="products-controls">

          <div className="products-search">

            <input
              type="text"
              placeholder="Buscar producto..."
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
            />

          </div>

          <div className="category-filter">

            {categories.map((item) => (

              <button
                key={item}
                type="button"
                className={
                  category === item
                    ? 'filter-button active'
                    : 'filter-button'
                }
                onClick={() =>
                  changeCategory(item)
                }
              >
                {item}
              </button>

            ))}

          </div>

        </section>

        <section className="products-section">

          <div className="products-title">

            <div>
              <h2>
                {category === 'Todos'
                  ? 'Productos'
                  : `Productos de ${category}`}
              </h2>

              <p>
                {filteredProducts.length}{' '}
                {filteredProducts.length === 1
                  ? 'producto encontrado'
                  : 'productos encontrados'}
              </p>
            </div>

          </div>

          {filteredProducts.length > 0 ? (

            <div className="products-grid">

              {filteredProducts.map((product) => (

                <ProductCard
                  key={product.id}
                  product={product}
                />

              ))}

            </div>

          ) : (

            <div className="no-products">

              <h3>
                No encontramos productos
              </h3>

              <p>
                Intenta realizar otra búsqueda
                o seleccionar otra categoría.
              </p>

            </div>

          )}

        </section>

      </main>

      <Footer />
    </>
  )
}

export default Products