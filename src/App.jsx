
import './App.css'

import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation
} from 'react-router-dom'

import ScrollToTop from './components/ScrollToTop'

// ==========================================
// PÁGINAS PRINCIPALES
// ==========================================

import Home from './pages/Home'
import Products from './pages/Products'
import Categories from './pages/Categories'
import ProductDetail from './pages/ProductDetail'
import NewArrivals from './pages/NewArrivals'
import Brands from './pages/Brands'
import Contact from './pages/Contact'
import Help from './pages/Help'
import Tracking from './pages/Tracking'

// ==========================================
// PROMOCIONES
// ==========================================

import Promotions from './pages/Promotions'
import PromoCart from './pages/PromoCart'

// ==========================================
// AUTENTICACIÓN
// ==========================================

import Login from './pages/Login'
import Register from './pages/Register'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'

// ==========================================
// COMPRAS Y USUARIOS
// ==========================================

import Cart from './pages/Cart'
import Checkout from './pages/Checkout'
import MyOrders from './pages/MyOrders'
import Profile from './pages/Profile'
import Admin from './pages/Admin'

// ==========================================
// PÁGINAS LEGALES - GOOGLE Y FACEBOOK
// ==========================================

import Privacy from './pages/Privacy'
import Terms from './pages/Terms'
import DataDeletion from './pages/DataDeletion'

// ==========================================
// PROTECCIÓN DE RUTAS PRIVADAS
// ==========================================

function RequireAuth({ children }) {
  const location = useLocation()
  const token = localStorage.getItem('token')

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

  return children
}

// ==========================================
// APLICACIÓN PRINCIPAL
// ==========================================

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
            PANEL ADMINISTRATIVO
        ================================== */}

        <Route
          path="/admin"
          element={
            <RequireAuth>
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
