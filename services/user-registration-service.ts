export type UserRegistrationLanguage = {
  idioma: string
  fluencia: string
}

export type UserRegistrationData = {
  nome: string
  documento: string
  dataNascimento: string
  localResidencia: string
  endereco: string
  cidade: string
  estado: string
  contatoCel: string
  contato: string
  lgpdAccepted: boolean
  empresaAtual: string
  senioridade: string
  beneficiosAtuais: string[]
  experiencia: string
  salarioAtual: string
  cargoAtual: string
  industriaInteresse: string[]
  cargoInteresse: string[]
  hardSkillsProfissionais: string[]
  softSkillsProfissionais: string[]
  ferramentasProfissionais: string[]
  tipoContratacao: string[]
  modeloTrabalho: string[]
  idiomas: UserRegistrationLanguage[]
  hardSkills: string[]
  softSkills: string[]
  ferramentas: string[]
  viagemTrabalho: string
  pretensaoSalarial: string
  sobreVoce: string
  mensagemEmpresa: string
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

function requireValidDate(value: string, message: string) {
  requireNonEmptyValue(value, message)

  const parsedDate = new Date(`${value}T00:00:00`)
  if (Number.isNaN(parsedDate.getTime())) {
    throw new Error("Informe uma data de nascimento valida.")
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  if (parsedDate > today) {
    throw new Error("A data de nascimento nao pode estar no futuro.")
  }
}

function requireLanguageSelection(values: UserRegistrationLanguage[], message: string) {
  if (values.length === 0) {
    return
  }

  for (const language of values) {
    if (language.idioma.trim().length === 0) {
      throw new Error("Selecione um idioma.")
    }

    if (language.fluencia.trim().length === 0) {
      throw new Error("Selecione o nivel de fluencia do idioma.")
    }
  }
}

export function validateUserRegistrationData(data: UserRegistrationData) {
  requireNonEmptyValue(data.nome, "Informe nome e sobrenome.")
  requireNonEmptyValue(data.documento, "Informe seu CPF ou RG.")
  requireValidDate(data.dataNascimento, "Informe a data de nascimento.")
  requireNonEmptyValue(data.localResidencia, "Informe o CEP.")
  requireNonEmptyValue(data.endereco, "Informe o endereco.")
  requireNonEmptyValue(data.cidade, "Informe a cidade.")
  requireNonEmptyValue(data.estado, "Informe o estado.")
  requireNonEmptyValue(data.contatoCel, "Informe o celular.")
  requireNonEmptyValue(data.contato, "Informe o email.")
  requireNonEmptyValue(data.empresaAtual, "Informe a empresa atual.")
  requireNonEmptyValue(data.cargoAtual, "Informe o cargo atual.")
  requireNonEmptyValue(data.senioridade, "Selecione a senioridade atual.")

  if (!EMAIL_PATTERN.test(data.contato.trim())) {
    throw new Error("Digite um e-mail valido.")
  }

  requireNonEmptyValue(data.experiencia, "Selecione seu nivel de experiencia.")
  requireNonEmptyValue(data.salarioAtual, "Informe o salario atual.")
  requireSelection(data.industriaInteresse, "Selecione ao menos uma area.")

  requireSelection(data.beneficiosAtuais, "Selecione ao menos um beneficio atual.")
  requireSelection(data.cargoInteresse, "Selecione ao menos um cargo.")
  requireSelection(data.hardSkillsProfissionais, "Selecione ao menos uma hard skill profissional.")
  requireSelection(data.softSkillsProfissionais, "Selecione ao menos uma soft skill profissional.")
  requireSelection(data.ferramentasProfissionais, "Selecione ao menos uma ferramenta profissional.")
  requireSelection(data.tipoContratacao, "Selecione ao menos um tipo de contratacao.")
  requireSelection(data.modeloTrabalho, "Selecione ao menos um modelo de trabalho.")
  requireLanguageSelection(data.idiomas, "Selecione ao menos um idioma.")
  requireSelection(data.hardSkills, "Selecione ao menos uma hard skill.")
  requireSelection(data.softSkills, "Selecione ao menos uma soft skill.")
  requireSelection(data.ferramentas, "Selecione ao menos uma ferramenta.")
  requireNonEmptyValue(data.viagemTrabalho, "Selecione a disponibilidade para viagem de trabalho.")
  requireNonEmptyValue(data.pretensaoSalarial, "Informe a pretensao salarial.")
  requireNonEmptyValue(data.sobreVoce, "Conte um pouco sobre voce.")

  if (data.industriaInteresse.length > 3) {
    throw new Error("Selecione no maximo 3 areas.")
  }

  if (data.hardSkillsProfissionais.length > 7) {
    throw new Error("Selecione no maximo 7 hard skills profissionais.")
  }

  if (data.softSkillsProfissionais.length > 7) {
    throw new Error("Selecione no maximo 7 soft skills profissionais.")
  }

  if (data.ferramentasProfissionais.length > 7) {
    throw new Error("Selecione no maximo 7 ferramentas profissionais.")
  }

  if (data.hardSkills.length > 7) {
    throw new Error("Selecione no maximo 7 hard skills.")
  }

  if (data.softSkills.length > 7) {
    throw new Error("Selecione no maximo 7 soft skills.")
  }

  if (data.ferramentas.length > 7) {
    throw new Error("Selecione no maximo 7 ferramentas.")
  }

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
