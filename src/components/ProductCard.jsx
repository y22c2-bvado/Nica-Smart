import { Link, useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import '../styles/products.css'

const API_URL = String(
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV ? 'http://localhost:3000' : '')
).trim().replace(/\/+$/, '')

function ProductCard({ product }) {
  const navigate = useNavigate()
  const { addToCart } = useCart()

  const rawImage = 
    (product.images && product.images.length > 0) 
      ? product.images[0] 
      : (product.image || null)

  const getImageUrl = (path) => {
    if (!path) return 'https://via.placeholder.com/300x300?text=Sin+Imagen'
    
    if (path.startsWith('http') || path.startsWith('data:')) return path
    
    if (path.startsWith('/uploads/')) {
      return `${API_URL}${path}`
    }
    
    return path
  }

  const previewImage = getImageUrl(rawImage)

  const price = Number(product.price)
  const originalPrice = Number(
    product.original_price ?? product.price
  )
  const hasDiscount =
    Number.isFinite(originalPrice) &&
    Number.isFinite(price) &&
    originalPrice > price
  const discount = hasDiscount
    ? Math.round(((originalPrice - price) / originalPrice) * 100)
    : 0

  const money = (n) =>
    `C$ ${Number(n).toLocaleString('es-NI', { maximumFractionDigits: 0 })}`

  const handleAddToCart = () => {
    addToCart(product, 1)
    navigate('/cart')
  }

  return (
    <article className="product-card">
      <Link to={`/product/${product.id}`} className="product-image-link">
        <div className="product-image">
          <img 
            src={previewImage} 
            alt={product.name} 
            onError={(e) => {
              e.target.src = 'https://via.placeholder.com/300x300?text=Error+de+Imagen';
            }}
          />

          {hasDiscount && (
            <span className="product-discount-badge">🔥 -{discount}%</span>
          )}

          <span className="product-stock-badge">
            {product.stock > 0 ? 'Disponible' : 'Agotado'}
          </span>
        </div>
      </Link>

      <div className="product-card-content">
        {product.brand && (
          <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#0755d7', textTransform: 'uppercase', letterSpacing: '1px', display: 'block', marginBottom: '4px' }}>
            {product.brand}
          </span>
        )}
        
        <p className="product-category">{product.category}</p>

        <Link to={`/product/${product.id}`} className="product-name-link">
          <h3>{product.name}</h3>
        </Link>

        <div className="product-rating">★★★★★</div>

        <div className="product-price-block">
          {hasDiscount && (
            <del className="product-price-original">
              {money(originalPrice)}
            </del>
          )}
          <p className="product-price">{money(price)}</p>
          {hasDiscount && (
            <span className="product-saving">
              Ahorras {money(originalPrice - price)}
            </span>
          )}
        </div>

        <div className="product-card-actions">
          <Link to={`/product/${product.id}`} className="details-button">
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