# --- Etapa de Dependencias ---
FROM node:20-alpine AS dependencies
WORKDIR /app
COPY package*.json ./
# Instala dependencias necesarias
RUN apk add --no-cache python3 make g++ && \
    npm ci

# --- Etapa de Producción ---
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Copia los archivos del proyecto y los módulos compilados
COPY --from=dependencies /app/node_modules ./node_modules
COPY index.js index.html package*.json ./

# Crear la carpeta interna donde Docker montará el volumen persistente
RUN mkdir -p /usr/src/app/data

# Expone el puerto estándar en producción
EXPOSE 3000

CMD ["node", "index.js"]
