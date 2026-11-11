
import React from "react";

const Privacy = () => {
  const lastUpdated = "10 de noviembre de 2026";

  return (
    <main className="privacy-page" style={styles.page}>
      <div style={styles.container}>
        <div style={styles.header}>
          <span style={styles.badge}>NICA S-MART · TECH STORE</span>

          <h1 style={styles.title}>Política de Privacidad</h1>

          <p style={styles.subtitle}>
            En NICA S-MART valoramos la privacidad de nuestros
            clientes y nos comprometemos a tratar su información
            personal de manera responsable y transparente.
          </p>

          <p style={styles.updated}>
            Última actualización: {lastUpdated}
          </p>
        </div>

        <div style={styles.content}>
          <Section title="1. Información que recopilamos">
            <p>
              Cuando utilizás NICA S-MART, podemos recopilar
              información necesaria para administrar tu cuenta
              y procesar tus compras, incluyendo:
            </p>
            <ul>
              <li>Nombre y apellidos.</li>
              <li>Correo electrónico.</li>
              <li>Información de contacto.</li>
              <li>Dirección de entrega.</li>
              <li>Información de pedidos y compras.</li>
              <li>Identificadores de autenticación.</li>
            </ul>
          </Section>

          <Section title="2. Inicio de sesión con Google y Facebook">
            <p>
              NICA S-MART puede permitir el registro y el
              inicio de sesión mediante proveedores externos
              como Google y Facebook.
            </p>
            <p>
              Al utilizar estos servicios, podemos recibir
              información autorizada por el usuario, como su
              nombre, correo electrónico e identificador
              de cuenta.
            </p>
            <p>
              No solicitamos ni almacenamos las contraseñas
              personales de Google o Facebook.
            </p>
          </Section>

          <Section title="3. Uso de la información">
            <p>
              La información personal recopilada puede
              utilizarse para:
            </p>
            <ul>
              <li>Crear y administrar cuentas de usuario.</li>
              <li>Autenticar el acceso a la tienda.</li>
              <li>Procesar compras y pedidos.</li>
              <li>Coordinar entregas.</li>
              <li>Brindar atención al cliente.</li>
              <li>Proteger la plataforma contra accesos no autorizados.</li>
              <li>Mejorar el funcionamiento de nuestros servicios.</li>
            </ul>
          </Section>

          <Section title="4. Almacenamiento y seguridad">
            <p>
              NICA S-MART utiliza servicios tecnológicos
              para almacenar y procesar información de sus
              usuarios, incluyendo bases de datos y servicios
              de alojamiento.
            </p>
            <p>
              Procuramos aplicar medidas de seguridad
              apropiadas para reducir los riesgos de acceso
              no autorizado, alteración o pérdida de datos.
              Ningún sistema conectado a Internet puede
              garantizar una seguridad absoluta.
            </p>
          </Section>

          <Section title="5. Compartición de información">
            <p>
              Podemos compartir información con proveedores
              tecnológicos y operadores necesarios para
              ofrecer nuestros servicios, por ejemplo,
              servicios de alojamiento, autenticación,
              procesamiento de pedidos o entregas.
            </p>
            <p>
              No vendemos información personal de nuestros
              usuarios a terceros.
            </p>
          </Section>

          <Section title="6. Cookies y almacenamiento local">
            <p>
              Nuestra plataforma puede utilizar cookies
              o almacenamiento local del navegador para
              mantener sesiones activas, recordar
              preferencias y facilitar la navegación.
            </p>
          </Section>

          <Section title="7. Conservación de los datos">
            <p>
              Conservamos los datos personales durante
              el tiempo necesario para administrar cuentas,
              completar pedidos, atender solicitudes y
              cumplir las obligaciones legales aplicables.
            </p>
          </Section>

          <Section title="8. Derechos de los usuarios">
            <p>
              Los usuarios pueden solicitar información
              sobre sus datos personales, su corrección
              o su eliminación, según corresponda y
              conforme a la legislación aplicable.
            </p>
            <p>
              Las solicitudes pueden realizarse mediante
              los canales oficiales de contacto de la tienda.
            </p>
          </Section>

          <Section title="9. Eliminación de datos personales">
            <p>
              Si deseás solicitar la eliminación de tu
              información personal, podés consultar
              nuestra página de eliminación de datos.
            </p>
            <a href="/data-deletion" style={styles.link}>
              Consultar instrucciones para eliminar mis datos
            </a>
            <p>
              Algunas informaciones relacionadas con
              transacciones podrían conservarse cuando
              exista una obligación legal que lo requiera.
            </p>
          </Section>

          <Section title="10. Servicios de terceros">
            <p>
              Los servicios de Google y Facebook cuentan
              con sus propias políticas de privacidad.
              Te recomendamos consultarlas para conocer
              cómo gestionan tus datos personales.
            </p>
            <p>
              <a
                href="https://policies.google.com/privacy"
                target="_blank"
                rel="noopener noreferrer"
                style={styles.link}
              >
                Política de Privacidad de Google
              </a>
            </p>
            <p>
              <a
                href="https://www.facebook.com/privacy/policy/"
                target="_blank"
                rel="noopener noreferrer"
                style={styles.link}
              >
                Política de Privacidad de Meta
              </a>
            </p>
          </Section>

          <Section title="11. Cambios en esta política">
            <p>
              NICA S-MART puede actualizar esta política
              cuando existan modificaciones en sus servicios,
              operaciones o requisitos legales.
            </p>
            <p>
              Publicaremos las actualizaciones en esta
              misma página, indicando la fecha correspondiente.
            </p>
          </Section>

          <Section title="12. Contacto">
            <p>
              Para consultas relacionadas con la privacidad
              y protección de datos personales, podés
              comunicarte con nosotros mediante nuestra
              página de contacto.
            </p>
            <a href="/contact" style={styles.link}>
              Contactar a NICA S-MART
            </a>
          </Section>
        </div>

        <footer style={styles.footer}>
          © {new Date().getFullYear()} NICA S-MART.
          Todos los derechos reservados.
        </footer>
      </div>
    </main>
  );
};

const Section = ({ title, children }) => (
  <section style={styles.section}>
    <h2 style={styles.sectionTitle}>{title}</h2>
    <div style={styles.sectionBody}>{children}</div>
  </section>
);

const styles = {
  page: {
    minHeight: "100vh",
    background: "#f8fafc",
    color: "#172033",
    padding: "48px 20px 70px",
    fontFamily: "inherit",
  },
  container: {
    maxWidth: "920px",
    margin: "0 auto",
  },
  header: {
    textAlign: "center",
    marginBottom: "35px",
  },
  badge: {
    display: "inline-block",
    color: "#2563eb",
    background: "#eaf2ff",
    padding: "8px 15px",
    borderRadius: "30px",
    fontSize: "12px",
    fontWeight: "700",
    letterSpacing: "1px",
    marginBottom: "18px",
  },
  title: {
    fontSize: "clamp(30px, 5vw, 44px)",
    fontWeight: "800",
    marginBottom: "15px",
  },
  subtitle: {
    fontSize: "16px",
    lineHeight: "1.8",
    color: "#64748b",
    maxWidth: "720px",
    margin: "0 auto 15px",
  },
  updated: {
    fontSize: "13px",
    color: "#94a3b8",
  },
  content: {
    background: "#ffffff",
    borderRadius: "20px",
    padding: "clamp(22px, 5vw, 45px)",
    boxShadow: "0 12px 40px rgba(15,23,42,0.06)",
    border: "1px solid #e2e8f0",
  },
  section: {
    marginBottom: "32px",
    paddingBottom: "25px",
    borderBottom: "1px solid #e2e8f0",
  },
  sectionTitle: {
    fontSize: "20px",
    fontWeight: "700",
    marginBottom: "12px",
    color: "#0f172a",
  },
  sectionBody: {
    fontSize: "15px",
    lineHeight: "1.9",
    color: "#475569",
  },
  link: {
    color: "#2563eb",
    fontWeight: "600",
    textDecoration: "none",
    overflowWrap: "anywhere",
  },
  footer: {
    textAlign: "center",
    marginTop: "30px",
    fontSize: "13px",
    color: "#94a3b8",
  },
};

export default Privacy;
