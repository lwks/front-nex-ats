
## Regras de validação ao implementar mudanças

- Ao criar funcionalidade nova, corrigir bug, adicionar novo método ou nova classe, execute a suíte de testes antes de concluir a tarefa.
- Sempre inclua testes cobrindo cenários de sucesso e erro para novos métodos, novas classes e correções.
- Em mudanças relacionadas à integração com API, valide os fluxos principais e casos de falha com testes automatizados.
- Sempre que uma rota de página front-end for criada, removida ou alterada em `app/**/page.tsx`, atualize o `README.md` com o caminho e a finalidade da rota.
- Não é necessário documentar handlers internos `app/api/**/route.ts` no `README.md` do front-end.


## Integrações
- API que é utiliza no fluxo da aplicação (https://github.com/lwks/lambda-api-next/tree/develop), em caso de duvidas consulte o README.md;
