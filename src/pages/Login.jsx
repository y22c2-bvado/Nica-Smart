import Header from '../components/Header'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

import '../styles/login.css'

function Login() {
  const handleSubmit = (event) => {
    event.preventDefault()

    alert('Inicio de sesión de prueba')
  }

  return (
    <>
      <Header />
      <Navbar />

      <main className="login-page">

        <section className="login-container">

          <div className="login-info">

            <span className="login-label">
              BIENVENIDO
            </span>

            <h1>
              Inicia sesión en
              <br />
              Nica S-Mart
            </h1>

            <p>
              Accede a tu cuenta para consultar tus pedidos,
              gestionar tus datos y realizar tus compras.
            </p>

            <div className="login-benefits">

              <div>
                <span>📦</span>

                <div>
                  <strong>Consulta tus pedidos</strong>
                  <p>Revisa el estado de tus compras.</p>
                </div>
              </div>

              <div>
                <span>🛒</span>

                <div>
                  <strong>Compra más rápido</strong>
                  <p>Guarda tus datos para futuras compras.</p>
                </div>
              </div>

              <div>
                <span>🔒</span>

                <div>
                  <strong>Cuenta segura</strong>
                  <p>Protegemos la información de tu cuenta.</p>
                </div>
              </div>

            </div>

          </div>

          <div className="login-card">

            <h2>Iniciar sesión</h2>

            <p className="login-subtitle">
              Ingresa tus datos para continuar.
            </p>

            <form onSubmit={handleSubmit}>

              <div className="form-group">
                <label htmlFor="email">
                  Correo electrónico
                </label>

                <input
                  id="email"
                  type="email"
                  placeholder="correo@ejemplo.com"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="password">
                  Contraseña
                </label>

                <input
                  id="password"
                  type="password"
                  placeholder="Ingresa tu contraseña"
                  required
                />
              </div>

              <div className="login-options">

                <label className="remember">
                  <input type="checkbox" />
                  Recordarme
                </label>

                <button
                  type="button"
                  className="forgot-password"
                >
                  ¿Olvidaste tu contraseña?
                </button>

              </div>

              <button
                type="submit"
                className="login-button"
              >
                Iniciar sesión
              </button>

            </form>

            <div className="register-text">
              ¿No tienes una cuenta?

              <button type="button">
                Crear cuenta
              </button>
            </div>

          </div>

        </section>

      </main>

      <Footer />
    </>
  )
}

export default Login