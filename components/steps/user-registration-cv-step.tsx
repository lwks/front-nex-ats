"use client"

import { FileUp, X } from "lucide-react"
import { Button } from "@/components/ui/button"

type Props = { isSubmitting: boolean; onBack: () => void; onSubmit: () => void; file?: File | null; onFileChange?: (file: File | null) => void; error?: string | null }

export function UserRegistrationCvStep({ isSubmitting, onBack, onSubmit, file = null, onFileChange = () => {}, error = null }: Props) {
  return <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_24px_60px_rgba(15,23,42,0.08)] md:p-8">
    <div className="mb-8 text-center"><p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#C44E00]">Cadastro oficial</p><h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">Upload de CV</h2><p className="mt-3 text-sm leading-6 text-slate-600">Anexe seu currículo para complementar a candidatura. O envio é opcional.</p></div>
    <div className="rounded-[1.5rem] border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
      <label className="mx-auto flex size-14 cursor-pointer items-center justify-center rounded-full bg-slate-900 text-white"><FileUp className="size-6" aria-hidden="true" /><input className="sr-only" type="file" accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" disabled={isSubmitting} onChange={e => onFileChange(e.target.files?.[0] ?? null)} aria-label="Selecionar currículo" /></label>
      <p className="mt-5 text-base font-medium text-slate-900">Selecionar currículo</p><p className="mt-2 text-sm leading-6 text-slate-600">Formatos aceitos: PDF, DOCX ou DOC. Tamanho máximo: 5 MB.</p>
      {file && <div className="mx-auto mt-4 flex max-w-md items-center justify-between gap-3 rounded-lg bg-white p-3 text-left text-sm"><span className="truncate">{file.name}</span><button type="button" aria-label="Remover currículo" onClick={() => onFileChange(null)}><X className="size-4" /></button></div>}
      {error && <p role="alert" className="mt-3 text-sm text-red-700">{error}</p>}
    </div>
    <div className="flex gap-4 pt-8"><Button type="button" variant="outline" onClick={onBack} className="flex-1 rounded-full bg-transparent" size="lg" disabled={isSubmitting}>Voltar</Button><Button type="button" onClick={onSubmit} className="flex-1 rounded-full bg-[#FF6B00] text-white hover:bg-[#E55F00]" size="lg" disabled={isSubmitting}>{isSubmitting ? "Enviando..." : "Enviar candidatura"}</Button></div>
  </div>
}
