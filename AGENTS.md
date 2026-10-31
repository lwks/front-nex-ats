
## Regras de validação ao implementar mudanças

- Para toda mudança no front-end, incluindo páginas, componentes, hooks, services, estilos e configurações, execute antes de concluir a tarefa a bateria mínima de validação: `npm.cmd test`, `npm.cmd run lint` e `npm.cmd run build`.
- Quando a mudança afetar interface, navegação ou interação do usuário, execute também `npm.cmd run test:e2e` para os cenários Playwright aplicáveis. Se não houver cenário Playwright aplicável ou disponível, registre essa limitação no resultado da validação.
- Uma mudança só pode ser considerada concluída depois que a bateria terminar; informe os comandos executados, os resultados e qualquer falha ou verificação não executada.
- Ao criar funcionalidade nova, corrigir bug, adicionar novo método ou nova classe, execute a suíte de testes antes de concluir a tarefa.
- Sempre inclua testes cobrindo cenários de sucesso e erro para novos métodos, novas classes e correções.
- Em mudanças relacionadas à integração com API, valide os fluxos principais e casos de falha com testes automatizados.
- Sempre que uma rota de página front-end for criada, removida ou alterada em `app/**/page.tsx`, atualize o `README.md` com o caminho e a finalidade da rota.
- Não é necessário documentar handlers internos `app/api/**/route.ts` no `README.md` do front-end.


## Integrações
- API que é utiliza no fluxo da aplicação (https://github.com/lwks/lambda-api-next/tree/develop), em caso de duvidas consulte o README.md;

## Harness local integrado

- Leia `docs/LOCAL_HARNESS.md` e o guia compartilhado em `docs/AGENTS.parent.md`.
- Com o backend na pasta irmã `../lambda-api-next`, `npm run dev:local` sobe front, API e auth simulada; `npm run local:doctor` verifica os serviços. Pare com Ctrl+C.
- Alterne empresa/candidato na barra amarela. Preserve as validações de sessão, perfil e propriedade.
- Teste a integração com `npm run test:e2e:local`; pare outros processos Next antes de executar.
- No Linux/macOS, os comandos `npm.cmd` acima correspondem a `npm`.
