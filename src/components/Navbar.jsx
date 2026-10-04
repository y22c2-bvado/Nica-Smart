import { Link } from 'react-router-dom'

import '../styles/navbar.css'

function Navbar() {
  return (
    <nav className="navbar">

      <Link to="/">
        Inicio
      </Link>

      <Link to="/categories">
        Todas las categorías
      </Link>

      <Link to="/promotions">
        Promociones
      </Link>

      <Link to="/new-products">
        Nuevos
      </Link>

      <Link to="/brands">
        Marcas
      </Link>

      <Link to="/contact">
        Contacto
      </Link>

    </nav>
  )
}

export default Navbar