# API Lambda Next — Base de dados e Endpoints

Este arquivo resume as informações de base de dados (DynamoDB) e endpoints da API, para uso no front-end.

## Base de dados (DynamoDB)

A API persiste dados em tabelas DynamoDB com chave composta `pk` + `sk`.

### Tabelas

- **Empresas**
- **Candidaturas**
- **Usuarios**
- **Vagas**

### Estrutura dos itens

Cada item criado pela API inclui automaticamente:

- `pk`: `${ENTITY_TYPE}#${id}` (por exemplo: `COMPANY#<id>`)
- `sk`: `ENTITY`
- `id`: UUID gerado quando não enviado no payload
- `entityType`: `company`, `candidate`, `user` ou `job`
- `createdAt`: timestamp ISO (UTC)
- `updatedAt`: timestamp ISO (UTC)

O payload enviado pela aplicação é mesclado com esses campos.

### Variáveis de ambiente

Use as variáveis abaixo para apontar as tabelas:

- `CANDIDATE_TABLE_NAME` (default: `Candidaturas`)
- `COMPANY_TABLE_NAME` (default: `Empresas`)
- `USER_TABLE_NAME` (default: `Usuarios`)
- `JOB_TABLE_NAME` (default: `Vagas`)

Opcionalmente, use `TABLE_NAME` como fallback global.

## Endpoints

Todos os endpoints de recursos são versionados sob `/api`.

### Saúde

- `GET /health`

### Candidatos (`/api/candidates`)

- `POST /` — cria candidato (obrigatório: `guid_id`)
- `GET /` — lista candidatos (query: `limit` 1–100, `lastKey`)
- `GET /:id` — detalhe de candidato
- `PUT /:id` — atualiza candidato
- `DELETE /:id` — remove candidato

### Empresas (`/api/companies`)

- `POST /` — cria empresa (obrigatório: `cd_cnpj`)
- `GET /` — lista empresas (query: `limit` 1–100, `lastKey`)
- `GET /:id` — detalhe de empresa
- `PUT /:id` — atualiza empresa
- `DELETE /:id` — remove empresa

### Usuários (`/api/users`)

- `POST /` — cria usuário (obrigatório: `cd_cpf`)
- `GET /` — lista usuários (query: `limit` 1–100, `lastKey`)
- `GET /:id` — detalhe de usuário
- `PUT /:id` — atualiza usuário
- `DELETE /:id` — remove usuário

### Vagas (`/api/jobs`)

- `POST /` — cria vaga (obrigatório: `guid_id`)
- `GET /` — lista vagas (query: `limit` 1–100, `lastKey`)
- `GET /:id` — detalhe de vaga
- `PUT /:id` — atualiza vaga
- `DELETE /:id` — remove vaga

### CEPs (`/api/zips`)

- `GET /:zip` — retorna string de localização (logradouro/bairro/cidade/UF)

Exemplo de resposta:

```json
{
  "data": "Rua Exemplo - Centro - São Paulo/SP"
}
```

Erros comuns:
- `400` — CEP inválido (formato diferente de 8 dígitos)
- `404` — CEP não encontrado
- `502` — Falha no serviço externo

### Documentação

- `GET /docs` — Swagger UI
- `GET /docs.json` — OpenAPI JSON

## Paginação

- `limit`: número máximo de itens (1–100; padrão 20)
- `lastKey`: cursor Base64URL retornado nas listagens
