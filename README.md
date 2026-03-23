# NEX People Solutions

Aplicação front-end construída com Next.js para conduzir o onboarding de candidatos do ATS (Applicant Tracking System) da NEX People Solutions. O projeto foi originalmente gerado pelo [v0.app](https://v0.app) e adaptado para desenvolvimento local.

## Requisitos

- Node.js 20 LTS (ou versão compatível com Next.js 15)
- npm 9 ou superior (o repositório acompanha `package-lock.json`)

## Como começar

```bash
# 1. Instalar dependências
npm install

# 2. Subir o ambiente de desenvolvimento
npm run dev

# 3. Acessar no navegador
http://localhost:3000
```

### Scripts úteis

- `npm run build`: gera o bundle de produção (`next build`).
- `npm run start`: executa a aplicação em modo produção (`next start`).
- `npm run lint`: roda as verificações do `next lint`. (Com a configuração atual, a build falha caso haja erros de lint ou TypeScript.)


## Configuração de autenticação Cognito

Defina as variáveis abaixo para habilitar o fluxo OAuth2/PKCE com Amazon Cognito:

- `COGNITO_DOMAIN` ou `NEXT_PUBLIC_COGNITO_DOMAIN`: domínio base do Hosted UI do Cognito, por exemplo `https://seu-dominio.auth.us-east-1.amazoncognito.com`.
- `COGNITO_CLIENT_ID` ou `NEXT_PUBLIC_COGNITO_CLIENT_ID`: client id da aplicação Cognito.
- `COGNITO_CLIENT_SECRET` ou `NEXT_PUBLIC_COGNITO_CLIENT_SECRET` *(opcional)*: secret do app client para autenticar chamadas de token via header `Authorization: Basic <base64(client_id:client_secret)>`.
- `COGNITO_REDIRECT_URI` ou `NEXT_PUBLIC_COGNITO_REDIRECT_URI`: URL absoluta de callback, por exemplo `http://localhost:3000/api/auth/callback`. Quando ausente, o front usa `<origin>/api/auth/callback`.
- `COGNITO_SCOPE` ou `NEXT_PUBLIC_COGNITO_SCOPE`: escopos separados por espaço, por exemplo `openid profile email`. Default: `openid email profile`.
- `COGNITO_LOGOUT_URI` ou `NEXT_PUBLIC_COGNITO_LOGOUT_URI` *(opcional)*: URL absoluta usada no logout do Hosted UI do Cognito. Quando ausente, `GET /api/auth/logout` faz apenas logout local e redireciona para `/`.

### Rotas de autenticação

- `GET /api/auth/login`: inicia o fluxo PKCE, grava cookies temporários `nexjob_auth_state` e `nexjob_code_verifier` e redireciona para o Cognito Hosted UI.
- `GET /api/auth/callback`: valida `code` e `state`, troca o authorization code por tokens no Cognito e persiste cookies HTTP-only de sessão `nexjob_access_token`, `nexjob_id_token`, `nexjob_refresh_token` e `nexjob_token_expires_at`.
- `GET /api/auth/logout`: limpa todos os cookies de autenticação e redireciona para `/` ou, quando configurado, para o logout do Hosted UI do Cognito.
- `POST /api/auth/refresh`: usa o `nexjob_refresh_token` em cookie HTTP-only para renovar a sessão sem expor tokens no corpo da resposta.
- `GET /api/auth/session`: retorna um resumo seguro da sessão atual para a UI, sem expor access token nem refresh token.

## Estrutura do projeto

- `app/` – entrypoint do Next.js com `layout.tsx`, `page.tsx` e os estilos globais (`globals.css`).
- `components/` – componentes reutilizáveis, incluindo:
  - `candidate-onboarding.tsx` e `progress-indicator.tsx`: orquestram as etapas do formulário.
  - `steps/`: telas de formulário (`Dados Pessoais`, `Dados Profissionais`, upload de CV em PDF, `Interesses Profissionais`).
  - `ui/`: componentes baseados em Radix UI/ShadCN (botão, select, sheet etc.).
  - `header.tsx`: cabeçalho da aplicação.
- `lib/` – utilitários (por exemplo, o helper `cn` para composição de classes).
- `public/` – assets estáticos (logos e imagens de placeholder).

## Fluxo atual da aplicação

1. A página inicial (`/`) exibe o cabeçalho e o indicador de progresso.
2. O formulário multi-etapas coleta dados pessoais, profissionais (em duas etapas, incluindo upload de CV em PDF) e interesses.
3. Ao final, os dados são apenas exibidos no console e via `alert` (não há integração com backend).

## Contratos de API utilizados no front-end

### Autenticação Cognito

#### Cookies utilizados

Todos os cookies de autenticação são `httpOnly`, `sameSite=lax`, `path=/` e usam `secure` em HTTPS/produção.

- Transitórios do fluxo PKCE:
  - `nexjob_auth_state`
  - `nexjob_code_verifier`
- Persistência de sessão:
  - `nexjob_access_token`
  - `nexjob_id_token`
  - `nexjob_refresh_token`
  - `nexjob_token_expires_at`

#### Endpoints

- `GET /api/auth/login`
  - Inicia o fluxo Authorization Code + PKCE.
  - Gera `state` e `code_verifier` em cookies HTTP-only temporários.
  - Redireciona para `https://<cognito-domain>/oauth2/authorize` com `response_type=code`, `client_id`, `redirect_uri`, `scope`, `state`, `code_challenge` e `code_challenge_method=S256`.
  - Status esperados: `307` em sucesso, `500` quando `COGNITO_CLIENT_ID` não estiver configurado.

- `GET /api/auth/callback`
  - Recebe `code` e `state` da query string.
  - Valida o `state` salvo em cookie e a presença do `nexjob_code_verifier`.
  - Faz `POST https://<cognito-domain>/oauth2/token` com `grant_type=authorization_code`.
  - Em sucesso, persiste `nexjob_access_token`, `nexjob_id_token`, `nexjob_refresh_token` (quando disponível) e `nexjob_token_expires_at`; depois limpa os cookies transitórios e redireciona para `/`.
  - Em falha, limpa cookies transitórios e de sessão.
  - Status esperados: `307`, `400`, `500` e `502`.

- `GET /api/auth/logout`
  - Sempre limpa `nexjob_access_token`, `nexjob_id_token`, `nexjob_refresh_token`, `nexjob_token_expires_at`, `nexjob_auth_state` e `nexjob_code_verifier`.
  - Quando `COGNITO_LOGOUT_URI` (ou `NEXT_PUBLIC_COGNITO_LOGOUT_URI`) estiver configurado junto com `COGNITO_CLIENT_ID`, redireciona para `https://<cognito-domain>/logout?client_id=...&logout_uri=...`.
  - Sem essa configuração, executa logout local e redireciona para `/`.
  - Status esperados: `307`.

- `POST /api/auth/refresh`
  - Lê `nexjob_refresh_token` do cookie HTTP-only.
  - Faz `POST https://<cognito-domain>/oauth2/token` com `grant_type=refresh_token`.
  - Atualiza `nexjob_access_token`, `nexjob_token_expires_at` e `nexjob_id_token` quando o Cognito devolver um novo `id_token`.
  - Só atualiza `nexjob_refresh_token` quando o Cognito retornar um novo valor.
  - Nunca expõe tokens no JSON da resposta.
  - Em falha de refresh, limpa os cookies de sessão.
  - Status esperados: `200`, `401`, `500` e `502`.

- `GET /api/auth/session`
  - Lê os cookies de sessão atuais.
  - Considera a sessão autenticada apenas quando `nexjob_access_token`, `nexjob_id_token` e `nexjob_token_expires_at` estiverem presentes e não expirados.
  - Decodifica claims básicas do `id_token` de forma defensiva para retornar apenas um resumo útil à UI.
  - Nunca expõe `access_token` nem `refresh_token` no corpo da resposta.
  - Status esperados: `200`.

Exemplo de resposta de `GET /api/auth/session`:

```json
{
  "authenticated": true,
  "expiresAt": "2026-03-20T15:30:00.000Z",
  "user": {
    "sub": "0d90d88a-0000-0000-0000-000000000000",
    "email": "pessoa@empresa.com",
    "name": "Pessoa Exemplo"
  }
}
```

Variáveis de ambiente relevantes:
- `COGNITO_DOMAIN` ou `NEXT_PUBLIC_COGNITO_DOMAIN` (default atual: `https://us-east-1sa8vsmupy.auth.us-east-1.amazoncognito.com`)
- `COGNITO_CLIENT_ID` ou `NEXT_PUBLIC_COGNITO_CLIENT_ID`
- `COGNITO_CLIENT_SECRET` ou `NEXT_PUBLIC_COGNITO_CLIENT_SECRET` (opcional; usado para `Authorization: Basic` em `/oauth2/token`)
- `COGNITO_REDIRECT_URI` ou `NEXT_PUBLIC_COGNITO_REDIRECT_URI` (default: `<origin>/api/auth/callback`)
- `COGNITO_SCOPE` ou `NEXT_PUBLIC_COGNITO_SCOPE` (default: `openid email profile`)
- `COGNITO_LOGOUT_URI` ou `NEXT_PUBLIC_COGNITO_LOGOUT_URI` (opcional; habilita logout no Hosted UI)

### Lista de candidatos 
- `GET /api/candidates/by-job-guids`: consulta candidatos por uma ou mais vagas usando o parâmetro `guid_vaga`.
  - Formatos aceitos pelo front-end proxy: `?guid_vaga=a,b,c` **ou** `?guid_vaga=a&guid_vaga=b&guid_vaga=c`.
  - O proxy normaliza os GUIDs recebidos e encaminha ao upstream no formato com múltiplos `guid_vaga`.
  - Quando nenhum GUID válido é informado, a rota retorna `400` com a mensagem `O parâmetro guid_vaga é obrigatório.`.

## Observações e pontos de atenção

- **Textos em UTF-8**: revisamos os arquivos da interface para garantir que os textos em português estejam com a acentuação correta.
- **Build mais rígido**: com a remoção de `ignoreDuringBuilds`/`ignoreBuildErrors`, erros de lint e TypeScript agora interrompem a build, reduzindo risco de regressões.
- **Dependências enxutas**: o `package.json` foi limpo para conter apenas os pacotes realmente utilizados, reduzindo tempo de instalação e superfície de manutenção.
- **Persistência ausente**: o fluxo continua apenas exibindo os dados no console. Para uso real, será necessário integrar com uma API ou serviço de armazenamento.

## Deploy

- Hospedagem atual no Vercel: [https://vercel.com/lraposoia-6118s-projects/v0-nex-people-solutions](https://vercel.com/lraposoia-6118s-projects/v0-nex-people-solutions)
- Projeto original no v0.app: [https://v0.app/chat/projects/XQ8P5ft3O69](https://v0.app/chat/projects/XQ8P5ft3O69)

> Caso precise ajustar a estrutura do projeto, combine previamente a alteração.
