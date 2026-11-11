FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

# ==========================================
# VARIABLES DE ENTORNO DE VITE
# ==========================================

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

# ... (el resto de tu Dockerfile con Nginx se mantiene igual)