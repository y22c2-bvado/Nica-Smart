
import {
  FaFacebookF,
  FaInstagram,
  FaWhatsapp
} from 'react-icons/fa'

import Header from '../components/Header'
import Navbar from '../components/Navbar'
import Footer, {
  SOCIAL_LINKS,
  getWhatsAppLink
} from '../components/Footer'

import './Contact.css'

function Contact() {
  const networks = [
    {
      name: 'WhatsApp',
      description:
        'Escríbenos para consultar precios, productos y disponibilidad.',
      detail: '+505 8274 0813',
      url: getWhatsAppLink(),
      Icon: FaWhatsapp,
      className: 'contact-whatsapp'
    },
    {
      name: 'Facebook',
      description:
        'Visita nuestra página y conoce las novedades de NICA S-MART.',
      detail: 'NICA S-MART',
      url: SOCIAL_LINKS.facebook,
      Icon: FaFacebookF,
      className: 'contact-facebook'
    },
    {
      name: 'Instagram',
      description:
        'Descubre nuestros productos y novedades en Instagram.',
      detail: '@nic.asmart',
      url: SOCIAL_LINKS.instagram,
      Icon: FaInstagram,
      className: 'contact-instagram'
    }
  ]

  return (
    <>
      <Header />
      <Navbar />

      <main className="contact-page">
        <section className="contact-hero">
          <span>NICA S-MART · TECH STORE</span>
          <h1>Contáctanos</h1>
          <p>
            ¿Tenés alguna pregunta sobre nuestros productos?
            Estamos para ayudarte. Elegí tu red social favorita
            y comunicate con nosotros.
          </p>
        </section>

        <section className="contact-container">
          <div className="contact-heading">
            <span>ESTAMOS CONECTADOS</span>
            <h2>Hablemos de tecnología</h2>
            <p>
              Consultá precios, disponibilidad y novedades
              mediante nuestros canales de contacto.
            </p>
          </div>

          <div className="contact-grid">
            {networks.map((network) => {
              const Icon = network.Icon

              return (
                <article
                  key={network.name}
                  className={`contact-card ${network.className}`}
                >
                  <div className="contact-icon">
                    <Icon />
                  </div>

                  <h3>{network.name}</h3>
                  <strong>{network.detail}</strong>
                  <p>{network.description}</p>

                  <a
                    href={network.url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Contactar por {network.name} ↗
                  </a>
                </article>
              )
            })}
          </div>
        </section>
      </main>

      <Footer />
    </>
  )
}

export default Contact
