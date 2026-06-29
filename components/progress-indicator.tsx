interface ProgressIndicatorProps {
  currentStep: number
  totalSteps: number
  onStepClick?: (stepNumber: number) => void
  steps?: Array<{
    number: number
    label: string
  }>
  visitedSteps?: number[]
}

const defaultSteps = [
  { number: 1, label: "Dados Pessoais" },
  { number: 2, label: "Dados Profissionais" },
  { number: 3, label: "Dados Profissionais" },
  { number: 4, label: "Interesses Profissionais" },
]

export function ProgressIndicator({
  currentStep,
  totalSteps,
  onStepClick,
  steps = defaultSteps,
  visitedSteps,
}: ProgressIndicatorProps) {
  const visibleSteps = steps.slice(0, totalSteps)
  const visited = new Set(visitedSteps ?? [currentStep])
  const gridColumnCount = Math.max(visibleSteps.length * 2 - 1, 1)

  return (
    <div className="w-full">
      <div
        className="mb-2 grid items-start gap-x-6"
        style={{ gridTemplateColumns: `repeat(${gridColumnCount}, minmax(0, 1fr))` }}
      >
        {visibleSteps.map((step, index) => (
          <div key={step.number} className="contents">
            <div className="flex min-w-0 flex-col items-center text-center">
              <button
                type="button"
                onClick={() => onStepClick?.(step.number)}
                disabled={!visited.has(step.number)}
                aria-current={currentStep === step.number ? "step" : undefined}
                className={`flex h-10 w-10 items-center justify-center rounded-full font-semibold transition-colors ${
                  currentStep >= step.number ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                } ${visited.has(step.number) ? "cursor-pointer" : "cursor-not-allowed opacity-60"}`}
              >
                {step.number}
              </button>
              <span className="mt-2 hidden max-w-24 text-center text-xs leading-5 text-muted-foreground md:block">
                {step.label}
              </span>
            </div>

            {index < visibleSteps.length - 1 ? (
              <div className="flex items-start pt-5">
                <div
                  className={`h-1 w-full rounded-full transition-colors ${
                    currentStep > step.number ? "bg-primary" : "bg-muted"
                  }`}
                />
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  )
}
