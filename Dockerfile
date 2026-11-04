
# ==========================================
# NICA S-MART | FRONTEND
# React + Vite + Nginx
# Node.js 20 Alpine
# ==========================================

# ==========================================
# ETAPA 1: COMPILAR REACT + VITE
# ==========================================

FROM node:20-alpine AS build

WORKDIR /app

# Copiar dependencias
COPY package*.json ./

# Instalar dependencias
RUN npm ci

# ==========================================
# VARIABLES DE ENTORNO DE VITE
# ==========================================

ARG VITE_API_URL
ARG VITE_GOOGLE_CLIENT_ID

ENV VITE_API_URL=${VITE_API_URL}
ENV VITE_GOOGLE_CLIENT_ID=${VITE_GOOGLE_CLIENT_ID}

# ==========================================
# COPIAR Y COMPILAR FRONTEND
# ==========================================

COPY . .

RUN npm run build

# ==========================================
# ETAPA 2: SERVIDOR NGINX
# ==========================================

FROM nginx:1.27-alpine

ENV PORT=80

# Configuración de Nginx
COPY docker/default.conf.template /etc/nginx/templates/default.conf.template

# Copiar archivos compilados de Vite
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
