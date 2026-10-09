
import { useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import {
  UserRound,
  ShoppingBag,
  Heart,
  MapPin,
  CreditCard,
  Settings,
  LogOut,
  Camera,
  Mail,
  Save,
  Package,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
  Truck,
  LockKeyhole,
  Home,
  ArrowRight,
  AlertCircle,
  LogIn
} from 'lucide-react'

import Header from '../components/Header'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

import '../styles/account.css'

function Profile() {
  const navigate = useNavigate()
  const fileInputRef = useRef(null)

  // ==========================================
  // OBTENER USUARIO ACTUAL
  // ==========================================

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
  const [activeSection, setActiveSection] = useState('profile')

  const hasToken = Boolean(localStorage.getItem('token'))
  const isAuthenticated = Boolean(user && hasToken)

  // ==========================================
  // MENÚ DE NAVEGACIÓN
  // ==========================================

  const menuItems = [
    {
      id: 'profile',
      label: 'Mi perfil',
      icon: UserRound,
      action: () => setActiveSection('profile')
    },
    {
      id: 'orders',
      label: 'Mis pedidos',
      icon: ShoppingBag,
      action: () => navigate('/orders')
    },
    {
      id: 'favorites',
      label: 'Mis favoritos',
      icon: Heart,
      action: () => setActiveSection('favorites')
    },
    {
      id: 'addresses',
      label: 'Mis direcciones',
      icon: MapPin,
      action: () => setActiveSection('addresses')
    },
    {
      id: 'payments',
      label: 'Métodos de pago',
      icon: CreditCard,
      action: () => setActiveSection('payments')
    },
    {
      id: 'settings',
      label: 'Configuración',
      icon: Settings,
      action: () => setActiveSection('settings')
    }
  ]

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

    // NOTA: Esta actualización es local.
    // Para persistirla en PostgreSQL se necesita
    // conectar un endpoint autenticado del backend.
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
      event.target.value = ''
      return
    }

    if (file.size > 1024 * 1024) {
      setError('La fotografía debe pesar menos de 1 MB.')
      event.target.value = ''
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

  // ==========================================
  // CERRAR SESIÓN
  // ==========================================

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')

    window.dispatchEvent(new Event('auth-change'))

    navigate('/login', { replace: true })
  }

  // ==========================================
  // CONTENIDO DE OTRAS SECCIONES
  // ==========================================

  const renderEmptySection = (Icon, title, description) => (
    <div className="account-empty-section">
      <div className="account-empty-icon">
        <Icon size={35} strokeWidth={1.6} />
      </div>

      <h3>{title}</h3>
      <p>{description}</p>

      <button
        type="button"
        className="account-outline-button"
        onClick={() => setActiveSection('profile')}
      >
        <ArrowRight size={17} />
        Volver a mi perfil
      </button>
    </div>
  )

  // ==========================================
  // RENDERIZADO
  // ==========================================

  return (
    <>
      <Header />
      <Navbar />

      <main className="account-page">
        <div className="account-container">

          {/* NAVEGACIÓN SUPERIOR */}

          <div className="account-breadcrumb">
            <Link to="/">
              <Home size={16} />
              Inicio
            </Link>

            <ChevronRight size={15} />

            <span>Mi cuenta</span>
          </div>

          {/* ENCABEZADO PRINCIPAL */}

          <div className="account-page-heading">
            <div>
              <span className="account-eyebrow">
                TU ESPACIO PERSONAL
              </span>

              <h1>
                Mi perfil<span>.</span>
              </h1>

              <p>
                Administra tu información, consulta tus compras
                y personaliza tu experiencia en NICA S-MART.
              </p>
            </div>

            {isAuthenticated && (
              <div className="account-active-status">
                <span className="account-status-dot" />

                <div>
                  <strong>Cuenta activa</strong>
                  <small>Has iniciado sesión</small>
                </div>

                <ShieldCheck size={24} />
              </div>
            )}
          </div>

          {/* USUARIO SIN SESIÓN */}

          {!isAuthenticated ? (
            <div className="account-login-required">
              <div className="account-login-icon">
                <LockKeyhole size={36} />
              </div>

              <h2>Inicia sesión para continuar</h2>

              <p>
                Accede a tu perfil, revisa tus pedidos
                y administra tu información personal.
              </p>

              <button
                type="button"
                className="account-primary"
                onClick={() => navigate('/login')}
              >
                <LogIn size={19} />
                Iniciar sesión
              </button>
            </div>
          ) : (
            <div className="account-dashboard">

              {/* ==================================
                  MENÚ LATERAL
              ================================== */}

              <aside className="account-sidebar">

                <div className="account-sidebar-user">

                  <div className="account-sidebar-avatar">
                    {user.picture ? (
                      <img
                        src={user.picture}
                        alt="Foto de usuario"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <UserRound size={26} />
                    )}
                  </div>

                  <div className="account-sidebar-details">
                    <strong>{user.name}</strong>
                    <small>Mi cuenta</small>
                  </div>

                </div>

                <p className="account-menu-title">
                  MI CUENTA
                </p>

                <nav className="account-sidebar-menu" aria-label="Menú de cuenta">
                  {menuItems.map((item) => {
                    const Icon = item.icon

                    return (
                      <button
                        key={item.id}
                        type="button"
                        className={`account-menu-item ${
                          activeSection === item.id ? 'active' : ''
                        }`}
                        onClick={() => {
                          setError('')
                          setMessage('')
                          item.action()
                        }}
                      >
                        <Icon size={20} strokeWidth={1.9} />

                        <span>{item.label}</span>

                        {activeSection === item.id && (
                          <ChevronRight
                            size={17}
                            className="account-menu-arrow"
                          />
                        )}
                      </button>
                    )
                  })}
                </nav>

                <div className="account-sidebar-bottom">
                  <button
                    type="button"
                    className="account-menu-item account-logout"
                    onClick={logout}
                  >
                    <LogOut size={20} />
                    <span>Cerrar sesión</span>
                  </button>
                </div>

              </aside>

              {/* ==================================
                  PANEL PRINCIPAL
              ================================== */}

              <section className="account-profile-card">

                {/* PORTADA */}

                <div className="account-cover">
                  <div className="account-cover-circle circle-one" />
                  <div className="account-cover-circle circle-two" />

                  <div className="account-cover-brand">
                    NICA <span>S-MART</span>
                    <small>MI CUENTA</small>
                  </div>
                </div>

                {/* INFORMACIÓN DE IDENTIDAD */}

                <div className="account-profile-identity">

                  <div className="account-avatar-wrapper">

                    {user.picture ? (
                      <img
                        src={user.picture}
                        alt="Fotografía de perfil"
                        className="account-profile-avatar"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="account-avatar-placeholder">
                        <UserRound size={55} />
                      </div>
                    )}

                    <button
                      type="button"
                      className="account-avatar-camera"
                      title="Cambiar fotografía"
                      aria-label="Cambiar fotografía"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Camera size={18} />
                    </button>

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={changePhoto}
                      hidden
                    />

                  </div>

                  <div className="account-identity-details">

                    <div className="account-identity-name">
                      <h2>{user.name}</h2>
                      <CheckCircle2 size={21} />
                    </div>

                    <p>{user.email}</p>

                    <button
                      type="button"
                      className="account-change-photo"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Camera size={16} />
                      Cambiar fotografía
                    </button>

                  </div>

                </div>

                {/* CONTENIDO */}

                <div className="account-profile-content">

                  {message && (
                    <div
                      className="account-success"
                      role="status"
                    >
                      <CheckCircle2 size={19} />
                      {message}
                    </div>
                  )}

                  {error && (
                    <div
                      className="account-error"
                      role="alert"
                    >
                      <AlertCircle size={19} />
                      {error}
                    </div>
                  )}

                  {activeSection === 'profile' && (
                    <>

                      <div className="account-section-heading">

                        <div className="account-section-icon">
                          <UserRound size={21} />
                        </div>

                        <div>
                          <h3>Información de la cuenta</h3>
                          <p>
                            Actualiza tus datos personales
                            y mantén tu perfil al día.
                          </p>
                        </div>

                      </div>

                      <form
                        className="account-profile-form"
                        onSubmit={saveProfile}
                      >

                        {/* NOMBRE */}

                        <div className="account-form-field">

                          <label htmlFor="profile-name">
                            Nombre de usuario
                          </label>

                          <div className="account-input-group">

                            <UserRound size={19} />

                            <input
                              id="profile-name"
                              type="text"
                              value={name}
                              onChange={(event) =>
                                setName(event.target.value)
                              }
                              placeholder="Ingresa tu nombre"
                              minLength={2}
                              maxLength={80}
                              required
                            />

                          </div>

                          <small>
                            Este nombre aparecerá en el encabezado
                            de NICA S-MART.
                          </small>

                        </div>

                        {/* CORREO */}

                        <div className="account-form-field">

                          <label htmlFor="profile-email">
                            Correo electrónico
                          </label>

                          <div className="account-input-group readonly">

                            <Mail size={19} />

                            <input
                              id="profile-email"
                              type="email"
                              value={user.email || ''}
                              readOnly
                            />

                            <LockKeyhole size={17} />

                          </div>

                          <small>
                            El correo de tu cuenta no se modifica aquí.
                          </small>

                        </div>

                        {/* BOTONES */}

                        <div className="account-profile-actions">

                          <button
                            type="submit"
                            className="account-primary"
                          >
                            <Save size={19} />
                            Guardar cambios
                          </button>

                          <button
                            type="button"
                            className="account-outline-button"
                            onClick={() => navigate('/orders')}
                          >
                            <Package size={19} />
                            Ver mis pedidos
                          </button>

                        </div>

                      </form>

                      {/* SEGURIDAD */}

                      <div className="account-security-note">

                        <ShieldCheck size={23} />

                        <div>
                          <strong>
                            Tu información es importante
                          </strong>

                          <p>
                            Mantén tus datos actualizados para
                            disfrutar de una mejor experiencia
                            de compra.
                          </p>
                        </div>

                      </div>

                    </>
                  )}

                  {activeSection === 'favorites' &&
                    renderEmptySection(
                      Heart,
                      'Mis favoritos',
                      'Próximamente podrás consultar aquí los productos que hayas guardado como favoritos.'
                    )
                  }

                  {activeSection === 'addresses' &&
                    renderEmptySection(
                      MapPin,
                      'Mis direcciones',
                      'Aquí podrás administrar tus direcciones de entrega cuando esta función esté disponible.'
                    )
                  }

                  {activeSection === 'payments' &&
                    renderEmptySection(
                      CreditCard,
                      'Métodos de pago',
                      'Próximamente podrás consultar y administrar tus métodos de pago.'
                    )
                  }

                  {activeSection === 'settings' &&
                    renderEmptySection(
                      Settings,
                      'Configuración de la cuenta',
                      'Estamos preparando nuevas opciones para personalizar tu experiencia.'
                    )
                  }

                </div>

              </section>

            </div>
          )}

          {/* BENEFICIOS */}

          <div className="account-benefits">

            <div>
              <Truck size={22} />
              <span>Envíos a toda Nicaragua</span>
            </div>

            <div>
              <ShieldCheck size={22} />
              <span>Compra con confianza</span>
            </div>

            <div>
              <Package size={22} />
              <span>Seguimiento de pedidos</span>
            </div>

          </div>

        </div>
      </main>

      <Footer />
    </>
  )
}

export default Profile
