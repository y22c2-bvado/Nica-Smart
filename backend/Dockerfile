FROM node:20-alpine

WORKDIR /app

# Copiamos los archivos de dependencias e instalamos solo lo necesario para producción
COPY package*.json ./
RUN npm ci --omit=dev

# Copiamos el resto del código de tu backend
COPY . .

# Exponemos el puerto
EXPOSE 3000

# Ejecutamos el archivo principal. 
# ⚠️ OJO AQUÍ: Cambia "index.js" por el nombre de tu archivo principal (ej: server.js, app.js)
CMD ["node", "index.js"]