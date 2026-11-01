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
import NewArrivals from './pages/NewArrivals' // <-- IMPORTAMOS TU COMPONENTE

// ==========================================
// PROMOCIONES AUTOMÁTICAS
// ==========================================

import Promotions from './pages/Promotions'

// ==========================================
// AUTENTICACIÓN Y REGISTRO
// ==========================================

import Login from './pages/Login'
import Register from './pages/Register'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'

// ==========================================
// CARRITOS Y COMPRAS
// ==========================================

import Cart from './pages/Cart'
import PromoCart from './pages/PromoCart'
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
        <Route path="/" element={<Home />} />

        {/* NUEVOS INGRESOS (Usando tu componente) */}
        <Route path="/new" element={<NewArrivals />} />

        {/* PROMOCIONES DE TEMPORADA */}
        <Route path="/promotions" element={<Promotions />} />

        {/* CARRITO PROMOCIONAL */}
        <Route path="/promo-cart" element={<PromoCart />} />

        {/* INICIO DE SESIÓN */}
        <Route path="/login" element={<Login />} />

        {/* REGISTRO DE CLIENTES */}
        <Route path="/register" element={<Register />} />

        {/* RECUPERAR CONTRASEÑA */}
        <Route path="/forgot-password" element={<ForgotPassword />} />

        {/* RESTABLECER CONTRASEÑA */}
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* CATÁLOGO DE PRODUCTOS */}
        <Route path="/products" element={<Products />} />

        {/* CATEGORÍAS */}
        <Route path="/categories" element={<Categories />} />

        {/* DETALLE DE PRODUCTO */}
        <Route path="/product/:id" element={<ProductDetail />} />

        {/* CARRITO NORMAL */}
        <Route path="/cart" element={<Cart />} />

        {/* CONFIRMACIÓN DE COMPRA */}
        <Route path="/checkout" element={<Checkout />} />

        {/* PERFIL DEL CLIENTE */}
        <Route path="/profile" element={<Profile />} />

        {/* HISTORIAL DE PEDIDOS */}
        <Route path="/orders" element={<MyOrders />} />

        {/* PANEL DE ADMINISTRACIÓN */}
        <Route path="/admin" element={<Admin />} />

      </Routes>
    </BrowserRouter>
  )
}

export default App