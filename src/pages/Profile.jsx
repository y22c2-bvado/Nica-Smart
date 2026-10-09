
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import Header from '../components/Header'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

import '../styles/account.css'

function Profile() {
  const navigate = useNavigate()

  const getUser = () => {
    try {
      return JSON.parse(localStorage.getItem('user') || 'null')
    } catch {
      return null
    }
  }

  const [user, setUser] = useState(getUser)

  const [name, setName] = useState(user?.name || '')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const hasToken = Boolean(localStorage.getItem('token'))

  // ==========================================
  // GUARDAR CAMBIOS DEL PERFIL
  // ==========================================

  const saveProfile = (event) => {
    event.preventDefault()

    setError('')
    setMessage('')

    const cleanName = name.trim()

    if (cleanName.length < 2 || cleanName.length > 80) {
      setError('El nombre debe tener entre 2 y 80 caracteres.')
      return
    }

    if (/[\x00-\x1F\x7F]/.test(cleanName)) {
      setError('El nombre contiene caracteres no permitidos.')
      return
    }

    const updatedUser = {
      ...user,
      name: cleanName
    }

    try {
      localStorage.setItem('user', JSON.stringify(updatedUser))

      setUser(updatedUser)

      // Actualizar nombre del Header
      window.dispatchEvent(new Event('auth-change'))

      setMessage('Nombre actualizado correctamente.')
    } catch {
      setError('No se pudieron guardar los cambios.')
    }
  }

  // ==========================================
  // CAMBIAR FOTO DE PERFIL
  // ==========================================

  const changePhoto = (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    setError('')
    setMessage('')

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('Selecciona una imagen JPG, PNG o WEBP.')
      return
    }

    if (file.size > 1024 * 1024) {
      setError('La fotografía debe pesar menos de 1 MB.')
      return
    }

    const reader = new FileReader()

    reader.onload = () => {
      const updatedUser = {
        ...user,
        picture: reader.result
      }

      try {
        localStorage.setItem('user', JSON.stringify(updatedUser))

        setUser(updatedUser)

        window.dispatchEvent(new Event('auth-change'))

        setMessage('Fotografía actualizada correctamente.')
      } catch {
        setError('No hay espacio suficiente para guardar la fotografía.')
      }
    }

    reader.onerror = () => {
      setError('No se pudo leer la fotografía.')
    }

    reader.readAsDataURL(file)
    event.target.value = ''
  }

  return (
    <>
      <Header />
      <Navbar />

      <main className="account-page">
        <div className="account-container">

          <h1>Mi perfil</h1>

          <p className="account-subtitle">
            Personaliza tu cuenta de NICA S-MART.
          </p>

          {!user || !hasToken ? (
            <div className="account-card">
              <h2>Inicia sesión para ver tu perfil</h2>

              <button
                type="button"
                className="account-primary"
                onClick={() => navigate('/login')}
              >
                Iniciar sesión
              </button>
            </div>
          ) : (
            <div className="account-card">

              {/* FOTO DE PERFIL */}

              <div className="profile-photo-section">

                {user.picture ? (
                  <img
                    src={user.picture}
                    alt="Fotografía de perfil"
                    className="profile-photo"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="profile-photo-placeholder">
                    👤
                  </div>
                )}

                <div>
                  <h2>{user.name}</h2>
                  <p>{user.email}</p>

                  <label className="account-upload">
                    📷 Cambiar fotografía

                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={changePhoto}
                      hidden
                    />
                  </label>
                </div>
              </div>

              {/* FORMULARIO PARA EDITAR EL NOMBRE */}

              <form onSubmit={saveProfile}>

                <div className="profile-field">
                  <label htmlFor="profile-name">
                    Nombre de usuario
                  </label>

                  <input
                    id="profile-name"
                    type="text"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="Ingresa tu nombre"
                    minLength={2}
                    maxLength={80}
                    required
                  />

                  <small>
                    Este nombre aparecerá en el encabezado
                    de NICA S-MART.
                  </small>
                </div>

                {/* CORREO DE LA CUENTA */}

                <div className="profile-field">
                  <label htmlFor="profile-email">
                    Correo electrónico
                  </label>

                  <input
                    id="profile-email"
                    type="email"
                    value={user.email}
                    disabled
                  />

                  <small>
                    El correo de tu cuenta no se modifica aquí.
                  </small>
                </div>

                {message && (
                  <p className="account-success" role="status">
                    {message}
                  </p>
                )}

                {error && (
                  <p className="account-error" role="alert">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  className="account-primary"
                >
                  Guardar cambios
                </button>

              </form>

              <div className="profile-orders-link">
                <button
                  type="button"
                  className="account-primary"
                  onClick={() => navigate('/orders')}
                >
                  Ver mis pedidos
                </button>
              </div>

            </div>
          )}
        </div>
      </main>

      <Footer />
    </>
  )
}

export default Profile
