# ==========================================
# ETAPA 1: Compilar el proyecto de Vite (Node.js)
# ==========================================
FROM node:20-alpine AS build

WORKDIR /app

# Copiamos package.json y package-lock.json para instalar dependencias
COPY package*.json ./
RUN npm install

# Copiamos todo el código del proyecto y lo compilamos
COPY . .
RUN npm run build

# ==========================================
# ETAPA 2: Servir los archivos con Nginx
# ==========================================
FROM nginx:1.27-alpine

# Railway inyecta la variable PORT
ENV PORT=80

# Plantilla de configuración de Nginx
COPY docker/default.conf.template /etc/nginx/templates/default.conf.template

# ¡AQUÍ ESTÁ EL CAMBIO CLAVE!
# Copiamos SOLO la carpeta "dist" (que genera Vite al compilar) 
# y la ponemos en la carpeta pública de Nginx.
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80