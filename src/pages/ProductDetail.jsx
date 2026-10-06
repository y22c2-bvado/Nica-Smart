import { useState,useEffect } from 'react'
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

  // Mientras carga
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

  // Si no existe el producto
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

  const productImage =
    product.images?.[0] || product.image

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

          <div className="product-detail-main-image">
            <img
              src={productImage}
              alt={product.name}
            />
          </div>

        </section>

        <section className="product-detail-info">

          <p className="detail-category">
            {product.category}
          </p>

          <h1>
            {product.name}
          </h1>

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