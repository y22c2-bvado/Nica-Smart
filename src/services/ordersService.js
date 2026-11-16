const API = (
  import.meta.env.VITE_API_URL ||
  (
    import.meta.env.DEV
      ? 'http://localhost:3000'
      : 'https://nica-smart-backend.onrender.com'
  )
).replace(/\/+$/, '');

export async function createOrder(orderData) {
  try {
    const token = localStorage.getItem('token')
    const response = await fetch(`${API}/api/orders`, {
      method: 'POST',

      headers: {
        'Content-Type': 'application/json',

        ...(token
          ? { Authorization: `Bearer ${token}` }
          : {})
      },

      body: JSON.stringify(orderData)
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      throw new Error(
        data?.error ||
        data?.message ||
        'No se pudo procesar la compra'
      );
    }

    return data;

  } catch (error) {
    console.error(
      'Error al crear el pedido:',
      error.message
    );

    throw error;
  }
}
