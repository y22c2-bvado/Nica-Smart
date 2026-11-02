import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import Header from '../components/Header'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import ProductCard from '../components/ProductCard'

import { getProducts } from '../services/api'

import '../styles/products.css'
import './Brands.css'

function normalize(value) {
  return String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim()
}

function getSafeUrl(value) {
  try {
    if (!value) return ''
    const url = new URL(value)
    return ['http:', 'https:'].includes(url.protocol) ? url.href : ''
  } catch {
    return ''
  }
}

function normalizeProduct(product) {
  const images = product.images && product.images.length > 0 
    ? product.images 
    : (product.image ? [product.image] : []);

  return {
    ...product,
    images,
    image: images[0] || '',
    image_url: images[0] || '',
    category: typeof product.category === 'string' ? product.category : (product.category?.name || product.category_name || 'Tecnología')
  }
}

export default function Brands() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')

  useEffect(() => {
    let active = true
    async function loadBrands() {
      try {
        setLoading(true)
        setError('')
        const response = await getProducts()
        if (!active) return
        const data = Array.isArray(response) ? response : (response?.products ?? response?.data?.products ?? response?.data ?? [])
        if (!Array.isArray(data)) throw new Error('Respuesta inválida de la API')
        setProducts(data.filter(Boolean).map(normalizeProduct))
      } catch (err) {
        if (!active) return
        console.error('Error cargando marcas:', err)
        setError('No se pudieron cargar las marcas.')
      } finally {
        if (active) setLoading(false)
      }
    }
    loadBrands()
    return () => { active = false }
  }, [])

  const brands = useMemo(() => {
    const map = new Map()
    products.forEach((product) => {
      const name = String(product.brand || '').trim()
      if (!name) return
      const key = normalize(name)
      if (!map.has(key)) {
        map.set(key, { name, url: '', products: [] })
      }
      const group = map.get(key)
      group.products.push(product)
      const website = getSafeUrl(product.brand_url || product.brandUrl)
      if (!group.url && website) group.url = website
    })
    return [...map.values()].sort((a, b) => a.name.localeCompare(b.name, 'es'))
  }, [products])

  const filteredBrands = useMemo(() => {
    const term = normalize(search)
    if (!term) return brands
    return brands.filter((brand) =>
      normalize(brand.name).includes(term) || brand.products.some((product) => normalize(product.name).includes(term))
    )
  }, [brands, search])

  return (
    <>
      <Header />
      <Navbar />
      <main className="brands-page">
        <section className="brands-hero">
          <span>NICA S-MART · TECH STORE</span>
          <h1>Nuestras marcas</h1>
          <p>Descubre los fabricantes de nuestro catálogo, explora sus productos y visita sus sitios web oficiales.</p>
        </section>

        <section className="brands-container">
          <div className="brands-toolbar">
            <div>
              <h2>Explorar marcas</h2>
              <p>{brands.length} marcas registradas</p>
            </div>
            <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar marca o producto..." aria-label="Buscar marca" />
          </div>

          {loading && <p className="brands-empty">Cargando marcas...</p>}

          {!loading && error && <p className="brands-empty" role="alert">{error}</p>}

          {!loading && !error && filteredBrands.length === 0 && (
            <div className="brands-empty">
              <h3>No se encontraron marcas</h3>
              <p>Agrega una marca al crear o editar un producto desde Administración.</p>
            </div>
          )}

          {!loading && !error && (
            <div className="brands-list">
              {filteredBrands.map((brand) => (
                <section className="brands-section" key={normalize(brand.name)}>
                  <div className="brands-section-header">
                    <div>
                      <span className="brands-eyebrow">FABRICANTE</span>
                      <h2>{brand.name}</h2>
                      <p>{brand.products.length} {brand.products.length === 1 ? 'producto disponible' : 'productos disponibles'}</p>
                    </div>
                    {brand.url && (
                      <a href={brand.url} target="_blank" rel="noopener noreferrer" className="brands-website">
                        Página de {brand.name} ↗
                      </a>
                    )}
                  </div>
                  <div className="products-grid">
                    {brand.products.map((product) => (
                      <ProductCard key={product.id} product={product} />
                    ))}
                  </div>
                </section>
              ))}
            </div>
          )}

          <div className="brands-footer-link">
            <Link to="/products">Ver todos los productos →</Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}