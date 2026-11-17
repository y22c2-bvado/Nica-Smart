import './App.css'

import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation
} from 'react-router-dom'

import { jwtDecode } from 'jwt-decode' // <-- NUEVA IMPORTACIÓN

import ScrollToTop from './components/ScrollToTop'
import Home from './pages/Home'
import Products from './pages/Products'
import Categories from './pages/Categories'
import ProductDetail from './pages/ProductDetail'
import NewArrivals from './pages/NewArrivals'
import Brands from './pages/Brands'
import Contact from './pages/Contact'
import Help from './pages/Help'
import Tracking from './pages/Tracking'
import Promotions from './pages/Promotions'
import PromoCart from './pages/PromoCart'
import Login from './pages/Login'
import Register from './pages/Register'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import Cart from './pages/Cart'
import Checkout from './pages/Checkout'
import MyOrders from './pages/MyOrders'
import Profile from './pages/Profile'
import Admin from './pages/Admin'
import Privacy from './pages/Privacy'
import Terms from './pages/Terms'
import DataDeletion from './pages/DataDeletion'

function RequireAuth({ children, requireAdmin = false }) {
  const location = useLocation()
  const token = localStorage.getItem('token')

  // 1. Si no hay token, redirigir al login
  if (!token) {
    return (
      <Navigate
        to="/login"
        replace
        state={{
          from:
            location.pathname +
            location.search +
            location.hash
        }}
      />
    )
  }

  try {
    const decoded = jwtDecode(token)


    if (decoded.exp * 1000 < Date.now()) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      return <Navigate to="/login" replace />
    }

    if (requireAdmin && decoded.role?.toLowerCase() !== 'admin') {
      return <Navigate to="/" replace />
    }

  } catch (error) {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    return <Navigate to="/login" replace />
  }

  return children
}

function App() {
  return (
    <BrowserRouter>

      {/* SUBIR AL INICIO AL CAMBIAR DE PÁGINA */}
      <ScrollToTop />

      <Routes>

        {/* ==================================
            INICIO
        ================================== */}

        <Route
          path="/"
          element={<Home />}
        />

        {/* ==================================
            PRODUCTOS
        ================================== */}

        <Route
          path="/products"
          element={<Products />}
        />

        <Route
          path="/categories"
          element={<Categories />}
        />

        <Route
          path="/product/:id"
          element={<ProductDetail />}
        />

        {/* ==================================
            NUEVOS PRODUCTOS
        ================================== */}

        <Route
          path="/new-products"
          element={<NewArrivals />}
        />

        <Route
          path="/new"
          element={
            <Navigate
              to="/new-products"
              replace
            />
          }
        />

        {/* ==================================
            MARCAS Y CONTACTO
        ================================== */}

        <Route
          path="/brands"
          element={<Brands />}
        />

        <Route
          path="/contact"
          element={<Contact />}
        />

        {/* ==================================
            CENTRO DE AYUDA
        ================================== */}

        <Route
          path="/help"
          element={<Help />}
        />

        <Route
          path="/faq"
          element={<Help />}
        />

        {/* ==================================
            PROMOCIONES
        ================================== */}

        <Route
          path="/promotions"
          element={<Promotions />}
        />

        <Route
          path="/promo-cart"
          element={<PromoCart />}
        />

        {/* ==================================
            AUTENTICACIÓN
        ================================== */}

        <Route
          path="/login"
          element={<Login />}
        />

        <Route
          path="/register"
          element={<Register />}
        />

        <Route
          path="/forgot-password"
          element={<ForgotPassword />}
        />

        <Route
          path="/reset-password"
          element={<ResetPassword />}
        />

        {/* ==================================
            CARRITO
        ================================== */}

        <Route
          path="/cart"
          element={<Cart />}
        />

        {/* ==================================
            FINALIZAR COMPRA
        ================================== */}

        <Route
          path="/checkout"
          element={
            <RequireAuth>
              <Checkout />
            </RequireAuth>
          }
        />

        {/* ==================================
            MIS PEDIDOS
        ================================== */}

        <Route
          path="/orders"
          element={
            <RequireAuth>
              <MyOrders />
            </RequireAuth>
          }
        />

        <Route
          path="/my-orders"
          element={
            <Navigate
              to="/orders"
              replace
            />
          }
        />

        {/* ==================================
            SEGUIMIENTO GENERAL
        ================================== */}

        <Route
          path="/tracking"
          element={
            <RequireAuth>
              <Tracking />
            </RequireAuth>
          }
        />

        {/* ==================================
            SEGUIMIENTO INDIVIDUAL
        ================================== */}

        <Route
          path="/tracking/:id"
          element={
            <RequireAuth>
              <Tracking />
            </RequireAuth>
          }
        />

        {/* ==================================
            PERFIL DEL CLIENTE
        ================================== */}

        <Route
          path="/profile"
          element={
            <RequireAuth>
              <Profile />
            </RequireAuth>
          }
        />

        {/* ==================================
            PANEL ADMINISTRATIVO (Protegido con Rol)
        ================================== */}

        <Route
          path="/admin"
          element={
            <RequireAuth requireAdmin={true}>
              <Admin />
            </RequireAuth>
          }
        />

        {/* ==================================
            POLÍTICA DE PRIVACIDAD
        ================================== */}

        <Route
          path="/privacy"
          element={<Privacy />}
        />

        {/* ==================================
            TÉRMINOS Y CONDICIONES
        ================================== */}

        <Route
          path="/terms"
          element={<Terms />}
        />

        {/* ==================================
            ELIMINACIÓN DE DATOS
        ================================== */}

        <Route
          path="/data-deletion"
          element={<DataDeletion />}
        />

        {/* ==================================
            RUTA NO ENCONTRADA
        ================================== */}

        <Route
          path="*"
          element={
            <Navigate
              to="/"
              replace
            />
          }
        />

      </Routes>

    </BrowserRouter>
  )
}

export default App