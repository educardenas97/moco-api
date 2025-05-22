# Etapa 1: Construir la aplicación
FROM node:22-alpine AS builder
WORKDIR /app

# Copiar los archivos package.json y yarn.lock
COPY package.json yarn.lock ./

# Instalar dependencias, incluyendo bibliotecas privadas
RUN yarn config set registry https://registry.npmjs.org
RUN yarn install --frozen-lockfile
# Copiar el resto de la aplicación
COPY . .
# Construir el proyecto
RUN yarn run build


# Etapa 2: Crear la imagen de producción
FROM node:22-alpine AS production
WORKDIR /app
# Copiar la aplicación construida de la etapa anterior
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
# Exponer el puerto
EXPOSE 4000
# Comando para iniciar el proyecto
CMD ["node", "dist/main"]