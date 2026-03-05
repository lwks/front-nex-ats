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

- `GET /api/candidates/by-job-guids`: consulta candidatos por uma ou mais vagas usando o parâmetro `guid_vaga`.
  - Formatos aceitos pelo front-end proxy: `?guid_vaga=a,b,c` **ou** `?guid_vaga=a&guid_vaga=b&guid_vaga=c`.
  - O proxy normaliza os GUIDs recebidos e encaminha ao upstream no formato com múltiplos `guid_vaga`.
  - Quando nenhum GUID válido é informado, a rota retorna `400` com a mensagem `O parâmetro guid_vaga é obrigatório.`.

## Observações e pontos de atenção

- **Textos em UTF-8**: revisamos os arquivos da interface para garantir que os textos em português estejam com a acentuação correta.
- **Build mais rígido**: com a remoção de `ignoreDuringBuilds`/`ignoreBuildErrors`, erros de lint e TypeScript agora interrompem a build, reduzindo risco de regressões.
- **Dependências enxutas**: o `package.json` foi limpo para conter apenas os pacotes realmente utilizados, reduzindo tempo de instalação e superfície de manutenção.
- **Persistência ausente**: o fluxo continua apenas exibindo os dados no console. Para uso real, será necessário integrar com uma API ou serviço de armazenamento.


## Autenticação com AWS Cognito

Foi adicionado um fluxo de login/logout no front-end usando **OAuth2 Hosted UI do AWS Cognito**.

### Variáveis de ambiente

Configure no `.env.local`:

```bash
NEXT_PUBLIC_COGNITO_DOMAIN=<seu-dominio-cognito>
NEXT_PUBLIC_COGNITO_CLIENT_ID=<app-client-id>
NEXT_PUBLIC_COGNITO_REDIRECT_URI=http://localhost:3000/auth/callback
NEXT_PUBLIC_COGNITO_LOGOUT_URI=http://localhost:3000
# opcional
NEXT_PUBLIC_COGNITO_SCOPE=openid email profile
NEXT_PUBLIC_COGNITO_RESPONSE_TYPE=token
```

### Rotas adicionadas

- `GET /login`: tela de login do front com ação para redirecionar ao Cognito.
- `GET /auth/callback`: captura os tokens retornados no fragmento da URL e conclui a sessão local.

### Comportamento

1. Usuário clica em **Login** no cabeçalho ou entra em `/login`.
2. Front redireciona para `https://<domain>/oauth2/authorize`.
3. Cognito autentica e redireciona para `/auth/callback` com `access_token` e `id_token`.
4. Front persiste os tokens no `localStorage`, valida expiração e extrai os perfis (`cognito:groups`) do `id_token`.
5. O cabeçalho passa a exibir usuário autenticado, perfis disponíveis e ação de **Logout**.
6. No logout, a sessão local é limpa e o usuário é redirecionado para `https://<domain>/logout` (ou `/` como fallback).

> Observação: a validação implementada no front é de expiração e parsing do JWT para UX/roteamento. Para autorização sensível, valide tokens também no backend.

## Deploy

- Hospedagem atual no Vercel: [https://vercel.com/lraposoia-6118s-projects/v0-nex-people-solutions](https://vercel.com/lraposoia-6118s-projects/v0-nex-people-solutions)
- Projeto original no v0.app: [https://v0.app/chat/projects/XQ8P5ft3O69](https://v0.app/chat/projects/XQ8P5ft3O69)

> Caso precise ajustar a estrutura do projeto, combine previamente a alteração.
