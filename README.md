# NEX ATS Frontend (Next.js)

Aplicacao web do fluxo ATS da NEX, com:

- Listagem de vagas
- Candidatura de candidatos (onboarding em etapas)
- Criacao de novas vagas
- Painel de candidaturas por vaga (visao empresa)
- Autenticacao Cognito via OAuth2 + PKCE
- Rotas internas `/api/*` para proxy e sessao

## Stack

- Next.js `16.0.10` (App Router)
- React `19.2.3`
- TypeScript `5.x`
- Tailwind CSS `4.x` + componentes baseados em Radix
- Vitest `2.x` para testes

## Requisitos

- Node.js 20 LTS ou superior
- npm 9 ou superior

## Setup local

```bash
npm install
cp .env.example .env.local
npm run dev
```

Aplicacao local: `http://localhost:3000`

## Scripts

- `npm run dev`: desenvolvimento
- `npm run build`: build de producao
- `npm run start`: sobe build de producao
- `npm run lint`: lint via ESLint
- `npm run test`: executa testes (Vitest)
- `npm run test:watch`: testes em modo watch

## Variaveis de ambiente

### API externa

- `NEXT_PUBLIC_API_BASE_URL`:
  - Base da API ATS consumida pelo front e pelos proxies.
  - Exemplo: `https://seu-endpoint.lambda-url.../api`
  - Se ausente, o projeto usa um endpoint default definido em `config.ts`.

### Cognito (OAuth2/PKCE)

- `COGNITO_CLIENT_ID` ou `NEXT_PUBLIC_COGNITO_CLIENT_ID` (obrigatorio para login)
- `COGNITO_DOMAIN` ou `NEXT_PUBLIC_COGNITO_DOMAIN` (opcional; possui default no projeto)
- `COGNITO_CLIENT_SECRET` ou `NEXT_PUBLIC_COGNITO_CLIENT_SECRET` (opcional)
- `COGNITO_REDIRECT_URI` ou `NEXT_PUBLIC_COGNITO_REDIRECT_URI` (opcional; fallback para `<origin>/api/auth/callback`)
- `COGNITO_SCOPE` ou `NEXT_PUBLIC_COGNITO_SCOPE` (opcional; default `openid email profile`)
- `COGNITO_LOGOUT_URI` ou `NEXT_PUBLIC_COGNITO_LOGOUT_URI` (opcional; habilita logout no Hosted UI)

Importante: nao versione segredos reais em `.env.local`.

## Rotas de pagina (UI)

- `/`: listagem de vagas (dados vindos da API)
- `/candidaturas`: onboarding do candidato em 4 etapas
- `/jobs/create`: formulario de criacao de vaga com validacoes e consulta de CEP
- `/empresa/candidaturas`: quadro de candidaturas por vaga (`guid_vaga`)

## Rotas internas da aplicacao (`app/api`)

### Proxy para API ATS

- `POST /api/jobs`: cria vaga no backend
- `POST /api/candidates`: cria candidatura no backend
- `GET /api/candidates/by-job-guids?guid_vaga=...`: busca candidatos por vaga
- `GET /api/zips/:zip`: consulta CEP (8 digitos)
- `OPTIONS` nas rotas acima para preflight CORS

### Autenticacao

- `GET /api/auth/login`: inicia fluxo PKCE no Cognito
- `GET /api/auth/callback`: troca `code` por tokens e grava cookies de sessao
- `POST /api/auth/refresh`: renova sessao com refresh token (cookie httpOnly)
- `GET /api/auth/session`: retorna resumo da sessao autenticada
- `GET /api/auth/logout`: limpa cookies e redireciona (local ou Hosted UI)

Cookies usados no fluxo de auth:

- Fluxo PKCE: `nexjob_auth_state`, `nexjob_code_verifier`
- Sessao: `nexjob_access_token`, `nexjob_id_token`, `nexjob_refresh_token`, `nexjob_token_expires_at`

## Endpoints externos esperados (backend ATS)

Com `NEXT_PUBLIC_API_BASE_URL=<base>/api`, o front espera estes recursos:

- `GET /jobs` (listagem de vagas)
- `POST /jobs` (criacao de vaga)
- `POST /candidates` (envio de candidatura)
- `GET /candidates/by-job-guids` (filtro por `guid_vaga`)
- `GET /zips/:zip` (consulta de localizacao por CEP)

## Estrutura resumida

- `app/`: paginas e rotas server (`app/api/*`)
- `components/`: UI e fluxos (vagas, onboarding, board)
- `services/`: chamadas HTTP usadas pelo front
- `lib/auth/cognito.ts`: utilitarios de auth, cookies e sessao
- `src/tests/`: testes de rotas e services

## Testes

```bash
npm run test
```

A configuracao de cobertura em `vitest.config.mjs` aplica threshold global de `90%` para:

- lines
- functions
- branches
- statements

## Observacoes atuais

- O quadro de candidaturas em `/empresa/candidaturas` esta com drag-and-drop desabilitado (`draggable={false}`), sem persistencia de mudanca de status no backend.
- O onboarding de candidato ainda gera `guid_id` e `cd_cnpj` no front para envio de payload.
- O projeto possui servicos/testes legados de auth em `services/auth-service.ts`; o runtime principal de autenticacao usa `lib/auth/cognito.ts` + rotas em `app/api/auth/*`.
