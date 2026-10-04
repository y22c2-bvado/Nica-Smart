const products = [
    
  {
    id: 1,
    name: 'AirPods 2da Generación',
    category: 'Audio',
    price: 2490,
    stock: 15,
    image: 'https://placehold.co/500x500/f5f5f5/222?text=AirPods',
    description:
      'Audífonos inalámbricos con conexión Bluetooth y estuche de carga.',
  },

  {
    id: 2,
    name: 'Audífonos Bluetooth Inalámbricos',
    category: 'Audio',
    price: 1200,
    stock: 20,
    image: 'https://placehold.co/500x500/f5f5f5/222?text=Audifonos+Bluetooth',
    description:
      'Audífonos inalámbricos ideales para música, llamadas y uso diario.',
  },

  {
    id: 3,
    name: 'Cargador Rápido USB-C 35W',
    category: 'Cargadores',
    price: 850,
    stock: 25,
    image: 'https://placehold.co/500x500/f5f5f5/222?text=Cargador+35W',
    description:
      'Cargador USB-C de carga rápida compatible con múltiples dispositivos.',
  },

  {
    id: 4,
    name: 'Cargador Rápido USB-C 65W',
    category: 'Cargadores',
    price: 1450,
    stock: 18,
    image: 'https://placehold.co/500x500/f5f5f5/222?text=Cargador+65W',
    description:
      'Cargador USB-C de alta potencia para teléfonos, tablets y laptops compatibles.',
  },

  {
    id: 5,
    name: 'Cable USB-C a USB-C',
    category: 'Cables',
    price: 350,
    stock: 40,
    image: 'https://placehold.co/500x500/f5f5f5/222?text=USB-C+a+USB-C',
    description:
      'Cable USB-C para carga rápida y transferencia de datos.',
  },

  {
    id: 6,
    name: 'Cable USB-C a Lightning',
    category: 'Cables',
    price: 450,
    stock: 35,
    image: 'https://placehold.co/500x500/f5f5f5/222?text=USB-C+Lightning',
    description:
      'Cable compatible con dispositivos que utilizan conexión Lightning.',
  },

  {
    id: 7,
    name: 'Cable HDMI 2.1',
    category: 'Cables',
    price: 550,
    stock: 22,
    image: 'https://placehold.co/500x500/f5f5f5/222?text=HDMI+2.1',
    description:
      'Cable HDMI para transmisión de audio y video en alta resolución.',
  },

  {
    id: 8,
    name: 'Power Bank 10,000 mAh',
    category: 'Energía',
    price: 1200,
    stock: 17,
    image: 'https://placehold.co/500x500/f5f5f5/222?text=Power+Bank+10000',
    description:
      'Batería portátil para cargar dispositivos móviles durante el día.',
  },

  {
    id: 9,
    name: 'Power Bank 20,000 mAh',
    category: 'Energía',
    price: 1850,
    stock: 12,
    image: 'https://placehold.co/500x500/f5f5f5/222?text=Power+Bank+20000',
    description:
      'Batería portátil de gran capacidad para múltiples cargas.',
  },

  {
    id: 10,
    name: 'Smartwatch X1',
    category: 'Relojes',
    price: 3200,
    stock: 10,
    image: 'https://placehold.co/500x500/f5f5f5/222?text=Smartwatch',
    description:
      'Reloj inteligente con conectividad Bluetooth y funciones deportivas.',
  },

  {
    id: 11,
    name: 'Soporte Ajustable para Laptop',
    category: 'Soportes',
    price: 950,
    stock: 14,
    image: 'https://placehold.co/500x500/f5f5f5/222?text=Soporte+Laptop',
    description:
      'Soporte ajustable para mejorar la posición y ventilación de la laptop.',
  },

  {
    id: 12,
    name: 'Soporte Magnético para Celular',
    category: 'Soportes',
    price: 550,
    stock: 30,
    image: 'https://placehold.co/500x500/f5f5f5/222?text=Soporte+Celular',
    description:
      'Soporte magnético compacto para teléfonos móviles.',
  },

  {
    id: 13,
    name: 'Mouse Inalámbrico',
    category: 'Computación',
    price: 650,
    stock: 28,
    image: 'https://placehold.co/500x500/f5f5f5/222?text=Mouse',
    description:
      'Mouse inalámbrico para computadora y laptop.',
  },

  {
    id: 14,
    name: 'Teclado Mecánico RGB',
    category: 'Gaming',
    price: 2200,
    stock: 13,
    image: 'https://placehold.co/500x500/f5f5f5/222?text=Teclado+RGB',
    description:
      'Teclado mecánico con iluminación RGB para gaming y productividad.',
  },

  {
    id: 15,
    name: 'Hub USB-C Multipuerto',
    category: 'Adaptadores',
    price: 1450,
    stock: 19,
    image: 'https://placehold.co/500x500/f5f5f5/222?text=Hub+USB-C',
    description:
      'Hub USB-C con múltiples conexiones para distintos dispositivos.',
  },

  {
    id: 16,
    name: 'Adaptador USB-C a HDMI',
    category: 'Adaptadores',
    price: 750,
    stock: 21,
    image: 'https://placehold.co/500x500/f5f5f5/222?text=USB-C+a+HDMI',
    description:
      'Adaptador para conectar dispositivos USB-C a pantallas HDMI.',
  },

  {
    id: 17,
    name: 'Webcam Full HD 1080p',
    category: 'Computación',
    price: 1800,
    stock: 16,
    image: 'https://placehold.co/500x500/f5f5f5/222?text=Webcam+1080p',
    description:
      'Cámara web Full HD para videollamadas, clases y reuniones.',
  },

  {
    id: 18,
    name: 'Bocina Bluetooth Portátil',
    category: 'Audio',
    price: 1600,
    stock: 18,
    image: 'https://placehold.co/500x500/f5f5f5/222?text=Bocina+Bluetooth',
    description:
      'Bocina portátil con conexión Bluetooth y batería recargable.',
  },

  {
    id: 19,
    name: 'Control Inalámbrico para Gaming',
    category: 'Gaming',
    price: 1900,
    stock: 14,
    image: 'https://placehold.co/500x500/f5f5f5/222?text=Control+Gaming',
    description:
      'Control inalámbrico para videojuegos y diferentes dispositivos.',
  },

  {
    id: 20,
    name: 'Base de Carga Inalámbrica',
    category: 'Cargadores',
    price: 1100,
    stock: 24,
    image: 'https://placehold.co/500x500/f5f5f5/222?text=Carga+Inalambrica',
    description:
      'Base de carga inalámbrica para teléfonos compatibles.',
  },
]

export default products