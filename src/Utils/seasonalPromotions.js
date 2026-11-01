
/* ============================================
   NICA S-MART
   SISTEMA DE PROMOCIONES AUTOMÁTICAS
============================================ */

export const NICARAGUA_TIMEZONE = "America/Managua";

// CONFIGURACIÓN DE CAMPAÑAS MENSUALES
export const monthlyCampaigns = {
  1: {
    id: "new-year",
    name: "Año Nuevo",
    label: "OFERTAS DE ENERO",
    title: "Año Nuevo Tech",
    description: "Comienza el año con nueva tecnología.",
    coupon: "ENERO10",
    colors: ["#0755d7", "#18a9eb"],
    image: "/seasons/enero.webp",
    keywords: [
      "computadora", "laptop", "monitor",
      "teclado", "mouse", "accesorio",
    ],
    miniPromo1Title: "Renueva tu tecnología",
    miniPromo1Text: "Dispositivos para comenzar el año",
    miniPromo2Title: "Tecnología destacada",
    miniPromo2Text: "Explora nuestro catálogo",
  },

  2: {
    id: "valentine",
    name: "San Valentín",
    label: "MES DEL AMOR",
    title: "San Valentín Tech",
    description: "Regala tecnología a alguien especial.",
    coupon: "AMOR15",
    colors: ["#ab124b", "#f472b6"],
    image: "/seasons/febrero.webp",
    keywords: [
      "audifono", "smartwatch", "reloj",
      "parlante", "celular", "regalo",
    ],
    miniPromo1Title: "Regalos tecnológicos",
    miniPromo1Text: "Sorprende a alguien especial",
    miniPromo2Title: "Especial San Valentín",
    miniPromo2Text: "Dispositivos para regalar",
  },

  3: {
    id: "march",
    name: "Marzo",
    label: "ESPECIAL DE MARZO",
    title: "Marzo Tech",
    description: "Renueva tus accesorios tecnológicos.",
    coupon: "MARZO10",
    colors: ["#176a50", "#32b78a"],
    image: "/seasons/marzo.webp",
    keywords: [
      "accesorio", "mouse", "teclado",
      "cargador", "usb", "cable",
    ],
    miniPromo1Title: "Accesorios Tech",
    miniPromo1Text: "Actualiza tus dispositivos",
    miniPromo2Title: "Favoritos del mes",
    miniPromo2Text: "Descubre productos destacados",
  },

  4: {
    id: "summer",
    name: "Verano",
    label: "TEMPORADA DE VERANO",
    title: "Verano Tech",
    description: "Tecnología para tus vacaciones.",
    coupon: "VERANO15",
    colors: ["#d35400", "#f9b233"],
    image: "/seasons/abril.webp",
    keywords: [
      "parlante", "audifono", "power bank",
      "cargador", "celular", "camara",
    ],
    miniPromo1Title: "Verano tecnológico",
    miniPromo1Text: "Accesorios para tus vacaciones",
    miniPromo2Title: "Lleva tu música",
    miniPromo2Text: "Explora audio y accesorios",
  },

  5: {
    id: "mothers",
    name: "Día de las Madres",
    label: "MES DE MAMÁ",
    title: "Regalos para Mamá",
    description: "Sorprende a mamá con tecnología.",
    coupon: "MAMA15",
    colors: ["#b11e66", "#f3a5c4"],
    image: "/seasons/mayo.webp",
    keywords: [
      "smartwatch", "reloj", "audifono",
      "celular", "tablet", "parlante",
    ],
    miniPromo1Title: "Regalos para mamá",
    miniPromo1Text: "Encuentra un detalle especial",
    miniPromo2Title: "Tecnología para mamá",
    miniPromo2Text: "Dispositivos destacados",
  },

  6: {
    id: "fathers",
    name: "Día del Padre",
    label: "MES DE PAPÁ",
    title: "Regalos para Papá",
    description: "Encuentra su regalo tecnológico.",
    coupon: "PAPA15",
    colors: ["#113d85", "#419add"],
    image: "/seasons/junio.webp",
    keywords: [
      "reloj", "smartwatch", "gaming",
      "audifono", "herramienta", "parlante",
    ],
    miniPromo1Title: "Regalos para papá",
    miniPromo1Text: "Tecnología para sorprenderlo",
    miniPromo2Title: "Especial para papá",
    miniPromo2Text: "Explora productos destacados",
  },

  7: {
    id: "july",
    name: "Julio",
    label: "OFERTAS DE JULIO",
    title: "Festival Tech",
    description: "Descubre tecnología durante julio.",
    coupon: "JULIO15",
    colors: ["#253596", "#6979eb"],
    image: "/seasons/julio.webp",
    keywords: [
      "gaming", "computadora", "teclado",
      "mouse", "monitor", "audifono",
    ],
    miniPromo1Title: "Festival tecnológico",
    miniPromo1Text: "Encuentra tus productos favoritos",
    miniPromo2Title: "Destacados de julio",
    miniPromo2Text: "Tecnología para todos",
  },

  8: {
    id: "agosto",
    name: "Fiestas Agostinas",
    label: "FIESTAS AGOSTINAS",
    title: "Promociones Agostinas",
    description:
      "Celebramos agosto con tecnología para todos.",
    coupon: "AGOSTO15",
    colors: ["#064cba", "#73c2f5"],
    image: "/seasons/agosto.webp",
    keywords: [
      "parlante", "audio", "audifono",
      "cargador", "celular", "accesorio",
    ],
    miniPromo1Title: "Combo agostino",
    miniPromo1Text: "Accesorios y dispositivos",
    miniPromo2Title: "Especial de agosto",
    miniPromo2Text: "Productos destacados del mes",
  },

  9: {
    id: "patrio",
    name: "Mes Patrio",
    label: "MES PATRIO",
    title: "Promociones Patrias",
    description:
      "Celebra septiembre con tecnología y accesorios.",
    coupon: "PATRIO10",
    colors: ["#0866d9", "#8fd7ff"],
    image: "/seasons/septiembre.webp",
    keywords: [
      "computadora", "laptop", "teclado",
      "mouse", "memoria", "usb", "monitor",
    ],
    miniPromo1Title: "Combo patrio",
    miniPromo1Text: "Tecnología para estudiar y trabajar",
    miniPromo2Title: "Especial patriótico",
    miniPromo2Text: "Explora nuestra selección",
  },

  10: {
    id: "halloween",
    name: "Halloween",
    label: "OFERTAS DE OCTUBRE",
    title: "Halloween Tech",
    description:
      "Este octubre disfruta de tecnología, gaming y accesorios.",
    coupon: "HALLOWEEN",
    colors: ["#361263", "#f97316"],
    image: "/seasons/halloween-decoracion.png",
    keywords: [
      "gaming", "gamer", "rgb", "teclado",
      "mouse", "control", "audifono",
      "headset", "consola",
    ],
    miniPromo1Title: "Combo tecnológico",
    miniPromo1Text: "Gaming y accesorios para ti",
    miniPromo2Title: "Gaming destacado",
    miniPromo2Text: "Periféricos y dispositivos",
  },

  11: {
    id: "black-november",
    name: "Black November",
    label: "OFERTAS DE NOVIEMBRE",
    title: "Black November Tech",
    description:
      "Descubre tecnología destacada durante noviembre.",
    coupon: "BLACK20",
    colors: ["#030b1f", "#0758a8"],
    image: "/seasons/noviembre.webp",
    keywords: [
      "laptop", "computadora", "monitor",
      "celular", "tablet", "ssd",
      "gaming", "teclado",
    ],
    miniPromo1Title: "Especial Black November",
    miniPromo1Text: "Tecnología para renovar tus equipos",
    miniPromo2Title: "Productos destacados",
    miniPromo2Text: "Explora nuestra selección",
  },

  12: {
    id: "christmas",
    name: "Navidad",
    label: "OFERTAS DE DICIEMBRE",
    title: "Navidad Tech",
    description:
      "Esta Navidad regala tecnología a toda la familia.",
    coupon: "NAVIDAD15",
    colors: ["#8e1931", "#dca44a"],
    image: "/seasons/diciembre.webp",
    keywords: [
      "smartwatch", "reloj", "audifono",
      "parlante", "gaming", "control",
      "tablet", "celular",
    ],
    miniPromo1Title: "Regalos de Navidad",
    miniPromo1Text: "Encuentra regalos tecnológicos",
    miniPromo2Title: "Especial navideño",
    miniPromo2Text: "Productos para sorprender",
  },
};

// OBTENER FECHA Y HORA DE NICARAGUA
export function getNicaraguaDate(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: NICARAGUA_TIMEZONE,
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
    hourCycle: "h23",
  }).formatToParts(date);

  const read = (type) =>
    Number(parts.find((part) => part.type === type)?.value ?? 0);

  return {
    year: read("year"),
    month: read("month"),
    day: read("day"),
    hour: read("hour"),
    minute: read("minute"),
    second: read("second"),
  };
}

// BLACK FRIDAY: CUARTO VIERNES DE NOVIEMBRE
export function getBlackFridayDay(year) {
  const firstDay = new Date(Date.UTC(year, 10, 1));

  const firstFriday =
    1 + ((5 - firstDay.getUTCDay() + 7) % 7);

  return firstFriday + 21;
}

// GENERAR LAS FECHAS DE UNA CAMPAÑA
function getCampaignDates(year, month) {
  // Nicaragua utiliza UTC-6.
  // Inicio: primer día del mes a las 00:00.
  const startsAt = new Date(
    Date.UTC(year, month - 1, 1, 6, 0, 0)
  );

  // Fin exclusivo: primer día del siguiente mes.
  const endsAt = new Date(
    Date.UTC(year, month, 1, 6, 0, 0)
  );

  return {
    startsAt: startsAt.toISOString(),
    endsAt: endsAt.toISOString(),
  };
}

// OBTENER CAMPAÑA ACTIVA
export function getSeasonalPromotion(date = new Date()) {
  const { year, month, day } = getNicaraguaDate(date);

  const campaign = monthlyCampaigns[month];

  if (!campaign) return null;

  const dates = getCampaignDates(year, month);

  // BLACK FRIDAY: VIERNES A LUNES
  if (month === 11) {
    const blackFridayDay = getBlackFridayDay(year);

    if (
      day >= blackFridayDay &&
      day <= blackFridayDay + 3
    ) {
      return {
        ...campaign,
        id: "black-friday",
        name: "Black Friday",
        label: "BLACK FRIDAY",
        title: "Black Friday Tech",
        description:
          "Edición especial de Black Friday en NICA S-MART.",
        image: "/seasons/black-friday.webp",
        keywords: [
          "laptop", "computadora", "monitor",
          "celular", "gaming", "audifono",
        ],
        ...dates,
        isBlackFriday: true,
      };
    }
  }

  return {
    ...campaign,
    ...dates,
    isBlackFriday: false,
  };
}
