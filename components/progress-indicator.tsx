interface ProgressIndicatorProps {
  currentStep: number
  totalSteps: number
  steps?: Array<{
    number: number
    label: string
  }>
}

const defaultSteps = [
  { number: 1, label: "Dados Pessoais" },
  { number: 2, label: "Dados Profissionais" },
  { number: 3, label: "Dados Profissionais" },
  { number: 4, label: "Interesses Profissionais" },
]

export function ProgressIndicator({ currentStep, totalSteps, steps = defaultSteps }: ProgressIndicatorProps) {
  const visibleSteps = steps.slice(0, totalSteps)

  return (
    <div className="w-full">
      <div className="mb-2 flex items-center justify-between">
        {visibleSteps.map((step, index) => (
          <div key={step.number} className="flex flex-1 items-center">
            <div className="flex flex-1 flex-col items-center">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full font-semibold transition-colors ${
                  currentStep >= step.number ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                }`}
              >
                {step.number}
              </div>
              <span className="mt-2 hidden text-center text-xs text-muted-foreground md:block">{step.label}</span>
            </div>
            {index < visibleSteps.length - 1 ? (
              <div
                className={`mx-2 h-1 flex-1 transition-colors ${currentStep > step.number ? "bg-primary" : "bg-muted"}`}
              />
            ) : null}
          </div>
        ))}
      </div>
    </div>
  )
}
