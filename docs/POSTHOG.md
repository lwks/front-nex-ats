# PostHog no ClusterHR

Este guia configura a coleta de eventos de produto do front-end e monta o dashboard.
O backend `lambda-api-next` nao envia eventos nesta primeira versao.

## 1. Criar o projeto e obter as chaves

1. Crie uma conta em <https://posthog.com/> e escolha a regiao de hospedagem (US ou EU).
2. Crie um projeto para o site. Em **Project settings**, copie a **Project API Key**
   (normalmente com prefixo `phc_`) e o **API Host** mostrado no mesmo projeto.
3. Nao use **Personal API Key**. Ela tem outra finalidade e nao deve ir para o browser.
4. Limite o uso de Product Analytics na area de **Billing/Usage** antes de ativar
   o tracking em producao. Consulte os valores e a franquia atuais na pagina de
   precos do PostHog; eles podem mudar.

## 2. Configurar o front-end

No `.env.local` para teste manual ou nas variaveis de build do deploy:

```dotenv
NEXT_PUBLIC_POSTHOG_ENABLED=true
NEXT_PUBLIC_POSTHOG_KEY=phc_COLE_A_PROJECT_API_KEY
NEXT_PUBLIC_POSTHOG_HOST=https://COLE_O_API_HOST_DO_PROJETO
```

Use o host exato exibido pelo PostHog, conforme a regiao escolhida. As variaveis
`NEXT_PUBLIC_*` sao incorporadas ao bundle do Next.js no build. Depois de alterar
os valores no provedor de hospedagem, faca um novo build e deploy. A Project API
Key e publica; nao coloque tokens administrativos nestas variaveis. O arquivo
`.env.local` nao deve ser versionado.

Com `NEXT_PUBLIC_POSTHOG_ENABLED=false` ou sem chave/host, o front nao inicia o
PostHog e nao exibe a escolha de analytics. Para separar dados de teste, deixe
o tracking desligado no ambiente local/CI ou use outro projeto PostHog.

## 3. Coleta e consentimento

O visitante pode aceitar ou recusar analytics no aviso do site e alterar a escolha
no botao **Preferencias de analytics**. A escolha fica no `localStorage` do browser.
Antes do aceite, nenhum evento de produto e enviado. O aceite LGPD da candidatura
nao e usado como consentimento de analytics.

A captura automatica de cliques, pageviews, saida de pagina e gravacao de sessao
esta desligada. Apenas os eventos abaixo sao capturados. IDs de vaga e tipo de
conta podem ser enviados; nomes, emails, CPF, CV, mensagens, buscas e demais
campos de formulario nao devem ser enviados. A URL enviada pelo SDK e reduzida
ao caminho, sem query string. Revise essas regras ao adicionar eventos.
Se `NEXT_PUBLIC_VERCEL_ANALYTICS_ENABLED=true`, a integracao existente de
Vercel Analytics fica desativada enquanto PostHog estiver habilitado.

| Evento | Gatilho | Propriedades |
| --- | --- | --- |
| `jobs_list_viewed` | Visita a `/jobs/list` | nenhuma |
| `job_details_opened` | Abre modal ou pagina da vaga | `job_id`, `source` |
| `apply_clicked` | Clica no CTA de candidatura | `job_id`, `source` |
| `application_started` | Entra em `/candidaturas` | nenhuma |
| `application_step_completed` | Avanca uma etapa do formulario | `job_id`, `step` |
| `application_submitted` | API confirma a candidatura | `job_id`, `mode` |
| `application_failed` | Validacao ou envio falha | `job_id`, `reason` |
| `job_create_started` | Entra em `/jobs/create` | nenhuma |
| `job_created` | API confirma a nova vaga | `job_id` |
| `job_create_failed` | Validacao ou criacao falha | `reason` |
| `candidate_status_changed` | API confirma mudanca de etapa | `job_id`, `status` |
| `login_completed` | Login e tipo de conta confirmados | `account_type` |
| `signup_completed` | Cadastro e tipo de conta confirmados | `account_type` |

`reason` usa somente `validation` ou `request`, nunca a mensagem de erro livre.
Os eventos de sucesso sao enviados apos a confirmacao da operacao. Cliques no
CTA e envios confirmados sao eventos distintos.

## 4. Verificar se funciona

1. Inicie o front com `npm run dev` usando um projeto PostHog de teste.
2. Abra `/jobs/list` em uma janela anonima. Antes de aceitar, confirme em
   **Activity/Events** do PostHog que nao aparece evento dessa visita.
3. Aceite analytics. Confira `jobs_list_viewed` em **Activity/Events**. Abra uma
   vaga e clique em candidatar-se; confira `job_details_opened` e `apply_clicked`.
4. Complete uma candidatura de teste e confira `application_submitted` apenas
   depois da confirmacao da API. Teste uma falha e confira `application_failed`.
5. Recuse analytics nas preferencias e repita uma acao: nenhum novo evento de
   produto deve aparecer. Verifique tambem no navegador que nao ha request de
   captura ao PostHog apos a recusa.

Alguns eventos dependem de login e de vagas existentes. O harness integrado
`dev:local` e `test:e2e:local` exige autorizacao humana explicita conforme
`AGENTS.md`; a validacao manual pode usar outro ambiente de desenvolvimento.

## 5. Montar e abrir o dashboard

Em **Product Analytics > Dashboards**, crie um dashboard chamado **Fluxo do site**.
Crie insights e adicione cada um ao dashboard:

1. **Funil do candidato**: insight do tipo Funnel com `jobs_list_viewed` ->
   `job_details_opened` -> `apply_clicked` -> `application_started` ->
   `application_submitted`. Use usuarios unicos e um periodo de conversao
   compativel com o tempo de candidatura. O funil antes/depois do login so une
   a mesma pessoa se a identidade anonima for preservada pelo browser.
2. **Etapas da candidatura**: Trends de `application_step_completed`, com
   breakdown pela propriedade `step`, ao lado de `application_failed` e
   `application_submitted`.
3. **Criacao de vaga**: Funnel de `job_create_started` -> `job_created` e Trend
   de `job_create_failed` por `reason`.
4. **Pipeline da empresa**: Trend de `candidate_status_changed`, com breakdown
   por `status`.

Selecione o intervalo de datas e salve os insights. O dashboard fica na conta
PostHog e pode ser aberto em **Dashboards > Fluxo do site**. A interface do
PostHog pode mudar ligeiramente; procure os tipos **Funnel** e **Trends** se
os nomes dos menus forem diferentes. Nao existe dashboard publico no front.

## 6. Controlar custo

Em **Billing/Usage**, acompanhe os eventos de Product Analytics por mes e defina
um limite de uso/alerta adequado ao projeto. A captura automatica e a gravacao
de sessao permanecem desligadas para evitar volume inesperado. Confira a
franquia vigente em <https://posthog.com/pricing> antes de estimar custo.
