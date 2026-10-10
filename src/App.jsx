
import './App.css'

import {
  BrowserRouter,
  Routes,
  Route,
} from 'react-router-dom'

// ==========================================
// PÁGINAS PRINCIPALES
// ==========================================

import Home from './pages/Home'
import Products from './pages/Products'
import Categories from './pages/Categories'
import ProductDetail from './pages/ProductDetail'

// ==========================================
// AUTENTICACIÓN Y REGISTRO
// ==========================================

import Login from './pages/Login'
import Register from './pages/Register'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'

// ==========================================
// CARRITO Y COMPRAS
// ==========================================

import Cart from './pages/Cart'
import Checkout from './pages/Checkout'
import MyOrders from './pages/MyOrders'

// ==========================================
// PERFIL Y ADMINISTRACIÓN
// ==========================================

import Profile from './pages/Profile'
import Admin from './pages/Admin'

// ==========================================
// COMPONENTE PRINCIPAL
// ==========================================

function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* PÁGINA PRINCIPAL */}
        <Route
          path="/"
          element={<Home />}
        />

        {/* INICIO DE SESIÓN */}
        <Route
          path="/login"
          element={<Login />}
        />

        {/* REGISTRO DE CLIENTES */}
        <Route
          path="/register"
          element={<Register />}
        />

        {/* OLVIDÉ MI CONTRASEÑA */}
        <Route
          path="/forgot-password"
          element={<ForgotPassword />}
        />

        {/* RESTABLECER CONTRASEÑA */}
        <Route
          path="/reset-password"
          element={<ResetPassword />}
        />

        {/* PRODUCTOS */}
        <Route
          path="/products"
          element={<Products />}
        />

        {/* CATEGORÍAS */}
        <Route
          path="/categories"
          element={<Categories />}
        />

        {/* DETALLE DEL PRODUCTO */}
        <Route
          path="/product/:id"
          element={<ProductDetail />}
        />

        {/* CARRITO DE COMPRAS */}
        <Route
          path="/cart"
          element={<Cart />}
        />

        {/* CONFIRMACIÓN DE COMPRA */}
        <Route
          path="/checkout"
          element={<Checkout />}
        />

        {/* PERFIL DEL CLIENTE */}
        <Route
          path="/profile"
          element={<Profile />}
        />

        {/* HISTORIAL DE PEDIDOS */}
        <Route
          path="/orders"
          element={<MyOrders />}
        />

        {/* PANEL DE ADMINISTRACIÓN */}
        <Route
          path="/admin"
          element={<Admin />}
        />

      </Routes>
    </BrowserRouter>
  )
}

export default App
