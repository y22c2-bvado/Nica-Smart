const API_URL = 'https://nica-smart-backend.onrender.com';

export async function getProducts() {
  const response = await fetch(`${API_URL}/api/products`);
  if (!response.ok) throw new Error('Error al obtener productos');
  return response.json();
}

export async function getProductsByCategory(category) {
  const response = await fetch(`${API_URL}/api/products/category/${category}`);
  if (!response.ok) throw new Error('Error al filtrar productos');
  return response.json();
}

export async function getProductById(id) {
  const response = await fetch(`${API_URL}/api/products/${id}`);
  if (!response.ok) throw new Error('Producto no encontrado');
  return response.json();
}