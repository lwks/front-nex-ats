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
    industriaInteresse: "desenvolvimento-software",
    cargoInteresse: ["tech-lead", "desenvolvedor-full-stack"],
    tipoContratacao: ["clt", "pj"],
    modeloTrabalho: ["remoto", "hibrido"],
    idiomas: [
      { idioma: "portugues", fluencia: "nativo" },
      { idioma: "ingles", fluencia: "avancado" },
    ],
    skillsProfissionais: ["react", "typescript"],
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
  })

  it("requires idioma and fluencia for each language entry", () => {
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
})
