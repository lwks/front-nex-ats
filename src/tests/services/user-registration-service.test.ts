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
    localResidencia: "01310930",
    endereco: "Sao Paulo, SP",
    contatoCel: "11999999999",
    contato: "mariana@clusterhr.com",
    lgpdAccepted: true,
    experiencia: "pleno",
    industria: "tecnologia-informacao-ti",
    salarioAtual: "8.000",
    cargoAtual: "Pessoa desenvolvedora",
    industriaInteresse: "desenvolvimento-software",
    cargoInteresse: "Tech lead",
    tipoContratacao: "clt",
    modeloTrabalho: ["remoto", "hibrido"],
    idiomas: ["portugues", "ingles"],
    skillsProfissionais: ["react", "typescript"],
    beneficiosAtuais: ["vale-refeicao", "plano-saude"],
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
})
