"use client"

import { FileUp, Lock } from "lucide-react"

import { Button } from "@/components/ui/button"

type UserRegistrationCvStepProps = {
  isSubmitting: boolean
  onBack: () => void
  onSubmit: () => void
}

export function UserRegistrationCvStep({
  isSubmitting,
  onBack,
  onSubmit,
}: UserRegistrationCvStepProps) {
  return (
    <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_24px_60px_rgba(15,23,42,0.08)] md:p-8">
      <div className="mb-8 text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#C44E00]">Cadastro oficial</p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">Upload de CV</h2>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          O envio de curriculo ficara disponivel em breve. Por enquanto, voce ja pode concluir seu cadastro sem anexar arquivo.
        </p>
      </div>

      <div className="rounded-[1.5rem] border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
        <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-slate-900 text-white">
          <FileUp className="size-6" aria-hidden="true" />
        </div>
        <p className="mt-5 text-base font-medium text-slate-900">Upload temporariamente desativado</p>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Quando a funcionalidade for liberada, voce podera enviar seu CV em PDF diretamente nesta etapa.
        </p>
        <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-500">
          <Lock className="size-4" aria-hidden="true" />
          Em breve
        </div>
      </div>

      <div className="flex gap-4 pt-8">
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          className="flex-1 rounded-full bg-transparent"
          size="lg"
          disabled={isSubmitting}
        >
          Voltar
        </Button>
        <Button
          type="button"
          onClick={() => onSubmit()}
          className="flex-1 rounded-full bg-[#FF6B00] text-white hover:bg-[#E55F00]"
          size="lg"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Finalizando..." : "Finalizar cadastro"}
        </Button>
      </div>
    </div>
  )
}
