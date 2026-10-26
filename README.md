# ClusterHR ATS Frontend (Next.js)

Aplicacao web do fluxo ATS da ClusterHR, com:

- Listagem de vagas
- Candidatura de candidatos (onboarding em etapas)
- Criacao de novas vagas
- Painel de candidaturas por vaga (visao empresa)
- Autenticacao Supabase por e-mail, GitHub e LinkedIn

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
- `npm run test:e2e`: E2E local com Supabase simulado
- `npm run test:e2e:production`: E2E serial contra o deploy publicado

## Variaveis de ambiente

### API externa

- `NEXT_PUBLIC_API_BASE_URL`:
  - Base da API ATS consumida pelo front.
  - Exemplo: `https://seu-endpoint.lambda-url.../api`
  - Se ausente, o projeto usa um endpoint default definido em `config.ts`.

### Supabase Auth

- `NEXT_PUBLIC_SUPABASE_URL`: URL do projeto Supabase.
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`: chave publicavel do projeto.
- `SUPABASE_SERVICE_ROLE_KEY`: chave administrativa somente no servidor; fixa `app_metadata.account_type` no primeiro acesso.

Habilite GitHub e LinkedIn OIDC no painel Supabase e inclua `<origin>/auth/callback` e `<origin>/auth/confirm` na lista de URLs de retorno para cada ambiente. No modelo de confirmacao de cadastro, use `{{ .RedirectTo }}?token_hash={{ .TokenHash }}&type=email`; no modelo de recuperacao, use `{{ .RedirectTo }}?token_hash={{ .TokenHash }}&type=recovery`. A autenticacao interna fica indisponivel sem as variaveis acima.

Importante: nao versione segredos reais em `.env.local`.

## Rotas de pagina (UI)

- `/`: login e cadastro Supabase, escolha entre Candidato e Empresa e recuperacao de senha
- `/jobs/list`: vagas publicas com filtros e links de candidatura; mostra nome ou e-mail e opcao de sair quando autenticado
- `/candidaturas`: candidatura completa de Candidato autenticado em 4 etapas; exige `?vagaGuid=...` e retorna à listagem com orientação quando a vaga não foi informada
- `/jobs/create`: formulario de criacao de vaga para Empresa autenticada, com seletores de Area, Time, Senioridade, Setor, experiencia, beneficios e skills; localizacao por cidade e estado informados manualmente
- `/empresa/candidaturas`: quadro ATS de candidaturas por vaga para Empresa autenticada, com card "Nova vaga" para abrir o formulario
- `/empresa/relatorio`: indicadores operacionais para Empresa autenticada

## Endpoints externos esperados (backend ATS)

Com `NEXT_PUBLIC_API_BASE_URL=<base>/api`, o front espera estes recursos:

- `GET /jobs` (listagem de vagas)
- `POST /jobs` (criacao de vaga)
- `POST /candidates` (envio de candidatura)
- `GET /candidates/by-job-guids` (filtro por `guid_vaga`)
- `GET /zips/:zip` (consulta de localizacao por CEP)

Os campos de area usam um catalogo local fixo de 13 areas, com IDs de 1 a 13 na ordem definida pelo produto. O front nao consulta `GET /areas`; os IDs continuam sendo enviados como numeros nos payloads de vaga e candidatura.

Na candidatura (`/candidaturas`), `industriaInteresse` e `areaPreferencia` usam IDs de área. Os campos `timeAtual` e `time` aceitam até três valores, e `setor` aceita até cinco valores nas preferências profissionais. Os campos de time e setor são representados como arrays no contrato do formulário. Na criação de vagas, Area aceita uma seleção, Time até três, Senioridade até três, Setor até cinco e Hard/Soft Skills até sete cada; `skills` contém Hard Skills e `soft_skills` contém Soft Skills. Cidade e Estado são informados separadamente, sem consulta de CEP. A etapa de CV informa que o upload ainda não está disponível; é possível finalizar sem anexar arquivo.

## Estrutura resumida

- `app/`: paginas do App Router e handlers server internos
- `components/`: UI e fluxos (vagas, onboarding, board)
- `services/`: chamadas HTTP usadas pelo front
- `lib/auth/supabase.ts` e clientes Supabase: tipo de conta, sessao e guardas de pagina
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

## Validacao E2E

Para executar os fluxos de autenticacao e cadastro no navegador, instale o
Chromium do Playwright uma vez e rode os testes:

    npx playwright install chromium
    npm run test:e2e

Os cenarios iniciam um Supabase simulado localmente e usam dados descartaveis.
Eles nao validam as credenciais, os provedores nem os modelos de e-mail do
projeto Supabase real e nao alteram candidatos reais.

### Validacao E2E do deploy publicado

A suite de producao e separada dos E2E locais, usa um unico worker e nao sobe
servidores locais. Por padrao, ela valida
`https://clusterjobs.com.br/`:

    npm run test:e2e:production

Variaveis aceitas apenas no ambiente local que executa o Playwright:

- `PRODUCTION_E2E_BASE_URL`: URL do deploy a validar.
- `PRODUCTION_E2E_ATS_API_BASE_URL`: base da API ATS usada pelo deploy.
- `PRODUCTION_E2E_SUPABASE_URL`: URL do projeto Supabase de producao.
- `PRODUCTION_E2E_SUPABASE_SERVICE_ROLE_KEY`: chave administrativa usada
  somente pelo processo Node para criar contas sinteticas e consultar seus IDs.
- `PRODUCTION_E2E_SEND_EMAIL=true`: habilita uma tentativa real e controlada de
  cadastro com confirmacao por e-mail. Sem esta opcao, o cenario fica bloqueado.

Sem as credenciais administrativas, os testes publicos continuam e os cenarios
que exigem contas descartaveis ficam marcados como bloqueados. A chave, senhas
e tokens nunca sao gravados nos relatorios. A execucao gera:

- HTML em `playwright-report-production/`;
- traces e screenshots de falhas em `test-results/production/`;
- Markdown por execucao em `../production-e2e-reports/<E2E-data-run>.md`.

Contas, vagas, candidaturas e anotacoes recebem o prefixo `E2E-PROD-...`.
Nesta primeira revalidacao, a suite nao executa hooks de exclusao: todos os
registros criados ficam em producao para inspecao, com IDs e vinculos no Markdown.
Planeje a remocao em uma tarefa posterior.

No deploy Hostinger, Vercel Analytics fica desativado por padrao. Configure
`NEXT_PUBLIC_VERCEL_ANALYTICS_ENABLED=true` no build apenas em um deploy
compativel com o endpoint `/_vercel/insights/script.js`.

## Observacoes atuais

- O quadro de candidaturas em `/empresa/candidaturas` permite mover candidatos entre etapas e persiste a mudanca via `PUT /api/candidates/:id`.
- A candidatura gera `guid_id` no front e envia `guid_vaga` junto com os dados completos do perfil; nenhum CNPJ aleatório é gerado.
- As guardas de tipo cobrem paginas e handlers Next.js. A API ATS externa ainda nao verifica o JWT Supabase e pode ser chamada diretamente; integrar sua autorizacao fica para outra etapa.
