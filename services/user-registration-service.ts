export type UserRegistrationData = {
  nome: string
  documento: string
  localResidencia: string
  endereco: string
  contatoCel: string
  contato: string
  lgpdAccepted: boolean
  experiencia: string
  industria: string
  salarioAtual: string
  cargoAtual: string
  industriaInteresse: string
  cargoInteresse: string
  tipoContratacao: string
  modeloTrabalho: string[]
  idiomas: string[]
  skillsProfissionais: string[]
  beneficiosAtuais: string[]
  compartilhamentoAccepted: boolean
}

export type UserRegistrationSubmission = {
  nome: string
  contato: string
  submittedAt: string
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function requireNonEmptyValue(value: string, message: string) {
  if (value.trim().length === 0) {
    throw new Error(message)
  }
}

function requireSelection(values: string[], message: string) {
  if (values.length === 0) {
    throw new Error(message)
  }
}

export function validateUserRegistrationData(data: UserRegistrationData) {
  requireNonEmptyValue(data.nome, "Informe nome e sobrenome.")
  requireNonEmptyValue(data.documento, "Informe seu CPF ou RG.")
  requireNonEmptyValue(data.localResidencia, "Informe o CEP.")
  requireNonEmptyValue(data.endereco, "Informe o endereco.")
  requireNonEmptyValue(data.contatoCel, "Informe o celular.")
  requireNonEmptyValue(data.contato, "Informe o email.")

  if (!EMAIL_PATTERN.test(data.contato.trim())) {
    throw new Error("Digite um e-mail valido.")
  }

  requireNonEmptyValue(data.experiencia, "Selecione seu nivel de experiencia.")
  requireNonEmptyValue(data.industria, "Selecione a industria atual.")
  requireNonEmptyValue(data.salarioAtual, "Informe o salario atual.")
  requireNonEmptyValue(data.cargoAtual, "Informe o cargo atual.")
  requireNonEmptyValue(data.industriaInteresse, "Selecione a industria de interesse.")
  requireNonEmptyValue(data.cargoInteresse, "Informe o cargo de interesse.")
  requireNonEmptyValue(data.tipoContratacao, "Selecione o tipo de contratacao.")

  requireSelection(data.modeloTrabalho, "Selecione ao menos um modelo de trabalho.")
  requireSelection(data.idiomas, "Selecione ao menos um idioma.")
  requireSelection(data.skillsProfissionais, "Selecione ao menos uma skill profissional.")
  requireSelection(data.beneficiosAtuais, "Selecione ao menos um beneficio atual.")

  if (data.lgpdAccepted !== true) {
    throw new Error("Aceite os termos de privacidade para continuar.")
  }

  if (data.compartilhamentoAccepted !== true) {
    throw new Error("Confirme o compartilhamento de dados para continuar.")
  }
}

export async function submitUserRegistration(data: UserRegistrationData): Promise<UserRegistrationSubmission> {
  validateUserRegistrationData(data)

  await Promise.resolve()

  return {
    nome: data.nome.trim(),
    contato: data.contato.trim().toLowerCase(),
    submittedAt: new Date().toISOString(),
  }
}
