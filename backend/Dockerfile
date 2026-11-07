# ==========================================
# NICA S-MART | BACKEND
# Node.js 20 Alpine + Express + PostgreSQL

# ETAPA 1: IMAGEN BASE
# ==========================================

FROM node:20-alpine

# ==========================================
# DIRECTORIO DE TRABAJO
# ==========================================

WORKDIR /app

# ==========================================
# INSTALAR DEPENDENCIAS
# ==========================================

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar dependencias de producción
RUN npm ci --omit=dev

# ==========================================
# COPIAR CÓDIGO DEL BACKEND
# ==========================================

COPY . .

# ==========================================
# CONFIGURACIÓN DEL SERVIDOR
# ==========================================

ENV NODE_ENV=production

# ==========================================
# EXPONER PUERTO DE EXPRESS
# ==========================================

EXPOSE 3000

# ==========================================
# INICIAR EL BACKEND
# ==========================================

CMD ["node", "index.js"]