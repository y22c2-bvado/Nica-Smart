
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { GoogleOAuthProvider } from '@react-oauth/google'

import App from './App.jsx'
import { CartProvider } from './context/CartContext.jsx'

// ==========================================
// CONFIGURACIÓN DE GOOGLE OAUTH
// ==========================================

const googleClientId =
  import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim()

if (!googleClientId) {
  console.warn(
    'NICA S-MART: Falta configurar VITE_GOOGLE_CLIENT_ID en el archivo .env'
  )
}

// ==========================================
// INICIALIZAR REACT
// ==========================================

const root = createRoot(document.getElementById('root'))

const app = (
  <CartProvider>
    <App />
  </CartProvider>
)

root.render(
  <StrictMode>
    <GoogleOAuthProvider clientId={googleClientId || ''}>
      {app}
    </GoogleOAuthProvider>
  </StrictMode>
)
