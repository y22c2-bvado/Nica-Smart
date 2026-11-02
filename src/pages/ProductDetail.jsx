import { useState, useEffect } from 'react'
import {
  useParams,
  useNavigate,
} from 'react-router-dom'

import Header from '../components/Header'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { getProductById } from '../services/api'
import { useCart } from '../context/CartContext'

import '../styles/productDetail.css'

function ProductDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { addToCart } = useCart()

  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [quantity, setQuantity] = useState(1)
  const [selectedImage, setSelectedImage] = useState('')

  useEffect(() => {
    setLoading(true)
    getProductById(id)
      .then(setProduct)
      .catch((err) => {
        console.error(err)
        setProduct(null)
      })
      .finally(() => setLoading(false))
  }, [id])

  useEffect(() => {
    if (product) {
      const imgs = product.images && product.images.length > 0 
        ? product.images 
        : (product.image ? [product.image] : []);
        
      if (imgs.length > 0) {
        setSelectedImage(imgs[0]);
      }
    }
  }, [product]);

  if (loading) {
    return (
      <>
        <Header />
        <Navbar />
        <main className="product-not-found">
          <h1>Cargando producto...</h1>
        </main>
        <Footer />
      </>
    )
  }

  if (!product) {
    return (
      <>
        <Header />
        <Navbar />
        <main className="product-not-found">
          <h1>Producto no encontrado</h1>
        </main>
        <Footer />
      </>
    )
  }

  const productImages = product.images && product.images.length > 0 
    ? product.images 
    : (product.image ? [product.image] : []);

  const increaseQuantity = () => {
    if (quantity < product.stock) {
      setQuantity(quantity + 1)
    }
  }

  const decreaseQuantity = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1)
    }
  }

  const handleAddToCart = () => {
    addToCart(product, quantity)
  }

  const handleBuyNow = () => {
    addToCart(product, quantity)
    navigate('/cart')
  }

  return (
    <>
      <Header />
      <Navbar />

      <main className="product-detail">

        <section className="product-detail-gallery">
          
          {/* IMAGEN PRINCIPAL */}
          <div className="product-detail-main-image">
            {selectedImage ? (
              <img
                src={selectedImage}
                alt={product.name}
              />
            ) : (
              <div style={{ padding: '50px', textAlign: 'center', background: '#f5f5f5', borderRadius: '8px' }}>
                Sin imagen disponible
              </div>
            )}
          </div>

          {/* MINIATURAS (Solo se muestran si hay más de 1 imagen) */}
          {productImages.length > 1 && (
            <div className="product-detail-thumbnails">
              {productImages.map((img, index) => (
                <img
                  key={index}
                  src={img}
                  alt={`${product.name} - miniatura ${index + 1}`}
                  onClick={() => setSelectedImage(img)}
                  style={{
                    width: '70px',
                    height: '70px',
                    objectFit: 'cover',
                    cursor: 'pointer',
                    border: selectedImage === img ? '2px solid #1e3a8a' : '1px solid #ddd',
                    borderRadius: '8px',
                    transition: 'all 0.2s ease'
                  }}
                />
              ))}
            </div>
          )}

        </section>

        <section className="product-detail-info">

          {/* MOSTRAR MARCA Y CATEGORÍA */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '8px' }}>
            {product.brand && (
              <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#0755d7', textTransform: 'uppercase', letterSpacing: '1px' }}>
                {product.brand}
              </span>
            )}
            
            <p className="detail-category" style={{ margin: 0 }}>
              {product.category}
            </p>
          </div>

          <h1>
            {product.name}
          </h1>

          {/* ENLACE A LA PÁGINA DE LA MARCA */}
          {product.brand_url && (
            <a 
              href={product.brand_url} 
              target="_blank" 
              rel="noopener noreferrer"
              style={{ display: 'inline-block', fontSize: '13px', color: '#0755d7', textDecoration: 'underline', marginBottom: '15px' }}
            >
              Visitar sitio web de {product.brand || 'la marca'} ↗
            </a>
          )}

          <div className="detail-rating">
            ★★★★★
          </div>

          <h2 className="detail-price">
            C$ {Number(product.price).toLocaleString()}
          </h2>

          <p className="detail-description">
            {product.description}
          </p>

          <div className="detail-stock">

            <strong>
              Disponibilidad:
            </strong>

            {product.stock > 0 ? (
              <span className="stock-available">
                En stock ({product.stock} unidades)
              </span>
            ) : (
              <span className="stock-empty">
                Agotado
              </span>
            )}

          </div>

          <div className="detail-quantity">

            <strong>
              Cantidad
            </strong>

            <div className="quantity-buttons">

              <button
                type="button"
                onClick={decreaseQuantity}
              >
                -
              </button>

              <span>
                {quantity}
              </span>

              <button
                type="button"
                onClick={increaseQuantity}
              >
                +
              </button>

            </div>

          </div>

          <div className="detail-actions">

            <button
              type="button"
              className="detail-cart-button"
              onClick={handleAddToCart}
              disabled={product.stock === 0}
            >
              Agregar al carrito
            </button>

            <button
              type="button"
              className="detail-buy-button"
              onClick={handleBuyNow}
              disabled={product.stock === 0}
            >
              Comprar ahora
            </button>

          </div>

          <div className="detail-benefits">

            <div>
              🚚

              <span>
                <strong>Envíos disponibles</strong>
                <small>Envíos a todo Nicaragua</small>
              </span>
            </div>

            <div>
              🔒

              <span>
                <strong>Compra segura</strong>
                <small>Protección de tus datos</small>
              </span>
            </div>

          </div>

        </section>

      </main>

      <Footer />
    </>
  )
}

export default ProductDetail