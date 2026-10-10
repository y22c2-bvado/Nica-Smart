
import { useState } from 'react'
import { Link } from 'react-router-dom'

import '../styles/register.css'

// ==========================================
// CONFIGURACIÓN DEL BACKEND
// ==========================================

const API_URL = (
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV ? 'http://localhost:3000' : '')
).trim().replace(/\/$/, '')

// ==========================================
// RECUPERAR CONTRASEÑA
// ==========================================

function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (loading) return

    setError('')
    setSuccess(false)
    setLoading(true)

    try {
      const response = await fetch(
        `${API_URL}/api/auth/forgot-password`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            email: email.trim()
          })
        }
      )

      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        throw new Error(
          data.message ||
          'No pudimos procesar tu solicitud.'
        )
      }

      setSuccess(true)

    } catch (err) {
      setError(
        err instanceof TypeError
          ? 'No se pudo conectar con el servidor.'
          : err.message || 'Ocurrió un error.'
      )

    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="register-page">

      <section className="register-card">

        {/* LOGO */}

        <Link to="/" className="register-brand">
          🛒 NICA <span>S-MART</span>
        </Link>

        {/* ENCABEZADO */}

        <div className="register-heading">

          <h1>¿Olvidaste tu contraseña?</h1>

          <p>
            No te preocupes. Ingresa tu correo electrónico
            y te enviaremos un enlace para restablecerla.
          </p>

        </div>

        {/* MENSAJE DE ÉXITO */}

        {success && (
          <div
            className="forgot-success"
            role="status"
          >
            <strong>Revisa tu correo electrónico</strong>

            <p>
              Si existe una cuenta asociada a ese correo,
              recibirás un enlace para cambiar tu contraseña.
              Revisa también la carpeta de spam.
            </p>
          </div>
        )}

        {/* ERRORES */}

        {error && (
          <div className="register-error" role="alert">
            {error}
          </div>
        )}

        {/* FORMULARIO */}

        <form onSubmit={handleSubmit}>

          <div className="register-field">

            <label htmlFor="forgot-email">
              Correo electrónico
            </label>

            <input
              id="forgot-email"
              type="email"
              placeholder="ejemplo@yahoo.com"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value)
                setError('')
                setSuccess(false)
              }}
              maxLength={254}
              autoComplete="email"
              required
            />

            <small>
              Utiliza el correo con el que creaste tu cuenta
              de NICA S-MART.
            </small>

          </div>

          <button
            type="submit"
            className="register-submit"
            disabled={loading}
          >
            {loading
              ? 'Enviando solicitud...'
              : 'Enviar enlace de recuperación'}
          </button>

        </form>

        {/* VOLVER AL LOGIN */}

        <div className="register-footer">

          <Link to="/login">
            ← Volver a iniciar sesión
          </Link>

        </div>

      </section>

    </main>
  )
}

export default ForgotPassword
