import { describe, expect, it } from "vitest"

import {
  createFakeUserAccount,
  validateFakeUserInput,
  type CreateFakeUserInput,
} from "@/services/user-registration-service"

function createInput(overrides: Partial<CreateFakeUserInput> = {}): CreateFakeUserInput {
  return {
    fullName: "Mariana Costa",
    email: "mariana@clusterhr.com",
    password: "Senha123",
    role: "candidate",
    wantsJobAlerts: true,
    acceptTerms: true,
    ...overrides,
  }
}

describe("user-registration-service", () => {
  it("creates a fake user account when the payload is valid", async () => {
    const result = await createFakeUserAccount(createInput({ email: "MARIANA@clusterhr.com " }))

    expect(result.id).toBeTruthy()
    expect(result.fullName).toBe("Mariana Costa")
    expect(result.email).toBe("mariana@clusterhr.com")
    expect(result.role).toBe("candidate")
    expect(result.status).toBe("active")
  })

  it("throws validation errors for invalid payloads", () => {
    expect(() =>
      validateFakeUserInput(
        createInput({
          fullName: "Al",
          email: "email-invalido",
          password: "123",
        }),
      ),
    ).toThrow("Informe um nome com pelo menos 3 caracteres.")
  })

  it("returns a controlled failure when the fake creation should simulate an error", async () => {
    await expect(
      createFakeUserAccount(createInput(), {
        shouldFail: true,
      }),
    ).rejects.toThrow("Nao foi possivel criar o usuario fake no momento.")
  })
})
