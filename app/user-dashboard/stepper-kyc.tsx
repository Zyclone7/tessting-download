import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

interface Step {
  description: string;
}

interface StepperProps {
  steps: Step[];
}

export function Stepper({ steps }: StepperProps) {
  const [currentStep, setCurrentStep] = useState(1);

  const handleStepClick = (step: number) => {
    setCurrentStep(step);
  };

  const calculateProgress = () => {
    const totalSteps = steps.length;
    return Math.round((currentStep / totalSteps) * 100); // overall progress
  };

  return (
    <div className="flex flex-col sm:flex-row items-center justify-center p-4 border-2 border-[#3D89D6] rounded-lg w-full max-w-4xl mx-auto">
      {steps.map((step, index) => (
        <div
          key={index}
          className="flex flex-col items-center w-full sm:w-auto mb-6 sm:mb-0"
        >
          <div className="flex items-center w-full sm:w-auto">
            <div
              className={cn(
                "flex cursor-pointer",
                index < currentStep && "active"
              )}
              onClick={() => handleStepClick(index + 1)}
            >
              <div
                className={cn(
                  "relative w-10 h-10 flex items-center justify-center rounded-full border-2 border-[#3D89D6] bg-transparent transition-colors duration-500",
                  index < currentStep && "bg-[#3D89D6] border-[#3D89D6]"
                )}
              >
                {index < currentStep ? (
                  <Check className="text-white" size={20} />
                ) : (
                  <span className="text-gray-500 font-semibold">
                    {index + 1}
                  </span>
                )}
              </div>
            </div>
            {index < steps.length - 1 && (
              <div
                className="hidden sm:flex flex-grow h-0.5 bg-gray-300 transition-all duration-500 mx-2 w-16 sm:w-24 lg:w-32 rounded-lg"
                style={{
                  backgroundColor:
                    index < currentStep - 1 ? "#3D89D6" : "#D1D5DB",
                }}
              />
            )}
          </div>
          <div className="text-center mt-2">
            <div className="text-xs text-gray-500 max-w-xs px-2 sm:px-0">
              {step.description}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
