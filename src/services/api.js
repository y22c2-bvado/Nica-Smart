

const API_URL = (
  import.meta.env.VITE_API_URL ||
  (
    import.meta.env.DEV
      ? 'http://localhost:3000'
      : 'https://nica-smart-backend.onrender.com'
  )
).replace(/\/+$/, '');


// ==========================================
// OBTENER TODOS LOS PRODUCTOS
// ==========================================

export async function getProducts() {
  const response = await fetch(
    `${API_URL}/api/products`
  );

  if (!response.ok) {
    throw new Error('Error al obtener productos');
  }

  return response.json();
}


// ==========================================
// FILTRAR PRODUCTOS POR CATEGORÍA
// ==========================================

export async function getProductsByCategory(category) {
  const response = await fetch(
    `${API_URL}/api/products/category/${encodeURIComponent(category)}`
  );

  if (!response.ok) {
    throw new Error('Error al filtrar productos');
  }

  return response.json();
}


// ==========================================
// OBTENER PRODUCTO POR ID
// ==========================================

export async function getProductById(id) {
  const response = await fetch(
    `${API_URL}/api/products/${encodeURIComponent(id)}`
  );

  if (!response.ok) {
    throw new Error('Producto no encontrado');
  }

  return response.json();
}
