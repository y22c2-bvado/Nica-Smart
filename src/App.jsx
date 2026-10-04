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

function App() {
  return (
    <BrowserRouter>
      <Routes>

        <Route
          path="/"
          element={<Home />}
        />

        <Route
          path="/login"
          element={<Login />}
        />

        <Route
          path="/products"
          element={<Products />}
        />

        <Route
          path="/categories"
          element={<Categories />}
        />

        <Route
          path="/cart"
          element={<Cart />}
        />

        <Route
          path="/admin"
          element={<Admin />}
        />

        <Route
          path="/product/:id"
          element={<ProductDetail />}
        />

      </Routes>
    </BrowserRouter>
  )
}

export default App