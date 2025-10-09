interface ProgressIndicatorProps {
  currentStep: number
  totalSteps: number
}

export function ProgressIndicator({ currentStep, totalSteps }: ProgressIndicatorProps) {
  const steps = [
    { number: 1, label: "Dados Pessoais" },
    { number: 2, label: "Dados Profissionais" },
    { number: 3, label: "Interesses Profissionais" },
  ]

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-2">
        {steps.map((step, index) => (
          <div key={step.number} className="flex items-center flex-1">
            <div className="flex flex-col items-center flex-1">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-colors ${
                  currentStep >= step.number ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                }`}
              >
                {step.number}
              </div>
              <span className="text-xs mt-2 text-center hidden md:block text-muted-foreground">{step.label}</span>
            </div>
            {index < steps.length - 1 && (
              <div
                className={`h-1 flex-1 mx-2 transition-colors ${currentStep > step.number ? "bg-primary" : "bg-muted"}`}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
