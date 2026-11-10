
import React from "react";

const Terms = () => {
  const lastUpdated = "10 de noviembre de 2026";

  return (
    <main className="terms-page" style={styles.page}>
      <div style={styles.container}>
        <header style={styles.header}>
          <span style={styles.badge}>
            NICA S-MART · TECH STORE
          </span>

          <h1 style={styles.title}>
            Términos y Condiciones
          </h1>

          <p style={styles.subtitle}>
            Conocé las condiciones generales para utilizar
            nuestra tienda en línea, administrar tu cuenta
            y realizar compras en NICA S-MART.
          </p>

          <p style={styles.updated}>
            Última actualización: {lastUpdated}
          </p>
        </header>

        <div style={styles.content}>
          <Section title="1. Aceptación de los términos">
            <p>
              Al acceder y utilizar NICA S-MART, aceptás
              las condiciones establecidas en este documento,
              en la medida en que sean aplicables a los
              servicios que utilizás.
            </p>
            <p>
              Si no estás de acuerdo con alguna condición,
              podés dejar de utilizar el servicio o
              contactarnos para solicitar aclaraciones.
            </p>
          </Section>

          <Section title="2. Descripción del servicio">
            <p>
              NICA S-MART es una tienda en línea orientada
              a la comercialización de productos tecnológicos
              y accesorios electrónicos.
            </p>

            <p>
              Nuestro catálogo puede incluir:
            </p>

            <ul>
              <li>Computadoras y componentes.</li>
              <li>Accesorios para celulares.</li>
              <li>Dispositivos de audio.</li>
              <li>Relojes inteligentes.</li>
              <li>Productos gaming.</li>
              <li>Cables, cargadores y periféricos.</li>
            </ul>

            <p>
              La disponibilidad de cada producto estará
              sujeta al inventario existente.
            </p>
          </Section>

          <Section title="3. Registro y cuentas de usuario">
            <p>
              Para utilizar determinadas funciones, como
              realizar pedidos y consultar el historial
              de compras, puede ser necesario crear
              una cuenta.
            </p>

            <p>
              Los usuarios deben proporcionar información
              correcta y mantener actualizados sus datos
              personales y de contacto.
            </p>

            <p>
              Cada usuario es responsable de proteger
              sus credenciales y notificarnos si sospecha
              de un acceso no autorizado.
            </p>
          </Section>

          <Section title="4. Inicio de sesión con Google y Facebook">
            <p>
              NICA S-MART podrá ofrecer autenticación
              mediante proveedores externos, como
              Google y Facebook.
            </p>

            <p>
              Al utilizar estos métodos, el usuario
              autoriza el tratamiento de los datos
              necesarios para identificar y administrar
              su cuenta, conforme a nuestra Política
              de Privacidad.
            </p>

            <p>
              Estos servicios también están sujetos
              a las condiciones y políticas de
              sus respectivos proveedores.
            </p>
          </Section>

          <Section title="5. Información de los productos">
            <p>
              Procuramos que las descripciones,
              características, precios e imágenes
              de los productos sean claros y precisos.
            </p>

            <p>
              Las imágenes pueden ser ilustrativas
              y existir diferencias de presentación
              respecto al producto entregado.
            </p>

            <p>
              Si se detecta un error material en
              la información publicada, informaremos
              al cliente antes de continuar con
              una operación afectada.
            </p>
          </Section>

          <Section title="6. Precios y moneda">
            <p>
              Los precios publicados en NICA S-MART
              se muestran en córdobas nicaragüenses
              (C$), salvo indicación expresa en contrario.
            </p>

            <p>
              Las promociones y descuentos pueden
              tener períodos de vigencia, cantidades
              disponibles y condiciones particulares.
            </p>

            <p>
              Antes de confirmar una compra,
              se mostrará el resumen correspondiente
              con los productos, cantidades y
              cargos adicionales aplicables.
            </p>
          </Section>

          <Section title="7. Pedidos y confirmación de compra">
            <p>
              El usuario podrá seleccionar productos,
              agregarlos al carrito y completar
              los datos necesarios para solicitar
              una compra.
            </p>

            <p>
              La recepción de un pedido no significa
              necesariamente que todos los productos
              hayan sido confirmados para entrega.
            </p>

            <p>
              Si existe algún inconveniente con
              disponibilidad, precio o procesamiento,
              nos comunicaremos con el cliente para
              informar las opciones correspondientes.
            </p>
          </Section>

          <Section title="8. Métodos de pago">
            <p>
              Los métodos de pago disponibles
              se informarán durante el proceso
              de compra.
            </p>

            <p>
              Cuando se utilicen procesadores
              de pago externos, las transacciones
              podrán estar sujetas a las políticas
              y condiciones de dichos proveedores.
            </p>

            <p>
              NICA S-MART no solicitará que los
              clientes compartan sus contraseñas
              bancarias o códigos privados
              de autenticación.
            </p>
          </Section>

          <Section title="9. Envíos y entregas">
            <p>
              Los costos de envío, las zonas
              de cobertura y las condiciones de
              entrega aplicables serán comunicados
              al cliente antes de confirmar
              su compra.
            </p>

            <p>
              Los tiempos estimados de entrega
              pueden variar por disponibilidad,
              ubicación, condiciones de transporte
              y situaciones externas.
            </p>

            <p>
              El cliente deberá proporcionar
              una dirección válida y datos de
              contacto que permitan coordinar
              la entrega.
            </p>
          </Section>

          <Section title="10. Cancelaciones, cambios y devoluciones">
            <p>
              Los clientes podrán consultar
              las condiciones aplicables para
              solicitar cancelaciones, cambios
              o devoluciones.
            </p>

            <p>
              Cada solicitud será evaluada
              según el estado del pedido,
              las condiciones del producto,
              las garantías correspondientes
              y la legislación vigente.
            </p>

            <p>
              Ninguna disposición de estos
              términos limita los derechos
              que correspondan al consumidor
              conforme a las leyes aplicables
              en Nicaragua.
            </p>
          </Section>

          <Section title="11. Garantías de productos">
            <p>
              Los productos comercializados
              podrán contar con garantías
              según su naturaleza, fabricante
              y condiciones de venta.
            </p>

            <p>
              El cliente podrá comunicarse
              con NICA S-MART para consultar
              el procedimiento de atención
              de una garantía.
            </p>

            <p>
              Las condiciones de garantía
              se aplicarán respetando los
              derechos establecidos por
              la legislación correspondiente.
            </p>
          </Section>

          <Section title="12. Uso adecuado de la plataforma">
            <p>
              Los usuarios se comprometen
              a utilizar NICA S-MART de
              manera legítima y responsable.
            </p>

            <ul>
              <li>
                No utilizar información falsa
                para realizar operaciones fraudulentas.
              </li>
              <li>
                No intentar acceder sin autorización
                a cuentas o sistemas.
              </li>
              <li>
                No introducir software malicioso.
              </li>
              <li>
                No realizar actividades que
                afecten la disponibilidad
                o seguridad de la plataforma.
              </li>
            </ul>
          </Section>

          <Section title="13. Protección de datos personales">
            <p>
              El tratamiento de los datos
              personales se describe en
              nuestra Política de Privacidad.
            </p>

            <a href="/privacy" style={styles.link}>
              Consultar Política de Privacidad
            </a>
          </Section>

          <Section title="14. Eliminación de cuentas y datos">
            <p>
              Los usuarios podrán solicitar
              la eliminación de sus cuentas
              y datos personales mediante
              los mecanismos habilitados
              por NICA S-MART.
            </p>

            <p>
              Determinada información podrá
              conservarse cuando exista una
              obligación legal aplicable.
            </p>

            <a href="/data-deletion" style={styles.link}>
              Consultar eliminación de datos
            </a>
          </Section>

          <Section title="15. Disponibilidad del servicio">
            <p>
              Procuramos mantener la plataforma
              disponible y en funcionamiento.
            </p>

            <p>
              Sin embargo, pueden producirse
              interrupciones temporales por
              mantenimiento, actualizaciones,
              problemas técnicos o causas
              ajenas a nuestro control.
            </p>
          </Section>

          <Section title="16. Propiedad intelectual">
            <p>
              El diseño, contenido original,
              identidad visual y elementos
              propios de NICA S-MART están
              protegidos conforme a la
              legislación aplicable.
            </p>

            <p>
              Los nombres y marcas de
              productos de terceros pertenecen
              a sus respectivos titulares.
            </p>
          </Section>

          <Section title="17. Modificaciones de los términos">
            <p>
              NICA S-MART podrá actualizar
              estos términos cuando existan
              cambios en sus servicios,
              operaciones o requisitos legales.
            </p>

            <p>
              Las modificaciones se publicarán
              en esta página indicando su
              fecha de actualización.
            </p>
          </Section>

          <Section title="18. Legislación aplicable">
            <p>
              Estos términos se interpretarán
              conforme a la legislación aplicable
              de la República de Nicaragua,
              respetando los derechos
              de los consumidores.
            </p>
          </Section>

          <Section title="19. Contacto">
            <p>
              Para consultas sobre productos,
              compras, condiciones de uso,
              garantías o solicitudes de
              atención, podés comunicarte
              con NICA S-MART.
            </p>

            <a href="/contact" style={styles.link}>
              Ir a la página de contacto
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
    background: "#eaf2ff",
    color: "#2563eb",
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

export default Terms;
    