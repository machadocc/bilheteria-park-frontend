FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci --silent

COPY . .
RUN npm run build

FROM nginx:stable-alpine

# envsubst vem incluído no nginx:alpine — não precisa instalar nada extra
COPY nginx.conf /etc/nginx/templates/default.conf.template

COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

# BACKEND_URL: URL do backend acessível do ponto de vista do NGINX (container-to-container ou externa).
# Exemplos:
#   - Docker na mesma máquina (rede bridge custom): http://bilheteria-backend:8000
#   - AWS (ECS sem service discovery):              http://<IP-privado-ou-ALB>:8000
#   - Desenvolvimento local (frontend no Docker, backend na máquina): http://host.docker.internal:8000
# Passe via: docker run -e BACKEND_URL=http://... ou no docker-compose.yaml do frontend.
ENV BACKEND_URL=http://localhost:8000

# nginx Docker image processa /etc/nginx/templates/*.template automaticamente via envsubst
CMD ["nginx", "-g", "daemon off;"]
