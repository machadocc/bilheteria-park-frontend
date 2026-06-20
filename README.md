# Bilheteria Park · Frontend

Painel de gestão de uma bilheteria de parque de diversões, em **React + Vite**, consumindo a API REST conforme a coleção do Insomnia (`insomnia-bilheteria-park.json`). CSS puro, sem framework de UI.

## Rodando

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # build de produção em /dist
```

O backend deve estar em `http://localhost:8000` (padrão).

Em desenvolvimento, o frontend usa o proxy Vite em `/api` para evitar problemas de CORS com o backend local.
Você pode alterar a URL base em tempo de execução na tela **Sistema**.

## Estrutura

```
src/
├── api/
│   ├── client.js       # fetch central + tratamento de erro (inclui validação FastAPI)
│   ├── endpoints.js    # 1 função por request do Insomnia, agrupadas por domínio
│   └── useApi.js       # hook de loading/erro/refetch
├── components/         # Layout, Icon, Modal e UI reutilizável
├── context/            # ToastContext (notificações)
├── pages/
│   ├── Dashboard.jsx   # summary, top-events, alerts, last-sales
│   ├── PointOfSale.jsx # catálogo + carrinho + checkout (sales)
│   ├── Events.jsx      # CRUD + cancel + duplicate + history
│   ├── Batches.jsx     # CRUD de lotes + close
│   ├── Customers.jsx   # CRUD + histórico de compras
│   └── System.jsx      # health, metrics e config de URL
└── styles/global.css   # design system (tokens, componentes)
```

## Cobertura de endpoints

| Domínio | Endpoints |
|---|---|
| Sistema | `/health`, `/metrics` |
| Eventos | `GET/POST /events/`, `GET/PUT/DELETE /events/{id}`, `/cancel`, `/duplicate`, `/history` |
| Lotes | `GET/POST /batches/`, `PUT /batches/{id}`, `/close` |
| Clientes | `GET/POST /customers/`, `GET/PUT /customers/{id}`, `/history` |
| Vendas | `POST /sales/checkout`, `GET /sales/catalog` |
| Dashboard | `/summary`, `/top-events`, `/alerts`, `/last-sales` |

## Notas

- Os formatadores e o helper `pick()` toleram variações de nomes de campos do backend (ex.: `id`/`event_id`, `total`/`amount`), então a tela não quebra se o JSON real divergir um pouco.
- Se houver bloqueio de **CORS**, habilite o proxy comentado em `vite.config.js` (ou libere o CORS no backend FastAPI).
