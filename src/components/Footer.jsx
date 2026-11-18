
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
  FiMapPin,
  FiShield,
  FiTrash2
} from 'react-icons/fi'

import {
  FaFacebookF,
  FaInstagram,
  FaWhatsapp
} from 'react-icons/fa'

import '../styles/footer.css'

// ==========================================
// NICA S-MART - FOOTER RESPONSIVE
// ==========================================

// ==========================================
// 1. REDES SOCIALES OFICIALES
// ==========================================

export const SOCIAL_LINKS = {
  facebook:
    'https://www.facebook.com/share/14uU9zNDUQv/?mibextid=wwXIfr',

  instagram:
    'https://www.instagram.com/nic.asmart?cplk=eGE2cHkzZzQwYXo5',

  whatsappNumber: '50582740813'
}

// ==========================================
// 2. MENSAJE AUTOMÁTICO DE WHATSAPP
// ==========================================

const WHATSAPP_MESSAGE =
  'Hola, NICA S-MART. Me gustaría recibir información sobre sus productos.'

export function getWhatsAppLink() {
  const number = String(
    SOCIAL_LINKS.whatsappNumber || ''
  ).replace(/\D/g, '')

  if (!number) {
    return ''
  }

  return `https://wa.me/${number}?text=${encodeURIComponent(
    WHATSAPP_MESSAGE
  )}`
}

// ==========================================
// 3. CONFIGURACIÓN DE REDES SOCIALES
// ==========================================

const SOCIAL_NETWORKS = [
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

// ==========================================
// 4. ENLACES DE INFORMACIÓN
// ==========================================

const INFORMATION_LINKS = [
  {
    to: '/',
    label: 'Inicio',
    Icon: FiHome
  },
  {
    to: '/products',
    label: 'Productos',
    Icon: FiBox
  },
  {
    to: '/categories',
    label: 'Categorías',
    Icon: FiGrid
  },
  {
    to: '/promotions',
    label: 'Promociones',
    Icon: FiTag
  },
  {
    to: '/contact',
    label: 'Contacto',
    Icon: FiMail
  }
]

// ==========================================
// 5. ENLACES DE AYUDA
// ==========================================

const HELP_LINKS = [
  {
    to: '/shipping',
    label: 'Envíos',
    Icon: FiTruck
  },
  {
    to: '/payment-methods',
    label: 'Métodos de pago',
    Icon: FiCreditCard
  },
  {
    to: '/faq',
    label: 'Preguntas frecuentes',
    Icon: FiHelpCircle
  }
]

// ==========================================
// 6. ENLACES DE MI CUENTA
// ==========================================

const ACCOUNT_LINKS = [
  {
    to: '/login',
    label: 'Iniciar sesión',
    Icon: FiUser
  },
  {
    to: '/orders',
    label: 'Mis pedidos',
    Icon: FiFileText
  },
  {
    to: '/cart',
    label: 'Carrito',
    Icon: FiShoppingCart
  },
  {
    to: '/tracking',
    label: 'Seguimiento',
    Icon: FiMapPin
  }
]

// ==========================================
// 7. ENLACES LEGALES
// ==========================================

const LEGAL_LINKS = [
  {
    to: '/terms',
    label: 'Términos y condiciones',
    Icon: FiFileText
  },
  {
    to: '/privacy',
    label: 'Política de privacidad',
    Icon: FiShield
  },
  {
    to: '/data-deletion',
    label: 'Eliminación de datos',
    Icon: FiTrash2
  },
  {
    to: '/returns',
    label: 'Cambios y devoluciones',
    Icon: FiBox
  }
]

// ==========================================
// 8. COMPONENTE DE COLUMNA
// ==========================================

function FooterColumn({
  title,
  links,
  className = ''
}) {
  return (
    <nav
      className={`footer-column ${className}`}
      aria-label={title}
    >
      {/* TÍTULO */}

      <h3>
        {title}
      </h3>

      {/* LÍNEA DECORATIVA */}

      <div
        className="footer-title-line"
        aria-hidden="true"
      />

      {/* ENLACES */}

      <div className="footer-column-links">

        {links.map(({ to, label, Icon }) => (
          <Link
            key={to}
            to={to}
            className="footer-nav-link"
          >
            <Icon
              className="footer-link-icon"
              aria-hidden="true"
            />

            <span>
              {label}
            </span>
          </Link>
        ))}

      </div>
    </nav>
  )
}

// ==========================================
// 9. COMPONENTE PRINCIPAL
// ==========================================

function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="footer">

      {/* ======================================
          CONTENIDO PRINCIPAL
      ====================================== */}

      <div className="footer-container">

        {/* ====================================
            MARCA NICA S-MART
        ==================================== */}

        <div className="footer-brand">

          {/* LOGOTIPO */}

          <Link
            to="/"
            className="footer-logo"
            aria-label="NICA S-MART - Ir al inicio"
          >
            <FiShoppingCart
              className="footer-logo-icon"
              aria-hidden="true"
            />

            <span>
              NICA <strong>S-MART</strong>
            </span>
          </Link>

          {/* DESCRIPCIÓN */}

          <p className="footer-description">
            Tecnología y accesorios para tu día a día.
          </p>

          {/* REDES SOCIALES */}

          <div
            className="footer-social"
            aria-label="Redes sociales de NICA S-MART"
          >

            {SOCIAL_NETWORKS.map(
              ({ name, url, Icon }) => (
                <a
                  key={name}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`NICA S-MART en ${name}`}
                  title={name}
                  className="footer-social-link"
                >
                  <Icon aria-hidden="true" />
                </a>
              )
            )}

          </div>

        </div>

        {/* ====================================
            INFORMACIÓN
        ==================================== */}

        <FooterColumn
          title="Información"
          links={INFORMATION_LINKS}
          className="footer-information"
        />

        {/* ====================================
            AYUDA
        ==================================== */}

        <FooterColumn
          title="Ayuda"
          links={HELP_LINKS}
          className="footer-help"
        />

        {/* ====================================
            MI CUENTA
        ==================================== */}

        <FooterColumn
          title="Mi cuenta"
          links={ACCOUNT_LINKS}
          className="footer-account"
        />

      </div>

      {/* ======================================
          PARTE INFERIOR
      ====================================== */}

      <div className="footer-bottom">

        <div className="footer-bottom-container">

          {/* DERECHOS RESERVADOS */}

          <p className="footer-copyright">
            © {currentYear} NICA S-MART.
            Todos los derechos reservados.
          </p>

          {/* ==================================
              INFORMACIÓN LEGAL
          ================================== */}

          <nav
            className="footer-legal"
            aria-label="Información legal"
          >

            {LEGAL_LINKS.map(
              ({ to, label, Icon }, index) => (
                <div
                  className="footer-legal-item"
                  key={to}
                >
                  {index > 0 && (
                    <span
                      className="footer-legal-divider"
                      aria-hidden="true"
                    />
                  )}

                  <Link
                    to={to}
                    className="footer-legal-link"
                  >
                    <Icon
                      className="footer-legal-icon"
                      aria-hidden="true"
                    />

                    <span>
                      {label}
                    </span>
                  </Link>
                </div>
              )
            )}

          </nav>

        </div>
      </div>
    </footer>
  )
}

export default Footer
