# Workspace ATS — front e back

Este arquivo deve ficar na pasta pai, com o nome `AGENTS.md`. Abra essa pasta no Codex:

```text
projetos-ats/
  AGENTS.md
  front-nex-ats/       # Next.js, repositório Git independente
  lambda-api-next/    # Express/Lambda, repositório Git independente
```

## Como trabalhar

- Leia também o `AGENTS.md` de cada repositório antes de alterá-lo.
- Confira `git status` e a branch de cada projeto. Não descarte mudanças do usuário.
- Ambos precisam conter a implementação do harness (`feature/config-harness`, ou a branch que já a incorporou).
- Trate contratos front/back como uma integração. Faça os commits separadamente em cada repositório.
- Use Node.js 22 ou superior e npm. No Windows/PowerShell, use `npm.cmd` caso a política bloqueie `npm.ps1`; no Linux/macOS, use `npm`.

## Preparar uma máquina nova

Execute a partir da pasta pai:

```bash
npm --prefix front-nex-ats ci
npm --prefix lambda-api-next ci
npm --prefix front-nex-ats exec -- playwright install chromium
```

Não é necessário configurar Supabase, AWS, Docker ou arquivos `.env` para o modo local.

## Subir a aplicação completa

```bash
npm --prefix front-nex-ats run dev:local
```

Mantenha esse processo ativo. Ele sobe e encerra os três serviços juntos. Aguarde a mensagem `Harness ready` antes de navegar:

| Serviço | Endereço padrão |
| --- | --- |
| Front | http://localhost:3000 |
| API Express | http://localhost:3001/api |
| Swagger da API | http://localhost:3001/docs |
| Autenticação simulada | http://localhost:54329 |

O launcher exige que as portas estejam livres; não reutiliza servidores desconhecidos. Para encerrar, use Ctrl+C no terminal do launcher. Para verificar, em outro terminal:

```bash
npm --prefix front-nex-ats run local:doctor
```

Se necessário, configure `HARNESS_FRONT_PORT`, `HARNESS_BACK_PORT` e `E2E_SUPABASE_PORT` no terminal antes de iniciar. Use as mesmas variáveis no `local:doctor` e `local:reset`.

## Navegar com o Codex

- Abra http://localhost:3000 e use a barra amarela `Ambiente local · dados fictícios`.
- `Entrar como empresa`: usuário local `company`, perfil `COMPANY`; abre `/empresa/candidaturas`.
- `Entrar como candidato`: usuário local `candidate`, perfil `CANDIDATE`; abre `/jobs/list`.
- A barra continua disponível em todas as páginas para alternar o perfil.
- A sessão é compartilhada pelas abas do mesmo navegador. Use contextos separados para testar dois perfis simultaneamente.
- Também há login manual local: `company@example.com` ou `candidate@example.com`, senha fictícia `correct-password`.
- Nenhuma credencial real é necessária. Não copie chaves administrativas, tokens ou dados pessoais para o harness.

## Dados de exemplo e fluxos

O banco JSON e os currículos ficam em `lambda-api-next/.harness/` (ignorado pelo Git), persistindo após reiniciar.

- Empresa local é dona da vaga `11111111-1111-4111-8111-111111111111`, chamada `Engenheiro de Software Local`.
- A candidatura `22222222-2222-4222-8222-222222222222` é de `Mariana Local` e tem um PDF fictício para download.
- CEPs disponíveis offline: `01001000`, `01310100`, `20040002`. Outros CEPs válidos retornam 404.
- Crie vagas como empresa em `/jobs/create`.
- Como candidato, abra `/candidaturas?vagaGuid=11111111-1111-4111-8111-111111111111` e complete o formulário, com upload opcional de PDF/DOC/DOCX até 5 MB.
- Como empresa, consulte o pipeline em `/empresa/candidaturas`, mova cards, salve anotações e baixe o CV de vagas da empresa local. Relatórios em `/empresa/relatorio`.

Para restaurar os dados fictícios, pare o launcher e execute:

```bash
npm --prefix front-nex-ats run local:reset
```

Isso apaga somente o banco e uploads do harness selecionado. Não execute durante o uso do ambiente; alterações locais de teste serão perdidas.

## Autenticação, autorização e limites

- O harness troca o provedor remoto por um simulador local. Cookies, proxies Next, validações de perfil e verificação de propriedade continuam ativos.
- Um candidato não pode criar vagas nem baixar CVs como empresa. Para outro fluxo, alterne o perfil pela barra, sem remover guards.
- Não resolva 401/403 desativando permissões. Verifique a sessão e o perfil selecionado, o `owner_sub` da vaga e os logs.
- O launcher configura explicitamente as URLs locais e não altera `.env.local`. Não use a Lambda publicada como fallback quando um serviço local estiver indisponível.
- O modo local é recusado em produção, Netlify, Vercel e Lambda. Não configure `HARNESS_MODE=local` em deploys.
- JSON local e arquivos simulam DynamoDB e S3: não validam IAM, assinatura S3 real, concorrência distribuída ou login OAuth real. Para esses casos, use o ambiente de integração real com as configurações normais, sem o launcher local.

## Verificações antes de concluir

Execute as verificações específicas dos `AGENTS.md` internos. Comandos a partir da pasta pai:

```bash
npm --prefix lambda-api-next test
npm --prefix front-nex-ats test
npm --prefix front-nex-ats run lint
npm --prefix front-nex-ats run build
npm --prefix front-nex-ats run test:e2e
npm --prefix front-nex-ats run test:e2e:local
```

- Execute os servidores/testes de front sequencialmente: o Next usa o mesmo diretório `.next`. Pare `dev:local` antes dos E2E e do build.
- O E2E integrado usa portas 3100/3101/54330 e dados isolados em `lambda-api-next/.harness/e2e/`.
- Para validar somente a integração HTTP, sem navegador: `npm --prefix front-nex-ats run test:e2e:local -- api.spec.ts`.
- Registre comandos, resultados e limitações reais. Não declare navegação validada apenas porque o servidor iniciou ou a integração HTTP passou.
- Não execute `test:e2e:production` como substituto dos testes locais: ele usa serviços publicados.
