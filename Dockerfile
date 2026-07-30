FROM node:20-alpine AS build
WORKDIR /app

# VITE_API_BASE_URL é gravada no bundle em build-time (Vite, não runtime) —
# por isso é um build arg, não uma variável de ambiente do container final.
# Omissão: a mesma Api de produção já usada pelo domios-scraper.
ARG VITE_API_BASE_URL=http://100.119.150.79:8080/api/v1
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}

COPY package*.json .
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:alpine AS runtime
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 8080
