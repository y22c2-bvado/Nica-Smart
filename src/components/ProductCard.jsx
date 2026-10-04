import { Link, useNavigate } from 'react-router-dom'

import { useCart } from '../context/CartContext'

import '../styles/products.css'

function ProductCard({ product }) {
  const navigate = useNavigate()

  const { addToCart } = useCart()

  const previewImage =
    product.images?.[0] || product.image

  const handleAddToCart = () => {
    addToCart(product, 1)

    navigate('/cart')
  }

  return (
    <article className="product-card">

      <Link
        to={`/product/${product.id}`}
        className="product-image-link"
      >
        <div className="product-image">

          <img
            src={previewImage}
            alt={product.name}
          />

          <span className="product-stock-badge">
            {product.stock > 0 ? 'Disponible' : 'Agotado'}
          </span>

        </div>
      </Link>

      <div className="product-card-content">

        <p className="product-category">
          {product.category}
        </p>

        <Link
          to={`/product/${product.id}`}
          className="product-name-link"
        >
          <h3>
            {product.name}
          </h3>
        </Link>

        <div className="product-rating">
          ★★★★★
        </div>

        <p className="product-price">
          C$ {product.price.toLocaleString()}
        </p>

        <div className="product-card-actions">

          <Link
            to={`/product/${product.id}`}
            className="details-button"
          >
            Ver detalles
          </Link>

          <button
            type="button"
            className="cart-button"
            onClick={handleAddToCart}
            disabled={product.stock === 0}
          >
            🛒
          </button>

        </div>

      </div>

    </article>
  )
}

export default ProductCard