"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Check, ChevronDown } from "lucide-react"

import { Checkbox } from "@/components/ui/checkbox"
import type { OnboardingOption } from "@/lib/onboarding-options"
import { cn } from "@/lib/utils"

export type MultiSelectProps = {
  disabled?: boolean
  id?: string
  onChange: (value: string[]) => void
  options: OnboardingOption[]
  placeholder: string
  value: string[]
}

export function toggleMultiSelectValue(currentValue: string[], optionValue: string) {
  if (currentValue.includes(optionValue)) {
    return currentValue.filter((item) => item !== optionValue)
  }

  return [...currentValue, optionValue]
}

export function buildMultiSelectSummary(options: OnboardingOption[], value: string[], placeholder: string) {
  if (value.length === 0) {
    return placeholder
  }

  const selectedLabels = options
    .filter((option) => value.includes(option.value))
    .map((option) => option.label)

  if (selectedLabels.length <= 2) {
    return selectedLabels.join(", ")
  }

  return `${selectedLabels.slice(0, 2).join(", ")} +${selectedLabels.length - 2}`
}

export function MultiSelect({ disabled = false, id, onChange, options, placeholder, value }: MultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement | null>(null)

  const summary = useMemo(() => buildMultiSelectSummary(options, value, placeholder), [options, placeholder, value])

  useEffect(() => {
    if (!isOpen) {
      return
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false)
      }
    }

    window.addEventListener("mousedown", handleClickOutside)
    window.addEventListener("keydown", handleEscape)

    return () => {
      window.removeEventListener("mousedown", handleClickOutside)
      window.removeEventListener("keydown", handleEscape)
    }
  }, [isOpen])

  return (
    <div className="relative" ref={containerRef}>
      <button
        id={id}
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen((current) => !current)}
        className={cn(
          "border-input focus-visible:border-ring focus-visible:ring-ring/50 flex h-9 w-full items-center justify-between gap-3 rounded-md border bg-transparent px-3 py-2 text-left text-sm shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px]",
          disabled && "cursor-not-allowed opacity-50",
        )}
      >
        <span className={cn("line-clamp-1", value.length === 0 && "text-muted-foreground")}>{summary}</span>
        <span className="flex items-center gap-2 text-muted-foreground">
          {value.length > 0 ? <span className="text-xs font-semibold">{value.length}</span> : null}
          <ChevronDown className={cn("size-4 transition-transform", isOpen && "rotate-180")} />
        </span>
      </button>

      {isOpen ? (
        <div className="absolute z-50 mt-2 max-h-72 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white p-2 shadow-[0_18px_40px_rgba(15,23,42,0.12)]">
          <div className="space-y-1">
            {options.map((option) => {
              const checked = value.includes(option.value)

              return (
                <label
                  key={option.value}
                  className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm transition hover:bg-slate-50"
                >
                  <Checkbox
                    checked={checked}
                    onCheckedChange={() => onChange(toggleMultiSelectValue(value, option.value))}
                  />
                  <span className="flex-1 text-slate-700">{option.label}</span>
                  {checked ? <Check className="size-4 text-primary" /> : null}
                </label>
              )
            })}
          </div>
        </div>
      ) : null}
    </div>
  )
}
