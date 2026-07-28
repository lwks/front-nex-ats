# ClusterHR ATS Frontend (Next.js)

Aplicacao web do fluxo ATS da ClusterHR, com:

- Listagem de vagas
- Candidatura de candidatos (onboarding em etapas)
- Criacao de novas vagas
- Painel de candidaturas por vaga (visao empresa)
- Autenticacao Cognito via OAuth2 + PKCE

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
  - Base da API ATS consumida pelo front.
  - Exemplo: `https://seu-endpoint.lambda-url.../api`
  - Se ausente, o projeto usa um endpoint default definido em `config.ts`.

### Cognito (OAuth2/PKCE)

- `COGNITO_ENABLED` ou `NEXT_PUBLIC_COGNITO_ENABLED`:
  - Liga/desliga a autenticacao no runtime.
  - Aceita `true/false`, `1/0`, `yes/no`, `on/off`.
  - Se ausente, o projeto desabilita auth automaticamente em `localhost`/`127.0.0.1`/`::1` e mantem habilitado nos demais hosts.
- `COGNITO_CLIENT_ID` ou `NEXT_PUBLIC_COGNITO_CLIENT_ID` (obrigatorio para login)
- `COGNITO_DOMAIN` ou `NEXT_PUBLIC_COGNITO_DOMAIN` (opcional; possui default no projeto)
- `COGNITO_CLIENT_SECRET` ou `NEXT_PUBLIC_COGNITO_CLIENT_SECRET` (opcional)
- `COGNITO_REDIRECT_URI` ou `NEXT_PUBLIC_COGNITO_REDIRECT_URI` (opcional; fallback para `<origin>/api/auth/callback`)
- `COGNITO_SCOPE` ou `NEXT_PUBLIC_COGNITO_SCOPE` (opcional; default `openid email profile`)
- `COGNITO_LOGOUT_URI` ou `NEXT_PUBLIC_COGNITO_LOGOUT_URI` (opcional; habilita logout no Hosted UI)

Importante: nao versione segredos reais em `.env.local`.

## Rotas de pagina (UI)

- `/`: listagem de vagas (dados vindos da API)
- `/jobs/list`: pagina publica de vagas, com filtros e links de candidatura
- `/users/create`: cadastro de usuario/candidato
- `/candidaturas`: onboarding do candidato em 4 etapas; aceita `?vagaGuid=...` para iniciar a candidatura a uma vaga especifica
- `/jobs/create`: formulario de criacao de vaga com validacoes e consulta de CEP
- `/empresa/candidaturas`: quadro de candidaturas por vaga (`guid_vaga`)
- `/empresa/relatorio`: indicadores operacionais de vagas e candidaturas

## Endpoints externos esperados (backend ATS)

Com `NEXT_PUBLIC_API_BASE_URL=<base>/api`, o front espera estes recursos:

- `GET /jobs` (listagem de vagas)
- `POST /jobs` (criacao de vaga)
- `POST /candidates` (envio de candidatura)
- `GET /candidates/by-job-guids` (filtro por `guid_vaga`)
- `GET /zips/:zip` (consulta de localizacao por CEP)

## Estrutura resumida

- `app/`: paginas do App Router e handlers server internos
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
- O projeto possui servicos/testes legados de auth em `services/auth-service.ts`; o runtime principal de autenticacao usa `lib/auth/cognito.ts` + handlers server internos.
