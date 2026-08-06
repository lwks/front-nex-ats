export type ApplicationStatus =
  | "novos"
  | "entrevista-rh"
  | "entrevista-tecnica"
  | "proposta"
  | "contratado"
  | "rejeitado"

const BOARD_TO_API_STATUS: Record<ApplicationStatus, string> = {
  novos: "novo",
  "entrevista-rh": "entrevista-rh",
  "entrevista-tecnica": "entrevista-tecnica",
  proposta: "proposta",
  contratado: "contratado",
  rejeitado: "rejeitado",
}

export function mapBoardStatusToApiStatus(status: ApplicationStatus): string {
  return BOARD_TO_API_STATUS[status]
}

export function mapApiStatusToBoardStatus(statusValue?: string): ApplicationStatus {
  const normalized = statusValue
    ?.toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()

  if (
    normalized?.includes("rejeitado") ||
    normalized?.includes("reprovado") ||
    normalized?.includes("nao aderente")
  ) {
    return "rejeitado"
  }

  if (normalized?.includes("contratado") || normalized?.includes("admissao") || normalized?.includes("hired")) {
    return "contratado"
  }

  if (normalized?.includes("oferta") || normalized?.includes("proposta")) {
    return "proposta"
  }

  if (
    normalized?.includes("tecnica") ||
    normalized === "hm" ||
    normalized?.includes("gestor") ||
    normalized?.includes("case") ||
    normalized?.includes("teste")
  ) {
    return "entrevista-tecnica"
  }

  if (normalized === "rh" || normalized?.includes("recrutador") || normalized?.includes("people")) {
    return "entrevista-rh"
  }

  return "novos"
}
