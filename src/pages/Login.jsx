
import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useGoogleLogin } from '@react-oauth/google'

import '../styles/login.css'

function Login() {
  const navigate = useNavigate()
  const location = useLocation()

  // ==========================================
  // CONFIGURACIÓN DEL BACKEND
  // ==========================================

  const API_URL = (
    import.meta.env.VITE_API_URL ||
    (import.meta.env.DEV ? 'http://localhost:3000' : '')
  ).trim().replace(/\/$/, '')

  if (import.meta.env.DEV) {
    console.log('NICA S-MART - API configurada:', API_URL)
  }

  const from =
    location.state?.from === '/cart'
      ? '/cart'
      : '/'

  // ==========================================
  // ESTADOS DEL FORMULARIO
  // ==========================================

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState('')

  // ==========================================
  // GUARDAR SESIÓN
  // ==========================================

  const saveSession = (data) => {
    const token = data?.token || data?.access_token

    if (!token || typeof token !== 'string') {
      throw new Error(
        'El servidor no devolvió un token de autenticación.'
      )
    }

    localStorage.setItem('token', token)
    localStorage.setItem('rememberMe', String(rememberMe))

    navigate(from, {
      replace: true,
    })
  }

  // ==========================================
  // VALIDACIONES
  // ==========================================

  const validateEmail = (value) => {
    const cleanEmail = value.trim()

    const emailRegex =
      /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/

    const controlRegex = /[\x00-\x1F\x7F]/

    if (!cleanEmail) {
      return 'El correo electrónico es obligatorio.'
    }

    if (cleanEmail.length > 254) {
      return 'El correo electrónico es demasiado largo.'
    }

    if (controlRegex.test(cleanEmail)) {
      return 'El correo contiene caracteres no permitidos.'
    }

    if (!emailRegex.test(cleanEmail)) {
      return 'Ingresa un correo electrónico válido.'
    }

    return null
  }

  const validatePassword = (value) => {
    const controlRegex = /[\x00-\x1F\x7F]/

    if (!value) {
      return 'La contraseña es obligatoria.'
    }

    if (value.length > 128) {
      return 'La contraseña no puede superar los 128 caracteres.'
    }

    if (controlRegex.test(value)) {
      return 'La contraseña contiene caracteres no permitidos.'
    }

    return null
  }

  // ==========================================
  // LOGIN CON CORREO Y CONTRASEÑA
  // ==========================================

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (loading || googleLoading) return

    setError('')

    const emailError = validateEmail(email)
    const passwordError = validatePassword(password)

    if (emailError || passwordError) {
      setError(emailError || passwordError)
      return
    }

    if (!API_URL) {
      setError('El servidor no está configurado.')
      return
    }

    setLoading(true)

    try {
      const response = await fetch(
        `${API_URL}/api/auth/login`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: email.trim(),
            password,
          }),
        }
      )

      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        throw new Error(
          response.status === 401
            ? 'Correo o contraseña incorrectos.'
            : data.message ||
              'No se pudo iniciar sesión.'
        )
      }

      saveSession(data)

    } catch (err) {
      console.error('Error de autenticación:', err)

      setError(
        err instanceof TypeError
          ? 'No se pudo conectar al servidor. Verifica que Express esté funcionando.'
          : err.message || 'Error al iniciar sesión.'
      )

    } finally {
      setLoading(false)
    }
  }

  // ==========================================
  // LOGIN CON GOOGLE
  // ==========================================

  const googleLogin = useGoogleLogin({
    flow: 'auth-code',
    ux_mode: 'popup',

    onSuccess: async (response) => {
      setError('')
      setGoogleLoading(true)

      try {
        if (!API_URL) {
          throw new Error(
            'El servidor no está configurado.'
          )
        }

        if (!response.code) {
          throw new Error(
            'Google no devolvió un código de autorización.'
          )
        }

        // Enviar código de Google al backend
        const result = await fetch(
          `${API_URL}/api/auth/google`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Requested-With': 'XmlHttpRequest',
            },
            body: JSON.stringify({
              code: response.code,
            }),
          }
        )

        const data = await result.json().catch(() => ({}))

        if (!result.ok) {
          throw new Error(
            data.message ||
            'No se pudo autenticar con Google.'
          )
        }

        // Guardar JWT generado por Express
        saveSession(data)

      } catch (err) {
        console.error('Error Google:', err)

        setError(
          err instanceof TypeError
            ? 'No se pudo conectar al backend de Google.'
            : err.message ||
              'Error al iniciar sesión con Google.'
        )

      } finally {
        setGoogleLoading(false)
      }
    },

    onError: (googleError) => {
      console.error('Error OAuth Google:', googleError)
      setGoogleLoading(false)

      setError(
        'No se pudo iniciar sesión con Google.'
      )
    },

    onNonOAuthError: (googleError) => {
      console.error('Error de ventana Google:', googleError)
      setGoogleLoading(false)

      setError(
        googleError?.type === 'popup_closed'
          ? 'Cerraste la ventana de Google antes de completar el inicio de sesión.'
          : 'No se pudo abrir o completar la ventana de Google.'
      )
    },
  })

  const handleGoogleLogin = () => {
    if (loading || googleLoading) return

    setError('')

    if (!import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim()) {
      setError(
        'Falta configurar el Client ID de Google.'
      )
      return
    }

    if (!API_URL) {
      setError('El servidor no está configurado.')
      return
    }

    // Se llama directamente desde el clic para
    // evitar bloqueos de la ventana emergente.
    googleLogin()
  }

  // ==========================================
  // FACEBOOK - PENDIENTE
  // ==========================================

  const handleFacebookLogin = () => {
    setError(
      'El inicio de sesión con Facebook estará disponible cuando configuremos Meta OAuth.'
    )
  }

  return (
    <main className="login-page">

      {/* FONDO DECORATIVO */}
      <div className="login-bg-shape login-bg-shape-left"></div>
      <div className="login-bg-shape login-bg-shape-right"></div>

      <div className="login-side login-side-left">
        <div className="shopping-bag">
          <div className="bag-handle"></div>

          <div className="bag-body">
            <span className="bag-cart">🛒</span>
          </div>
        </div>
      </div>

      <div className="login-side login-side-right">
        <div className="plant-box">
          <div className="plant"></div>
          <div className="pot"></div>
        </div>

        <div className="laptop-box">
          <div className="laptop-screen"></div>
          <div className="laptop-base"></div>
        </div>
      </div>

      {/* TARJETA PRINCIPAL */}
      <section className="login-card">

        {/* LOGO */}
        <div className="brand-block">
          <div className="brand-row">
            <span className="brand-cart">🛒</span>

            <h2>
              Nica <span>S-Mart</span>
            </h2>
          </div>

          <p>
            Tecnología, hogar y más para tu día a día
          </p>
        </div>

        {/* ENCABEZADO */}
        <div className="login-heading">
          <h1>Iniciar sesión</h1>
          <p>Ingresa tus datos para continuar.</p>
        </div>

        {/* MENSAJE DE ERROR */}
        {error && (
          <div className="login-error" role="alert">
            {error}
          </div>
        )}

        {/* FORMULARIO */}
        <form
          className="login-form"
          onSubmit={handleSubmit}
        >

          {/* CORREO */}
          <div className="form-group">
            <label htmlFor="email">
              Correo electrónico
            </label>

            <div className="input-wrapper">
              <span className="input-icon">✉</span>

              <input
                id="email"
                type="email"
                placeholder="correo@ejemplo.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  setError('')
                }}
                maxLength={254}
                autoComplete="email"
                required
              />
            </div>
          </div>

          {/* CONTRASEÑA */}
          <div className="form-group">
            <label htmlFor="password">
              Contraseña
            </label>

            <div className="input-wrapper">
              <span className="input-icon">🔒</span>

              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Ingresa tu contraseña"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  setError('')
                }}
                maxLength={128}
                autoComplete="current-password"
                required
              />

              <button
                type="button"
                className="show-password"
                onClick={() =>
                  setShowPassword(!showPassword)
                }
                aria-label={
                  showPassword
                    ? 'Ocultar contraseña'
                    : 'Mostrar contraseña'
                }
              >
                {showPassword ? '🙈' : '👁'}
              </button>
            </div>
          </div>

          {/* OPCIONES */}
          <div className="login-options">

            <label className="remember-box">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) =>
                  setRememberMe(e.target.checked)
                }
              />

              <span>Recordarme</span>
            </label>

            <button
              type="button"
              className="forgot-link"
              onClick={() =>
                setError(
                  'La recuperación de contraseña estará disponible próximamente.'
                )
              }
            >
              ¿Olvidaste tu contraseña?
            </button>
          </div>

          {/* BOTÓN PRINCIPAL */}
          <button
            type="submit"
            className="login-button"
            disabled={loading || googleLoading}
          >
            <span>
              {loading
                ? 'Iniciando sesión...'
                : 'Iniciar sesión'}
            </span>

            {!loading && (
              <span className="arrow">→</span>
            )}
          </button>

        </form>

        {/* DIVISOR */}
        <div className="divider">
          <span>o continúa con</span>
        </div>

        {/* BOTONES SOCIALES */}
        <div className="social-buttons">

          {/* GOOGLE */}
          <button
            type="button"
            className="social-button"
            onClick={handleGoogleLogin}
            disabled={googleLoading || loading}
          >
            <svg
              width="28"
              height="28"
              viewBox="0 0 48 48"
              aria-hidden="true"
            >
              <path
                fill="#EA4335"
                d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
              />
              <path
                fill="#4285F4"
                d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.28 5.48-4.82 7.18l7.73 6C44.36 38.03 46.98 31.88 46.98 24.55z"
              />
              <path
                fill="#FBBC05"
                d="M10.53 28.59A14.41 14.41 0 0 1 9.75 24c0-1.59.27-3.13.76-4.59l-7.98-6.2A23.88 23.88 0 0 0 0 24c0 3.87.93 7.51 2.56 10.78l7.97-6.19z"
              />
              <path
                fill="#34A853"
                d="M24 48c6.48 0 11.93-2.13 15.91-5.8l-7.73-6c-2.15 1.45-4.92 2.3-8.18 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
              />
            </svg>

            <span>
              {googleLoading
                ? 'Conectando con Google...'
                : 'Continuar con Google'}
            </span>
          </button>

          {/* FACEBOOK */}
          <button
            type="button"
            className="social-button"
            onClick={handleFacebookLogin}
          >
            <span className="facebook-icon">f</span>
            <span>Continuar con Facebook</span>
          </button>

        </div>

        {/* CREAR CUENTA */}
        <div className="register-box">
          <span>¿No tienes una cuenta?</span>

          <button
            type="button"
            onClick={() => navigate('/register')}
          >
            Crear cuenta
          </button>
        </div>

      </section>
    </main>
  )
}

export default Login
