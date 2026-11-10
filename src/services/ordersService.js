
/* ==========================================
   NICA S-MART - SERVICIO DE PEDIDOS
   ========================================== */

// ==========================================
// CONFIGURACIÓN DE LA API
// ==========================================

const API = (
  import.meta.env.VITE_API_URL ||
  (
    import.meta.env.DEV
      ? 'http://localhost:3000'
      : 'https://nica-smart-backend.onrender.com'
  )
).replace(/\/+$/, '');


// ==========================================
// CREAR PEDIDO
// ==========================================

export async function createOrder(orderData) {
  try {
    // Obtener el token de autenticación
    const token = localStorage.getItem('token');

    // Enviar pedido al backend
    const response = await fetch(`${API}/api/orders`, {
      method: 'POST',

      headers: {
        'Content-Type': 'application/json',

        // Enviar JWT si el usuario inició sesión
        ...(token
          ? { Authorization: `Bearer ${token}` }
          : {})
      },

      body: JSON.stringify(orderData)
    });

    // Leer respuesta del servidor
    const data = await response.json().catch(() => null);

    // Manejar errores del backend
    if (!response.ok) {
      throw new Error(
        data?.error ||
        data?.message ||
        'No se pudo procesar la compra'
      );
    }

    // Devolver pedido creado
    return data;

  } catch (error) {
    console.error(
      'Error al crear el pedido:',
      error.message
    );

    throw error;
  }
}
