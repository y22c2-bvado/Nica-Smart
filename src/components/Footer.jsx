
import { Link } from 'react-router-dom'

import {
  FiHome,
  FiBox,
  FiGrid,
  FiTag,
  FiMail,
  FiTruck,
  FiCreditCard,
  FiHelpCircle,
  FiUser,
  FiFileText,
  FiShoppingCart,
  FiMapPin
} from 'react-icons/fi'

import {
  FaFacebookF,
  FaInstagram,
  FaWhatsapp
} from 'react-icons/fa'

import '../styles/footer.css'

// ==========================================
// REDES SOCIALES OFICIALES DE NICA S-MART
// ==========================================

export const SOCIAL_LINKS = {
  facebook:
    'https://www.facebook.com/share/14uU9zNDUQv/?mibextid=wwXIfr',

  instagram:
    'https://www.instagram.com/nic.asmart?cplk=eGE2cHkzZzQwYXo5',

  whatsappNumber: '50582740813'
}

// ==========================================
// MENSAJE AUTOMÁTICO DE WHATSAPP
// ==========================================

const WHATSAPP_MESSAGE =
  'Hola, NICA S-MART. Me gustaría recibir información sobre sus productos.'

export function getWhatsAppLink() {
  const number = SOCIAL_LINKS.whatsappNumber.replace(/\D/g, '')

  if (!number) return ''

  return `https://wa.me/${number}?text=${encodeURIComponent(
    WHATSAPP_MESSAGE
  )}`
}

// ==========================================
// COMPONENTE FOOTER
// ==========================================

function Footer() {
  const socialNetworks = [
    {
      name: 'Facebook',
      url: SOCIAL_LINKS.facebook,
      Icon: FaFacebookF
    },
    {
      name: 'Instagram',
      url: SOCIAL_LINKS.instagram,
      Icon: FaInstagram
    },
    {
      name: 'WhatsApp',
      url: getWhatsAppLink(),
      Icon: FaWhatsapp
    }
  ]

  return (
    <footer className="footer">

      <div className="footer-container">

        {/* =====================================
            MARCA NICA S-MART
        ===================================== */}

        <div className="footer-brand">

          <Link
            to="/"
            className="footer-logo"
          >
            <FiShoppingCart className="footer-logo-icon" />

            <span>
              NICA <strong>S-MART</strong>
            </span>
          </Link>

          <p className="footer-description">
            Tecnología y accesorios para
            <br />
            tu día a día.
          </p>

          {/* =====================================
              FACEBOOK, INSTAGRAM Y WHATSAPP
          ===================================== */}

          <div className="footer-social">

            {socialNetworks.map(({ name, url, Icon }) => (
              <a
                key={name}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`NICA S-MART en ${name}`}
                title={name}
              >
                <Icon />
              </a>
            ))}

          </div>

        </div>

        {/* =====================================
            INFORMACIÓN
        ===================================== */}

        <div className="footer-column">

          <h3>Información</h3>

          <div className="footer-title-line" />

          <Link to="/">
            <FiHome />
            <span>Inicio</span>
          </Link>

          <Link to="/products">
            <FiBox />
            <span>Productos</span>
          </Link>

          <Link to="/categories">
            <FiGrid />
            <span>Categorías</span>
          </Link>

          <Link to="/promotions">
            <FiTag />
            <span>Promociones</span>
          </Link>

          <Link to="/contact">
            <FiMail />
            <span>Contacto</span>
          </Link>

        </div>

        {/* =====================================
            AYUDA
        ===================================== */}

        <div className="footer-column">

          <h3>Ayuda</h3>

          <div className="footer-title-line" />

          <Link to="/shipping">
            <FiTruck />
            <span>Envíos</span>
          </Link>

          <Link to="/payment-methods">
            <FiCreditCard />
            <span>Métodos de pago</span>
          </Link>

          <Link to="/faq">
            <FiHelpCircle />
            <span>Preguntas frecuentes</span>
          </Link>

        </div>

        {/* =====================================
            MI CUENTA
        ===================================== */}

        <div className="footer-column">

          <h3>Mi cuenta</h3>

          <div className="footer-title-line" />

          <Link to="/login">
            <FiUser />
            <span>Iniciar sesión</span>
          </Link>

          <Link to="/orders">
            <FiFileText />
            <span>Mis pedidos</span>
          </Link>

          <Link to="/cart">
            <FiShoppingCart />
            <span>Carrito</span>
          </Link>

          <Link to="/tracking">
            <FiMapPin />
            <span>Seguimiento</span>
          </Link>

        </div>

      </div>

      {/* =====================================
          PARTE INFERIOR
      ===================================== */}

      <div className="footer-bottom">

        <div className="footer-bottom-container">

          <p>
            © {new Date().getFullYear()} NICA S-MART.
            Todos los derechos reservados.
          </p>

          <div className="footer-legal">

            <Link to="/terms">
              Términos y condiciones
            </Link>

            <span />

            <Link to="/privacy">
              Política de privacidad
            </Link>

            <span />

            <Link to="/returns">
              Cambios y devoluciones
            </Link>

          </div>

        </div>

      </div>

    </footer>
  )
}

export default Footer
