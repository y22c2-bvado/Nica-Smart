
import { Link } from 'react-router-dom'
import {
  FiHelpCircle,
  FiTruck,
  FiCreditCard,
  FiShoppingBag,
  FiMessageCircle,
  FiArrowRight
} from 'react-icons/fi'

import Header from '../components/Header'
import Navbar from '../components/Navbar'
import Footer, {
  getWhatsAppLink
} from '../components/Footer'

import './SupportPages.css'

const questions = [
  {
    question: '¿Cómo puedo realizar una compra?',
    answer:
      'Explorá nuestro catálogo, seleccioná tus productos, agregalos al carrito y continuá con el proceso de compra.'
  },
  {
    question: '¿Cómo consulto el estado de mi pedido?',
    answer:
      'Iniciá sesión con tu cuenta y entrá a Mis pedidos para consultar la información disponible sobre tus compras.'
  },
  {
    question: '¿Puedo consultar la disponibilidad?',
    answer:
      'Sí. Podés comunicarte con NICA S-MART por WhatsApp para consultar la disponibilidad de cualquier producto.'
  },
  {
    question: '¿Cómo solicito un cambio o devolución?',
    answer:
      'Visitá la sección Cambios y devoluciones o contactá con nuestro equipo para recibir asistencia.'
  },
  {
    question: '¿Qué métodos de pago aceptan?',
    answer:
      'Los métodos de pago disponibles deben confirmarse durante el proceso de compra o directamente con nuestro equipo.'
  }
]

function Help() {
  return (
    <>
      <Header />
      <Navbar />

      <main className="support-page">
        <section className="support-hero">
          <span> CENTRO DE ASISTENCIA </span>
          <h1>¿En qué podemos ayudarte?</h1>
          <p>
            Encontrá respuestas a tus preguntas y
            recibí asistencia con tus compras en
            NICA S-MART.
          </p>
        </section>

        <section className="support-container">
          <div className="support-heading">
            <h2>¿Qué necesitás?</h2>
            <p>
              Seleccioná una opción para encontrar
              información sobre tu compra.
            </p>
          </div>

          <div className="support-grid">
            <Link
              to="/products"
              className="support-card"
            >
              <FiShoppingBag />
              <h3>Productos</h3>
              <p>
                Explorá nuestro catálogo de tecnología
                y accesorios.
              </p>
              <span>Ver productos <FiArrowRight /></span>
            </Link>

            <Link
              to="/tracking"
              className="support-card"
            >
              <FiTruck />
              <h3>Seguimiento de pedido</h3>
              <p>
                Consultá la información de tus
                compras realizadas.
              </p>
              <span>Mis pedidos <FiArrowRight /></span>
            </Link>

            <Link
              to="/checkout"
              className="support-card"
            >
              <FiCreditCard />
              <h3>Finalizar compra</h3>
              <p>
                Accedé al proceso de pago
                de tu carrito.
              </p>
              <span>Ir a pagar <FiArrowRight /></span>
            </Link>

            <Link
              to="/contact"
              className="support-card"
            >
              <FiMessageCircle />
              <h3>Contacto</h3>
              <p>
                Contactanos por Facebook,
                Instagram o WhatsApp.
              </p>
              <span>Contactar <FiArrowRight /></span>
            </Link>
          </div>

          <div className="support-heading">
            <h2>
              <FiHelpCircle /> Preguntas frecuentes
            </h2>
            <p>
              Resolvemos las dudas más comunes
              de nuestros clientes.
            </p>
          </div>

          <div className="support-faq">
            {questions.map((item, index) => (
              <details key={index}>
                <summary>{item.question}</summary>
                <p>{item.answer}</p>
              </details>
            ))}
          </div>

          <div className="support-contact">
            <h2>¿Necesitás atención personalizada?</h2>
            <p>
              Nuestro equipo puede ayudarte con
              información sobre productos y pedidos.
            </p>

            <a
              href={getWhatsAppLink()}
              target="_blank"
              rel="noopener noreferrer"
              className="support-button"
            >
              <FiMessageCircle />
              Escribir por WhatsApp
            </a>
          </div>
        </section>
      </main>

      <Footer />
    </>
  )
}

export default Help
