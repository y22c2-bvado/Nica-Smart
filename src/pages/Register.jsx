
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import '../styles/register.css'

const API_URL = (
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV ? 'http://localhost:3000' : '')
).trim().replace(/\/$/, '')

function Register() {
  const navigate = useNavigate()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // ==========================================
  // CREAR CUENTA
  // ==========================================

  const handleRegister = async (event) => {
    event.preventDefault()
    setError('')

    if (name.trim().length < 2) {
      setError('Ingresa tu nombre completo.')
      return
    }

    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.')
      return
    }

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.')
      return
    }

    setLoading(true)

    try {
      const response = await fetch(
        `${API_URL}/api/auth/register`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            name: name.trim(),
            email: email.trim(),
            password
          })
        }
      )

      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        throw new Error(
          data.message ||
          data.error ||
          'No se pudo crear tu cuenta.'
        )
      }

      if (!data.token || !data.user?.email) {
        throw new Error(
          'El servidor no devolvió una sesión completa.'
        )
      }

      // Iniciar sesión automáticamente al registrar.
      localStorage.setItem('token', data.token)
      localStorage.setItem(
        'user',
        JSON.stringify(data.user)
      )

      window.dispatchEvent(new Event('auth-change'))

      navigate('/', { replace: true })

    } catch (err) {
      setError(
        err instanceof TypeError
          ? 'No se pudo conectar con el servidor.'
          : err.message || 'Error creando la cuenta.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="register-page">
      <section className="register-card">

        <Link to="/" className="register-brand">
          🛒 NICA <span>S-MART</span>
        </Link>

        <div className="register-heading">
          <h1>Crear cuenta</h1>

          <p>
            Regístrate para disfrutar de una mejor
            experiencia de compra.
          </p>
        </div>

        {error && (
          <div className="register-error" role="alert">
            {error}
          </div>
        )}

        <form onSubmit={handleRegister}>

          <div className="register-field">
            <label htmlFor="register-name">
              Nombre completo
            </label>

            <input
              id="register-name"
              type="text"
              placeholder="Tu nombre y apellido"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={80}
              autoComplete="name"
              required
            />
          </div>

          <div className="register-field">
            <label htmlFor="register-email">
              Correo electrónico
            </label>

            <input
              id="register-email"
              type="email"
              placeholder="ejemplo@yahoo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              maxLength={254}
              autoComplete="email"
              required
            />

            <small>
              Aceptamos Yahoo, Gmail, Outlook,
              Hotmail y otros proveedores.
            </small>
          </div>

          <div className="register-field">
            <label htmlFor="register-password">
              Contraseña
            </label>

            <div className="register-password-wrapper">
              <input
                id="register-password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Mínimo 8 caracteres"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={8}
                maxLength={72}
                autoComplete="new-password"
                required
              />

              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={
                  showPassword
                    ? 'Ocultar contraseña'
                    : 'Mostrar contraseña'
                }
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          <div className="register-field">
            <label htmlFor="register-confirm">
              Confirmar contraseña
            </label>

            <input
              id="register-confirm"
              type={showPassword ? 'text' : 'password'}
              placeholder="Repite tu contraseña"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              minLength={8}
              maxLength={72}
              autoComplete="new-password"
              required
            />
          </div>

          <button
            type="submit"
            className="register-submit"
            disabled={loading}
          >
            {loading
              ? 'Creando cuenta...'
              : 'Crear mi cuenta →'}
          </button>

        </form>

        <div className="register-footer">
          ¿Ya tienes una cuenta?
          {' '}
          <Link to="/login">
            Iniciar sesión
          </Link>
        </div>

        <Link to="/" className="register-back">
          ← Volver a la tienda
        </Link>

      </section>
    </main>
  )
}

export default Register
