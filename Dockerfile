FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./

RUN npm ci


ARG VITE_API_URL
ARG VITE_GOOGLE_CLIENT_ID
ARG VITE_FACEBOOK_APP_ID

ENV VITE_API_URL=${VITE_API_URL}
ENV VITE_GOOGLE_CLIENT_ID=${VITE_GOOGLE_CLIENT_ID}
ENV VITE_FACEBOOK_APP_ID=${VITE_FACEBOOK_APP_ID}

# ==========================================
# COPIAR Y COMPILAR FRONTEND
# ==========================================

COPY . .

RUN npm run build

# ==========================================
# ETAPA 2: SERVIDOR NGINX
# ==========================================
FROM nginx:1.27-alpine

# Puerto que usará Nginx
ENV PORT=80

# ⚠️ IMPORTANTE: Esta línea evita que envsubst borre 
# las variables de Nginx (como $backend_url, $uri, etc.)
ENV NGINX_ENVSUBST_FILTER=PORT

# Configuración de Nginx
COPY docker/default.conf.template /etc/nginx/templates/default.conf.template

# Copiar archivos compilados de Vite
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]