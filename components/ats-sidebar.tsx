"use client"

import Link from "next/link"
import type { ComponentType } from "react"
import { useState } from "react"
import {
  BarChart3,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  GraduationCap,
  Handshake,
  LineChart,
  Lock,
  Users,
} from "lucide-react"

type SidebarIcon = ComponentType<{ className?: string }>

export type AtsSidebarItemKey = "ats" | "relatorio"

type AtsSidebarItem = {
  key: AtsSidebarItemKey
  href: string
  label: string
  description: string
  icon: SidebarIcon
}

type AtsSidebarProps = {
  activeItem: AtsSidebarItemKey
}

export const ATS_NAV_ITEMS: AtsSidebarItem[] = [
  {
    key: "ats",
    href: "/",
    label: "ATS",
    description: "Sistema de Rastreamento",
    icon: Users,
  },
  {
    key: "relatorio",
    href: "/empresa/relatorio",
    label: "Relatorio",
    description: "Indicadores operacionais",
    icon: BarChart3,
  },
] as const

export const BLOCKED_MODULE_LABELS = ["Performance", "Estudos", "Parceiros"] as const

const blockedModules = [
  { label: "Performance", description: "Analise de Desempenho", icon: LineChart },
  { label: "Estudos", description: "Central de Estudos", icon: GraduationCap },
  { label: "Parceiros", description: "Recrutamento Externo", icon: Handshake },
] as const

export function AtsSidebar({ activeItem }: AtsSidebarProps) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)

  return (
    <aside
      className={`sticky top-0 hidden h-screen shrink-0 flex-col border-r border-[#333333] bg-[#1a1a1a] text-white transition-all duration-300 md:flex ${
        isSidebarCollapsed ? "w-20" : "w-72"
      }`}
    >
      <div
        className={`flex items-center justify-between border-b border-[#333333] p-5 ${
          isSidebarCollapsed ? "flex-col gap-4" : ""
        }`}
      >
        <div className="min-w-0">
          <h1 className={`font-semibold ${isSidebarCollapsed ? "text-center text-sm" : "text-xl"}`}>
            {isSidebarCollapsed ? "CHR" : "ClusterHR"}
          </h1>
          {!isSidebarCollapsed ? (
            <p className="mt-1 text-sm text-gray-400">Gestao de Talentos</p>
          ) : null}
        </div>
        <button
          type="button"
          onClick={() => setIsSidebarCollapsed((previous) => !previous)}
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[#333333] text-gray-300 transition hover:border-[#FF6B00] hover:text-white"
          aria-label={isSidebarCollapsed ? "Expandir sidebar" : "Minimizar sidebar"}
          aria-expanded={!isSidebarCollapsed}
        >
          {isSidebarCollapsed ? <ChevronsRight className="size-4" /> : <ChevronsLeft className="size-4" />}
        </button>
      </div>

      <nav className="flex-1 space-y-2 p-4">
        {ATS_NAV_ITEMS.map((item) => {
          const Icon = item.icon
          const isActive = item.key === activeItem
          return (
            <Link
              key={item.key}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={`flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left shadow-lg transition ${
                isActive
                  ? "bg-[#FF6B00] text-white"
                  : "border border-[#333333] text-gray-300 hover:border-[#FF6B00] hover:text-white"
              }`}
            >
              <Icon className="size-5 shrink-0" />
              {!isSidebarCollapsed ? (
                <span>
                  <span className="block font-medium">{item.label}</span>
                  <span className="block text-xs opacity-80">{item.description}</span>
                </span>
              ) : null}
              {!isSidebarCollapsed && !isActive ? <ChevronRight className="ml-auto size-4 shrink-0" /> : null}
            </Link>
          )
        })}

        {blockedModules.map((module) => {
          const Icon = module.icon
          return (
            <button
              key={module.label}
              type="button"
              disabled
              className="flex w-full cursor-not-allowed items-center gap-3 rounded-lg px-4 py-3 text-left text-gray-500 opacity-70"
              aria-disabled="true"
              title={`${module.label} bloqueado`}
            >
              <Icon className="size-5 shrink-0" />
              {!isSidebarCollapsed ? (
                <span className="min-w-0 flex-1">
                  <span className="block font-medium">{module.label}</span>
                  <span className="block text-xs">{module.description}</span>
                </span>
              ) : null}
              {!isSidebarCollapsed ? <Lock className="size-4 shrink-0" /> : null}
            </button>
          )
        })}
      </nav>

      {!isSidebarCollapsed ? (
        <div className="border-t border-[#333333] p-4">
          <div className="rounded-lg bg-gradient-to-r from-[#FF6B00] to-[#FF8C00] p-4 text-white shadow-xl">
            <Lock className="mb-2 size-5" />
            <p className="text-sm font-semibold">Modulos bloqueados</p>
            <p className="mt-1 text-xs opacity-90">Disponiveis em uma proxima etapa.</p>
          </div>
        </div>
      ) : null}
    </aside>
  )
}
