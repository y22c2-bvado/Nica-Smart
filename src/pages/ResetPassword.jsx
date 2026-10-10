
import { useState } from 'react'
import {
  Link,
  useSearchParams
} from 'react-router-dom'

import '../styles/register.css'

// ==========================================
// CONFIGURACIÓN DEL BACKEND
// ==========================================

const API_URL = (
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV ? 'http://localhost:3000' : '')
).trim().replace(/\/$/, '')

// ==========================================
// RESTABLECER CONTRASEÑA
// ==========================================

function ResetPassword() {
  const [searchParams] = useSearchParams()

  // Token recibido en el enlace del correo
  const token = searchParams.get('token')

  // ==========================================
  // ESTADOS
  // ==========================================

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  // ==========================================
  // VALIDAR Y GUARDAR CONTRASEÑA
  // ==========================================

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (loading) return

    setError('')

    if (!token || !/^[a-f0-9]{64}$/i.test(token)) {
      setError('El enlace de recuperación no es válido.')
      return
    }

    if (password.length < 8) {
      setError(
        'La contraseña debe tener al menos 8 caracteres.'
      )
      return
    }

    // Coincide con el límite de bcrypt del backend.
    if (new TextEncoder().encode(password).length > 72) {
      setError(
        'La contraseña es demasiado larga. Utiliza menos de 72 bytes.'
      )
      return
    }

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.')
      return
    }

    if (!API_URL) {
      setError('El servidor no está configurado.')
      return
    }

    setLoading(true)

    try {
      const response = await fetch(
        `${API_URL}/api/auth/reset-password`,
        {
          method: 'POST',

          headers: {
            'Content-Type': 'application/json'
          },

          body: JSON.stringify({
            token,
            password
          })
        }
      )

      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        throw new Error(
          data.message ||
          data.error ||
          'No se pudo restablecer la contraseña.'
        )
      }

      // ======================================
      // CONTRASEÑA ACTUALIZADA
      // ======================================

      setSuccess(true)
      setPassword('')
      setConfirmPassword('')

      // Limpiar la sesión local anterior, si existe.
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      localStorage.removeItem('rememberMe')

      window.dispatchEvent(new Event('auth-change'))

    } catch (err) {
      console.error(
        'Error restableciendo contraseña:',
        err
      )

      setError(
        err instanceof TypeError
          ? 'No se pudo conectar con el servidor.'
          : err.message ||
            'No se pudo actualizar la contraseña.'
      )

    } finally {
      setLoading(false)
    }
  }

  // ==========================================
  // INTERFAZ
  // ==========================================

  return (
    <main className="register-page">

      <section className="register-card">

        {/* LOGO NICA S-MART */}

        <Link to="/" className="register-brand">
          🛒 NICA <span>S-MART</span>
        </Link>

        {success ? (

          // ==================================
          // CONTRASEÑA ACTUALIZADA
          // ==================================

          <>
            <div className="register-heading">
              <h1>¡Contraseña actualizada!</h1>

              <p>
                Tu contraseña se cambió correctamente.
                Ya puedes acceder a tu cuenta de
                NICA S-MART con la nueva contraseña.
              </p>
            </div>

            <div
              className="forgot-success"
              role="status"
            >
              <strong>✓ Cambio realizado</strong>

              <p>
                Por seguridad, deberás iniciar sesión
                nuevamente en este dispositivo.
              </p>
            </div>

            <Link
              to="/login"
              className="register-submit"
            >
              Iniciar sesión →
            </Link>
          </>

        ) : (

          // ==================================
          // FORMULARIO
          // ==================================

          <>
            <div className="register-heading">
              <h1>Crear nueva contraseña</h1>

              <p>
                Introduce una nueva contraseña para
                recuperar el acceso a tu cuenta.
              </p>
            </div>

            {/* ENLACE INVÁLIDO */}

            {!token || !/^[a-f0-9]{64}$/i.test(token) ? (

              <>
                <div
                  className="register-error"
                  role="alert"
                >
                  El enlace de recuperación no es válido
                  o está incompleto.
                </div>

                <Link
                  to="/forgot-password"
                  className="register-submit"
                >
                  Solicitar otro enlace
                </Link>
              </>

            ) : (

              <form onSubmit={handleSubmit}>

                {/* NUEVA CONTRASEÑA */}

                <div className="register-field">

                  <label htmlFor="new-password">
                    Nueva contraseña
                  </label>

                  <div className="register-password-wrapper">

                    <input
                      id="new-password"
                      type={
                        showPassword
                          ? 'text'
                          : 'password'
                      }
                      placeholder="Mínimo 8 caracteres"
                      value={password}
                      onChange={(event) => {
                        setPassword(event.target.value)
                        setError('')
                      }}
                      minLength={8}
                      autoComplete="new-password"
                      required
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowPassword(!showPassword)
                      }
                      aria-label={
                        showPassword
                          ? 'Ocultar contraseña'
                          : 'Mostrar contraseña'
                      }
                    >
                      {showPassword ? '🙈' : '👁️'}
                    </button>

                  </div>

                  <small>
                    Utiliza al menos 8 caracteres.
                    Combina letras, números y símbolos
                    para mayor seguridad.
                  </small>

                </div>

                {/* CONFIRMAR CONTRASEÑA */}

                <div className="register-field">

                  <label htmlFor="confirm-password">
                    Confirmar nueva contraseña
                  </label>

                  <input
                    id="confirm-password"
                    type={
                      showPassword
                        ? 'text'
                        : 'password'
                    }
                    placeholder="Repite tu contraseña"
                    value={confirmPassword}
                    onChange={(event) => {
                      setConfirmPassword(event.target.value)
                      setError('')
                    }}
                    minLength={8}
                    autoComplete="new-password"
                    required
                  />

                </div>

                {/* ERROR */}

                {error && (
                  <div
                    className="register-error"
                    role="alert"
                  >
                    {error}
                  </div>
                )}

                {/* BOTÓN PRINCIPAL */}

                <button
                  type="submit"
                  className="register-submit"
                  disabled={loading}
                >
                  {loading
                    ? 'Actualizando contraseña...'
                    : 'Guardar nueva contraseña →'}
                </button>

              </form>

            )}

            {/* ENLACES INFERIORES */}

            <div className="register-footer">

              <Link to="/login">
                ← Volver a iniciar sesión
              </Link>

            </div>
          </>

        )}

      </section>

    </main>
  )
}

export default ResetPassword
