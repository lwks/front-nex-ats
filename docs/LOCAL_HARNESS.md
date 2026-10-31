# Executar front e back localmente

Requer Node.js 22+, npm e os diretórios irmãos `front-nex-ats` e `lambda-api-next`, ambos com a branch `feature/config-harness` ou suas mudanças incorporadas.

```bash
# Na pasta pai:
npm --prefix front-nex-ats ci
npm --prefix lambda-api-next ci
npm --prefix front-nex-ats run dev:local
```

Abra http://localhost:3000. Na barra amarela, escolha **Entrar como empresa** ou **Entrar como candidato**. Não precisa de Supabase real, credenciais AWS, Docker nem `.env.local`. O launcher sobrescreve configurações somente nos processos filhos; não modifica seus arquivos de ambiente. O comando normal `npm run dev` continua usando a configuração real existente.

O launcher sobe o simulador Supabase em 54329, Express em 3001 e Next em 3000, todos ligados a loopback. Ele aguarda readiness, recusa portas ocupadas e encerra os filhos em Ctrl+C. A barra local aparece em todas as páginas. As regras de permissão continuam ativas; para navegar no outro perfil, troque pela barra. A troca afeta as abas do mesmo navegador.

O banco e CVs são persistidos em `../lambda-api-next/.harness/`, ignorado pelo Git. Já existe uma vaga da empresa local, uma candidata e um PDF fictício. Use os CEPs `01001000`, `01310100` ou `20040002`; outros retornam 404 offline.

```bash
npm run local:doctor  # em outro terminal, verifica os três serviços
# Pare o launcher antes de restaurar os dados fictícios:
npm run local:reset
```

Você pode configurar `HARNESS_FRONT_PORT`, `HARNESS_BACK_PORT`, `E2E_SUPABASE_PORT` antes dos comandos. O caminho opcional `HARNESS_DATA_DIR` é interpretado no diretório do backend e deve apontar apenas para dados descartáveis do harness. `local:reset` apaga banco e uploads desse diretório; não use uma pasta com arquivos pessoais.

## Validação

Pare o Next local antes dos testes/build, pois compartilham `.next`.

```bash
npm test
npm run lint
npm run build
npx playwright install chromium
npm run test:e2e
npm run test:e2e:local
# Alternativa sem Chromium, valida integração real por HTTP:
npm run test:e2e:local -- api.spec.ts
```

O E2E integrado sobe os dois repositórios e auth local em portas 3100/3101/54330, com dados isolados em `.harness/e2e` no backend. O cenário de interface cria vaga, preenche candidatura, envia CV, salva anotação, consulta status e recupera arquivo pelos serviços locais. O cenário HTTP valida sessões, páginas renderizadas, integração e permissões sem exigir navegador.

O modo local é recusado no build de produção, no Lambda handler e em runtimes hospedados. Os handlers `/api/local/*` ficam indisponíveis no modo normal. O simulador não é um servidor de identidade para uso público. Não configure `HARNESS_MODE=local` em Netlify/AWS/Vercel.

Copie [AGENTS.parent.md](AGENTS.parent.md) para a pasta pai com o nome `AGENTS.md` e abra a pasta pai no Codex. O guia detalha fluxos, dados, limites e comandos.
