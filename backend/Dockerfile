# Usamos Node 22 para evitar los warnings que salían en el log
FROM node:22-alpine

WORKDIR /app

# Copiamos las dependencias e instalamos solo lo de producción
COPY package*.json ./
RUN npm ci --omit=dev

# Copiamos el resto del código
COPY . .

# Exponemos el puerto de tu backend
EXPOSE 3000

# Ejecutamos el archivo principal (asegúrate de que se llame index.js)
CMD ["node", "index.js"]