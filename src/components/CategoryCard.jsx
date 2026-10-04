import { Link } from 'react-router-dom'
import '../styles/home.css'

function CategoryCard({ icon, name }) {
  return (
    <Link
      to={`/products?category=${encodeURIComponent(name)}`}
      className="category-card"
    >
      <div className="category-icon">
        {icon}
      </div>

      <span>{name}</span>
    </Link>
  )
}

export default CategoryCard