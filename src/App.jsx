
import './App.css'

import {
  BrowserRouter,
  Routes,
  Route,
} from 'react-router-dom'

import Home from './pages/Home'
import Login from './pages/Login'
import Products from './pages/Products'
import Categories from './pages/Categories'
import Cart from './pages/Cart'
import Admin from './pages/Admin'
import ProductDetail from './pages/ProductDetail'

// PÁGINA DE CONFIRMACIÓN DE COMPRA
import Checkout from './pages/Checkout'

// PERFIL DEL CLIENTE
import Profile from './pages/Profile'

// HISTORIAL DE PEDIDOS
import MyOrders from './pages/MyOrders'

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

        {/* CARRITO */}
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

        {/* DETALLE DEL PRODUCTO */}
        <Route
          path="/product/:id"
          element={<ProductDetail />}
        />

      </Routes>
    </BrowserRouter>
  )
}

export default App
