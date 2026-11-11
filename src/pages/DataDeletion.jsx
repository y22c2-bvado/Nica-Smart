
import React from "react";
import { Link } from "react-router-dom";

const DataDeletion = () => {
  const lastUpdated = "10 de noviembre de 2026";

  return (
    <main className="data-deletion-page" style={styles.page}>
      <div style={styles.container}>
        <header style={styles.header}>
          <span style={styles.badge}>
            NICA S-MART · TECH STORE
          </span>

          <h1 style={styles.title}>
            Eliminación de Datos Personales
          </h1>

          <p style={styles.subtitle}>
            En NICA S-MART respetamos tu privacidad.
            Si deseás eliminar tu cuenta o solicitar
            la eliminación de tus datos personales,
            aquí te explicamos cómo hacerlo.
          </p>

          <p style={styles.updated}>
            Última actualización: {lastUpdated}
          </p>
        </header>

        <div style={styles.content}>
          <Section title="1. Tu derecho a solicitar la eliminación">
            <p>
              Los usuarios de NICA S-MART pueden solicitar
              la eliminación de su cuenta y de los datos
              personales asociados, conforme a la
              legislación aplicable.
            </p>

            <p>
              Esto incluye las cuentas registradas mediante
              correo electrónico y los servicios de
              autenticación de Google o Facebook.
            </p>
          </Section>

          <Section title="2. ¿Qué información podés solicitar eliminar?">
            <p>
              Podés solicitar la eliminación de información
              asociada a tu cuenta, incluyendo:
            </p>

            <ul>
              <li>Nombre y apellidos.</li>
              <li>Correo electrónico.</li>
              <li>Identificadores de autenticación.</li>
              <li>Datos de contacto y direcciones.</li>
              <li>Preferencias asociadas a tu cuenta.</li>
              <li>
                Otros datos personales que ya no deban
                conservarse.
              </li>
            </ul>

            <p>
              Algunos registros relacionados con compras
              o transacciones podrían conservarse cuando
              exista una obligación legal aplicable.
            </p>
          </Section>

          <Section title="3. Cómo solicitar la eliminación de tus datos">
            <p>
              Para solicitar la eliminación de tu cuenta
              o información personal, seguí estos pasos:
            </p>

            <div style={styles.steps}>
              <Step
                number="01"
                title="Ingresá a NICA S-MART"
                description="Accedé a nuestra tienda con tu cuenta habitual."
              />

              <Step
                number="02"
                title="Visitá la página de contacto"
                description="Utilizá el canal oficial de atención disponible en nuestra tienda."
              />

              <Step
                number="03"
                title="Solicitá la eliminación"
                description='Indicá que deseás eliminar tu cuenta y los datos personales asociados.'
              />

              <Step
                number="04"
                title="Verificá tu identidad"
                description="Podremos solicitar una verificación segura para confirmar que sos el titular de la cuenta."
              />

              <Step
                number="05"
                title="Recibí una respuesta"
                description="Te informaremos sobre el resultado de la solicitud y cualquier dato que deba conservarse por obligación legal."
              />
            </div>

            <Link to="/contact" style={styles.primaryButton}>
              Ir a contacto
            </Link>
          </Section>

          <Section title="4. Eliminación de datos de Facebook">
            <p>
              Si utilizaste Facebook para iniciar sesión
              en NICA S-MART, también podés retirar
              la autorización desde tu cuenta de Facebook.
            </p>

            <p>
              Para hacerlo:
            </p>

            <ol>
              <li>Abrí Facebook.</li>
              <li>Entrá a Configuración y privacidad.</li>
              <li>Seleccioná Configuración.</li>
              <li>
                Buscá la sección Aplicaciones y sitios web.
              </li>
              <li>Seleccioná NICA S-MART.</li>
              <li>
                Elegí la opción para eliminar o retirar
                el acceso de la aplicación.
              </li>
            </ol>

            <p>
              Retirar el acceso desde Facebook impide que
              la aplicación continúe utilizando esa
              autorización, pero no garantiza la eliminación
              automática de los datos ya almacenados
              por NICA S-MART.
            </p>

            <p>
              Para solicitar también la eliminación
              de esos datos, utilizá nuestro
              procedimiento de contacto.
            </p>

            <a
              href="https://www.facebook.com/settings?tab=applications"
              target="_blank"
              rel="noopener noreferrer"
              style={styles.link}
            >
              Administrar aplicaciones conectadas en Facebook
            </a>
          </Section>

          <Section title="5. Eliminación de datos de Google">
            <p>
              Si utilizaste tu cuenta de Google para
              registrarte o iniciar sesión, podés
              retirar el acceso desde tu cuenta Google.
            </p>

            <p>
              También debés solicitar directamente
              a NICA S-MART la eliminación de los datos
              personales almacenados en nuestra plataforma.
            </p>

            <a
              href="https://myaccount.google.com/connections"
              target="_blank"
              rel="noopener noreferrer"
              style={styles.link}
            >
              Administrar conexiones de Google
            </a>
          </Section>

          <Section title="6. ¿Qué ocurre después de la solicitud?">
            <p>
              Una vez recibida tu solicitud,
              verificaremos que corresponda al
              titular de la cuenta.
            </p>

            <p>
              Posteriormente revisaremos la
              información asociada y procederemos
              conforme a nuestras obligaciones
              legales y políticas de conservación.
            </p>

            <p>
              Te comunicaremos el resultado por
              el canal de contacto utilizado.
            </p>
          </Section>

          <Section title="7. Datos que podrían conservarse">
            <p>
              Determinada información puede necesitar
              conservarse por motivos fiscales,
              contables, legales o de prevención
              de fraude.
            </p>

            <p>
              Cuando corresponda, limitaremos su
              utilización a las finalidades que
              justifiquen su conservación.
            </p>
          </Section>

          <Section title="8. Seguridad de las solicitudes">
            <p>
              Por seguridad, nunca te solicitaremos
              compartir contraseñas personales
              de Google, Facebook o códigos
              privados de autenticación.
            </p>

            <p>
              Podemos requerir una verificación
              razonable para evitar que terceros
              soliciten la eliminación de
              cuentas ajenas.
            </p>
          </Section>

          <Section title="9. Política de Privacidad">
            <p>
              Para obtener más información sobre
              cómo recopilamos, utilizamos y
              conservamos datos personales,
              consultá nuestra Política
              de Privacidad.
            </p>

            <Link to="/privacy" style={styles.link}>
              Consultar Política de Privacidad
            </Link>
          </Section>

          <Section title="10. Contacto">
            <p>
              Si tenés dudas sobre el procedimiento
              o necesitás asistencia, podés
              comunicarte con NICA S-MART.
            </p>

            <Link to="/contact" style={styles.link}>
              Contactar a NICA S-MART
            </Link>
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

const Step = ({ number, title, description }) => (
  <div style={styles.step}>
    <div style={styles.stepNumber}>{number}</div>

    <div>
      <h3 style={styles.stepTitle}>{title}</h3>
      <p style={styles.stepDescription}>{description}</p>
    </div>
  </div>
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

  steps: {
    display: "grid",
    gap: "18px",
    margin: "25px 0",
  },

  step: {
    display: "flex",
    alignItems: "flex-start",
    gap: "15px",
    padding: "18px",
    border: "1px solid #e2e8f0",
    borderRadius: "14px",
    background: "#f8fafc",
  },

  stepNumber: {
    flexShrink: 0,
    width: "40px",
    height: "40px",
    borderRadius: "12px",
    background: "#dbeafe",
    color: "#2563eb",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    fontSize: "14px",
    fontWeight: "800",
  },

  stepTitle: {
    fontSize: "16px",
    fontWeight: "700",
    margin: "0 0 6px",
    color: "#0f172a",
  },

  stepDescription: {
    fontSize: "14px",
    lineHeight: "1.7",
    margin: 0,
    color: "#64748b",
  },

  primaryButton: {
    display: "inline-block",
    padding: "13px 22px",
    background: "#2563eb",
    color: "#ffffff",
    borderRadius: "10px",
    textDecoration: "none",
    fontSize: "14px",
    fontWeight: "700",
    marginTop: "5px",
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

export default DataDeletion;

