import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useGoogleLogin } from '@react-oauth/google'

import '../styles/login.css'


const API_URL = (
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV ? 'http://localhost:3000' : '')
).trim().replace(/\/$/, '')

const FACEBOOK_APP_ID = (
  import.meta.env.VITE_FACEBOOK_APP_ID || ''
).trim()


function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const from =
    location.state?.from === '/cart'
      ? '/cart'
      : '/'


  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [facebookLoading, setFacebookLoading] = useState(false)
  const [facebookReady, setFacebookReady] = useState(false)

  const [error, setError] = useState('')

  const busy = loading || googleLoading || facebookLoading


  useEffect(() => {
    if (!FACEBOOK_APP_ID) return

    let active = true

    const initializeFacebook = () => {
      if (!active || !window.FB) return

      window.FB.init({
        appId: FACEBOOK_APP_ID,
        cookie: false,
        xfbml: false,
        version: 'v24.0'
      })

      setFacebookReady(true)
    }

    window.fbAsyncInit = initializeFacebook

    if (window.FB) {
      initializeFacebook()
    } else if (!document.getElementById('facebook-jssdk')) {
      const script = document.createElement('script')

      script.id = 'facebook-jssdk'
      script.src =
        'https://connect.facebook.net/es_LA/sdk.js'
      script.async = true
      script.defer = true

      script.onerror = () => {
        if (active) {
          setFacebookReady(false)
        }
      }

      document.body.appendChild(script)
    }

    return () => {
      active = false
    }
  }, [])


  const saveSession = (data, sessionRemembered = false) => {
    const token = data?.token || data?.access_token
    const user = data?.user

    if (!token || typeof token !== 'string') {
      throw new Error(
        'El servidor no devolvió un token de autenticación.'
      )
    }

    if (
      !user ||
      typeof user !== 'object' ||
      typeof user.email !== 'string' ||
      !user.email.trim()
    ) {
      throw new Error(
        'El servidor no devolvió los datos del usuario.'
      )
    }

    const userData = {
      id: user.id,
      name:
        typeof user.name === 'string' && user.name.trim()
          ? user.name.trim()
          : user.email.split('@')[0],
      email: user.email.trim(),
      username: user.username || null,
      picture: user.picture || null,
      role: user.role || 'USER',
      provider: user.provider || 'local'
    }

    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(userData))
    localStorage.setItem(
      'rememberMe',
      String(sessionRemembered)
    )

    // Actualizar componentes que dependen de la sesión.
    window.dispatchEvent(new Event('auth-change'))

    const isAdmin =
      userData.provider === 'local' &&
      String(userData.role).toUpperCase() === 'ADMIN'

    navigate(isAdmin ? '/admin' : from, {
      replace: true
    })
  }


  const validateIdentifier = (value) => {
    const cleanValue = value.trim()

    if (!cleanValue) {
      return 'Ingresa tu correo electrónico o usuario.'
    }

    if (cleanValue.length > 254) {
      return 'El correo o usuario es demasiado largo.'
    }

    if (/[\x00-\x1F\x7F]/.test(cleanValue)) {
      return 'El correo o usuario contiene caracteres no permitidos.'
    }

    if (cleanValue.includes('@')) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

      if (!emailRegex.test(cleanValue)) {
        return 'Ingresa un correo electrónico válido.'
      }
    } else {
      const usernameRegex = /^[a-zA-Z0-9_.-]{3,60}$/

      if (!usernameRegex.test(cleanValue)) {
        return 'Ingresa un nombre de usuario válido.'
      }
    }

    return null
  }

  const validatePassword = (value) => {
    if (!value) {
      return 'La contraseña es obligatoria.'
    }

    if (value.length > 128) {
      return 'La contraseña no puede superar los 128 caracteres.'
    }

    return null
  }


  const handleSubmit = async (event) => {
    event.preventDefault()

    if (busy) return

    setError('')

    const identifierError = validateIdentifier(identifier)
    const passwordError = validatePassword(password)

    if (identifierError || passwordError) {
      setError(identifierError || passwordError)
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
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            identifier: identifier.trim(),
            password,
            rememberMe
          })
        }
      )

      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        throw new Error(
          response.status === 401
            ? 'Usuario, correo o contraseña incorrectos.'
            : data.message ||
              data.error ||
              'No se pudo iniciar sesión.'
        )
      }

      saveSession(data, rememberMe)

    } catch (err) {
      console.error('Error de autenticación:', err)

      setError(
        err instanceof TypeError
          ? 'No se pudo conectar al servidor.'
          : err.message || 'Error al iniciar sesión.'
      )

    } finally {
      setLoading(false)
    }
  }


  const googleLogin = useGoogleLogin({
    flow: 'auth-code',
    ux_mode: 'popup',

    onSuccess: async (response) => {
      setError('')
      setGoogleLoading(true)

      try {
        if (!API_URL) {
          throw new Error('El servidor no está configurado.')
        }

        if (!response.code) {
          throw new Error(
            'Google no devolvió un código de autorización.'
          )
        }

        const result = await fetch(
          `${API_URL}/api/auth/google`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Requested-With': 'XmlHttpRequest'
            },
            body: JSON.stringify({
              code: response.code
            })
          }
        )

        const data = await result.json().catch(() => ({}))

        if (!result.ok) {
          throw new Error(
            data.message ||
            data.error ||
            'No se pudo autenticar con Google.'
          )
        }

        saveSession(data, false)

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

    onError: () => {
      setGoogleLoading(false)
      setError('No se pudo iniciar sesión con Google.')
    },

    onNonOAuthError: (googleError) => {
      setGoogleLoading(false)

      setError(
        googleError?.type === 'popup_closed'
          ? 'Se cerró la ventana de Google.'
          : 'No se pudo abrir la ventana de Google.'
      )
    }
  })

  const handleGoogleLogin = () => {
    if (busy) return

    setError('')

    if (!import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim()) {
      setError('Falta configurar el Client ID de Google.')
      return
    }

    if (!API_URL) {
      setError('El servidor no está configurado.')
      return
    }

    googleLogin()
  }


  const handleFacebookLogin = () => {
    if (busy) return

    setError('')

    if (!FACEBOOK_APP_ID) {
      setError(
        'Falta VITE_FACEBOOK_APP_ID en el archivo .env.'
      )
      return
    }

    if (!API_URL) {
      setError('El servidor no está configurado.')
      return
    }

    if (!facebookReady || !window.FB) {
      setError(
        'Facebook todavía no está disponible. ' +
        'Verifica el SDK y la configuración de Meta.'
      )
      return
    }

    setFacebookLoading(true)

    try {
      window.FB.login(
        async (facebookResponse) => {
          const accessToken =
            facebookResponse?.authResponse?.accessToken

          if (!accessToken) {
            setFacebookLoading(false)
            setError(
              'No se completó la autorización de Facebook.'
            )
            return
          }

          try {
            const response = await fetch(
              `${API_URL}/api/auth/facebook`,
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'X-Requested-With': 'XmlHttpRequest'
                },
                body: JSON.stringify({
                  accessToken
                })
              }
            )

            const data = await response.json().catch(() => ({}))

            if (!response.ok) {
              throw new Error(
                data.message ||
                data.error ||
                'No se pudo autenticar con Facebook.'
              )
            }

            saveSession(data, false)

          } catch (err) {
            console.error('Error Facebook:', err)

            setError(
              err instanceof TypeError
                ? 'No se pudo conectar al backend de Facebook.'
                : err.message ||
                  'Error al iniciar sesión con Facebook.'
            )

          } finally {
            setFacebookLoading(false)
          }
        },
        {
          scope: 'public_profile,email',
          return_scopes: true
        }
      )
    } catch (err) {
      console.error('Error abriendo Facebook:', err)
      setFacebookLoading(false)
      setError(
        'No se pudo abrir la ventana de Facebook.'
      )
    }
  }

  const handleForgotPassword = () => {
    navigate('/forgot-password')
  }


  return (
    <main className="login-page">

      {/* FONDO DECORATIVO */}

      <div className="login-bg-shape login-bg-shape-left" />
      <div className="login-bg-shape login-bg-shape-right" />

      {/* DECORACIÓN IZQUIERDA */}

      <div className="login-side login-side-left">
        <div className="shopping-bag">
          <div className="bag-handle" />
          <div className="bag-body">
            <span className="bag-cart">🛒</span>
          </div>
        </div>
      </div>

      {/* DECORACIÓN DERECHA */}

      <div className="login-side login-side-right">
        <div className="plant-box">
          <div className="plant" />
          <div className="pot" />
        </div>

        <div className="laptop-box">
          <div className="laptop-screen" />
          <div className="laptop-base" />
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

        {/* ERROR */}

        {error && (
          <div className="login-error" role="alert">
            {error}
          </div>
        )}

        {/* FORMULARIO TRADICIONAL */}

        <form
          className="login-form"
          onSubmit={handleSubmit}
        >

          <div className="form-group">
            <label htmlFor="identifier">
              Correo electrónico o usuario
            </label>

            <div className="input-wrapper">
              <span className="input-icon">✉</span>

              <input
                id="identifier"
                type="text"
                placeholder="Correo electrónico o usuario"
                value={identifier}
                onChange={(e) => {
                  setIdentifier(e.target.value)
                  setError('')
                }}
                maxLength={254}
                autoComplete="username"
                required
              />
            </div>
          </div>

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
              onClick={handleForgotPassword}
            >
              ¿Olvidaste tu contraseña?
            </button>
          </div>

          {/* INICIAR SESIÓN */}

          <button
            type="submit"
            className="login-button"
            disabled={busy}
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
            disabled={busy}
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
            disabled={busy}
          >
            <span className="facebook-icon">f</span>

            <span>
              {facebookLoading
                ? 'Conectando con Facebook...'
                : 'Continuar con Facebook'}
            </span>
          </button>

        </div>

        {/* REGISTRARSE */}

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
