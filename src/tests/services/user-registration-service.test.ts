import { describe, expect, it } from "vitest"

import {
  submitUserRegistration,
  validateUserRegistrationData,
  type UserRegistrationData,
} from "@/services/user-registration-service"

function createInput(overrides: Partial<UserRegistrationData> = {}): UserRegistrationData {
  return {
    nome: "Mariana Costa",
    documento: "12345678909",
    dataNascimento: "1992-04-15",
    localResidencia: "01310930",
    endereco: "Sao Paulo, SP",
    cidade: "Sao Paulo",
    estado: "SP",
    contatoCel: "11999999999",
    contato: "mariana@clusterhr.com",
    lgpdAccepted: true,
    empresaAtual: "ClusterHR",
    senioridade: "pleno",
    beneficiosAtuais: ["vale-refeicao", "plano-saude"],
    experiencia: "pleno",
    industria: "tecnologia-informacao-ti",
    salarioAtual: "8.000",
    cargoAtual: "Pessoa desenvolvedora",
    industriaInteresse: ["desenvolvimento-software", "financeiro-bancario"],
    cargoInteresse: ["tech-lead", "desenvolvedor-full-stack"],
    tipoContratacao: ["clt", "pj"],
    modeloTrabalho: ["remoto", "hibrido"],
    idiomas: [
      { idioma: "portugues", fluencia: "nativo" },
      { idioma: "ingles", fluencia: "avancado" },
    ],
    hardSkills: ["react", "sql"],
    softSkills: ["comunicacao-oral", "trabalho-equipe"],
    ferramentas: ["figma", "jira"],
    viagemTrabalho: "sim",
    pretensaoSalarial: "12.000",
    sobreVoce: "Profissional com experiencia em produto e tecnologia.",
    mensagemEmpresa: "Tenho interesse em contribuir com a evolucao do time.",
    compartilhamentoAccepted: true,
    ...overrides,
  }
}

describe("user-registration-service", () => {
  it("submits the official registration payload when the data is valid", async () => {
    const result = await submitUserRegistration(createInput({ contato: "MARIANA@clusterhr.com " }))

    expect(result.nome).toBe("Mariana Costa")
    expect(result.contato).toBe("mariana@clusterhr.com")
    expect(result.submittedAt).toBeTruthy()
  })

  it("throws validation errors for invalid payloads", () => {
    expect(() =>
      validateUserRegistrationData(
        createInput({
          contato: "email-invalido",
        }),
      ),
    ).toThrow("Digite um e-mail valido.")
  })

  it("requires fixed-list multi-select choices before completing the registration", () => {
    expect(() =>
      validateUserRegistrationData(
        createInput({
          modeloTrabalho: [],
        }),
      ),
    ).toThrow("Selecione ao menos um modelo de trabalho.")
  })

  it("requires birth date", () => {
    expect(() =>
      validateUserRegistrationData(
        createInput({
          dataNascimento: "",
        }),
      ),
    ).toThrow("Informe a data de nascimento.")
  })

  it("rejects invalid birth date", () => {
    expect(() =>
      validateUserRegistrationData(
        createInput({
          dataNascimento: "invalida",
        }),
      ),
    ).toThrow("Informe uma data de nascimento valida.")
  })

  it("rejects future birth date", () => {
    expect(() =>
      validateUserRegistrationData(
        createInput({
          dataNascimento: "2999-01-01",
        }),
      ),
    ).toThrow("A data de nascimento nao pode estar no futuro.")
  })

  it("requires all new personal string fields", () => {
    expect(() =>
      validateUserRegistrationData(
        createInput({
          cidade: "",
        }),
      ),
    ).toThrow("Informe a cidade.")

    expect(() =>
      validateUserRegistrationData(
        createInput({
          estado: "",
        }),
      ),
    ).toThrow("Informe o estado.")

    expect(() =>
      validateUserRegistrationData(
        createInput({
          empresaAtual: "",
        }),
      ),
    ).toThrow("Informe a empresa atual.")

    expect(() =>
      validateUserRegistrationData(
        createInput({
          cargoAtual: "",
        }),
      ),
    ).toThrow("Informe o cargo atual.")

    expect(() =>
      validateUserRegistrationData(
        createInput({
          senioridade: "",
        }),
      ),
    ).toThrow("Selecione a senioridade atual.")
  })

  it("requires all new multi-select fields", () => {
    expect(() =>
      validateUserRegistrationData(
        createInput({
          industriaInteresse: [],
        }),
      ),
    ).toThrow("Selecione ao menos uma industria de interesse.")

    expect(() =>
      validateUserRegistrationData(
        createInput({
          beneficiosAtuais: [],
        }),
      ),
    ).toThrow("Selecione ao menos um beneficio atual.")

    expect(() =>
      validateUserRegistrationData(
        createInput({
          cargoInteresse: [],
        }),
      ),
    ).toThrow("Selecione ao menos um cargo de interesse.")

    expect(() =>
      validateUserRegistrationData(
        createInput({
          tipoContratacao: [],
        }),
      ),
    ).toThrow("Selecione ao menos um tipo de contratacao.")

    expect(() =>
      validateUserRegistrationData(
        createInput({
          hardSkills: [],
        }),
      ),
    ).toThrow("Selecione ao menos uma hard skill.")

    expect(() =>
      validateUserRegistrationData(
        createInput({
          softSkills: [],
        }),
      ),
    ).toThrow("Selecione ao menos uma soft skill.")

    expect(() =>
      validateUserRegistrationData(
        createInput({
          ferramentas: [],
        }),
      ),
    ).toThrow("Selecione ao menos uma ferramenta.")
  })

  it("enforces selection limits for industry, hard skills, soft skills and tools", () => {
    expect(() =>
      validateUserRegistrationData(
        createInput({
          industriaInteresse: ["1", "2", "3", "4"],
        }),
      ),
    ).toThrow("Selecione no maximo 3 industrias de interesse.")

    expect(() =>
      validateUserRegistrationData(
        createInput({
          hardSkills: ["1", "2", "3", "4", "5", "6", "7", "8"],
        }),
      ),
    ).toThrow("Selecione no maximo 7 hard skills.")

    expect(() =>
      validateUserRegistrationData(
        createInput({
          softSkills: ["1", "2", "3", "4", "5", "6", "7", "8"],
        }),
      ),
    ).toThrow("Selecione no maximo 7 soft skills.")

    expect(() =>
      validateUserRegistrationData(
        createInput({
          ferramentas: ["1", "2", "3", "4", "5", "6", "7", "8"],
        }),
      ),
    ).toThrow("Selecione no maximo 7 ferramentas.")
  })

  it("requires idioma and fluencia for each language entry", () => {
    expect(() =>
      validateUserRegistrationData(
        createInput({
          idiomas: [],
        }),
      ),
    ).not.toThrow()

    expect(() =>
      validateUserRegistrationData(
        createInput({
          idiomas: [{ idioma: "", fluencia: "fluente" }],
        }),
      ),
    ).toThrow("Selecione um idioma.")

    expect(() =>
      validateUserRegistrationData(
        createInput({
          idiomas: [{ idioma: "ingles", fluencia: "" }],
        }),
      ),
    ).toThrow("Selecione o nivel de fluencia do idioma.")
  })

  it("requires travel availability, salary expectation and summary while allowing empty company message", async () => {
    expect(() =>
      validateUserRegistrationData(
        createInput({
          viagemTrabalho: "",
        }),
      ),
    ).toThrow("Selecione a disponibilidade para viagem de trabalho.")

    expect(() =>
      validateUserRegistrationData(
        createInput({
          pretensaoSalarial: "",
        }),
      ),
    ).toThrow("Informe a pretensao salarial.")

    expect(() =>
      validateUserRegistrationData(
        createInput({
          sobreVoce: "   ",
        }),
      ),
    ).toThrow("Conte um pouco sobre voce.")

    await expect(
      submitUserRegistration(
        createInput({
          mensagemEmpresa: "",
        }),
      ),
    ).resolves.toMatchObject({
      nome: "Mariana Costa",
      contato: "mariana@clusterhr.com",
    })
  })
})
