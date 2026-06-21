# Bilheteria Park — Frontend

Interface React + Vite servida via Nginx, com dois fluxos distintos:

- **Site público** (`/`) — visitantes compram ingressos sem login
- **Painel admin** (`/admin`) — gestão de eventos, lotes, clientes e vendas

## Como rodar

O frontend **não possui docker-compose próprio**. Ele é iniciado pelo `docker-compose.yml` do backend, que está na pasta irmã.

```bash
# A partir da pasta do BACKEND:
docker compose up --build
```

O serviço `frontend` no compose aponta para `../bilheteria-park-frontend`.

### Estrutura de pastas esperada

```
/
├── bilheteria-park-backend/   ← docker compose up roda daqui
└── bilheteria-park-frontend/  ← esta pasta
```

### Desenvolvimento local (sem Docker)

```bash
npm install
npm run dev
```

O Vite proxy redireciona `/api/*` para `http://localhost:8000`.

## Fluxo de rotas

| Rota | Quem acessa | Descrição |
|---|---|---|
| `/` | Público | Lista de eventos disponíveis |
| `/evento/:id` | Público | Página de compra de ingresso |
| `/admin/login` | Admin | Login (redireciona para `/admin` se já logado) |
| `/admin` | Admin (\*) | Dashboard com resumo |
| `/admin/pdv` | Admin (\*) | Ponto de venda interno |
| `/admin/eventos` | Admin (\*) | CRUD de eventos |
| `/admin/lotes` | Admin (\*) | CRUD de lotes de ingressos |
| `/admin/clientes` | Admin (\*) | Base de clientes |
| `/admin/sistema` | Admin (\*) | Status da conexão com a API |

(\*) Redireciona para `/admin/login` se não autenticado.

## Proxy nginx em produção

O `nginx.conf` roteia `/api/*` para o serviço `web` (nome do container FastAPI na rede Docker):

```nginx
location /api/ {
    proxy_pass http://web:8000/;
}
```

Isso só funciona quando ambos os containers estão no mesmo `docker-compose` (o do backend).

## Variáveis de build (Vite)

Não há variáveis de ambiente necessárias. A URL base da API é sempre `/api` — o nginx faz o proxy para o backend.
