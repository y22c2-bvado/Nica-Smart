import { Link } from 'react-router-dom'

import '../styles/footer.css'

function Footer() {
  return (
    <footer className="footer">

      <div className="footer-content">

        <div className="footer-column">

          <h3>NICA S-MART</h3>

          <p>
            Tecnología y accesorios para tu día a día.
          </p>

        </div>

        <div className="footer-column">

          <h4>Información</h4>

          <Link to="/">
            Inicio
          </Link>

          <Link to="/products">
            Productos
          </Link>

          <Link to="/categories">
            Categorías
          </Link>

          <Link to="/products?filter=promotions">
            Promociones
          </Link>

          <Link to="/contact">
            Contacto
          </Link>

        </div>

        <div className="footer-column">

          <h4>Ayuda</h4>

          <Link to="/shipping">
            Envíos
          </Link>

          <Link to="/payment-methods">
            Métodos de pago
          </Link>

          <Link to="/faq">
            Preguntas frecuentes
          </Link>

        </div>

        <div className="footer-column">

          <h4>Mi cuenta</h4>

          <Link to="/login">
            Iniciar sesión
          </Link>

          <Link to="/orders">
            Mis pedidos
          </Link>

          <Link to="/cart">
            Carrito
          </Link>

          <Link to="/tracking">
            Seguimiento
          </Link>

        </div>

      </div>

    </footer>
  )
}

export default Footer