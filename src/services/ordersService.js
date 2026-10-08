const API = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export async function createOrder(orderData) {
  const response = await fetch(`${API}/api/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(orderData),
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      data?.error || data?.message || 'No se pudo procesar la compra'
    );
  }

  return data;
}