import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

interface Step {
  label: string;
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
    <div className="flex flex-row sm:flex-row border p-4 rounded-lg items-center justify-center ">
      {/* Progress percentage display */}
      {/* <div className="text-xs font-medium text-teal-500 sm:mb-0 text-end w-full mb-40">
        {calculateProgress()}% Complete
      </div> */}
      {steps.map((step, index) => (
        <div key={index} className="flex flex-col w-full mb-8 sm:mb-0 ">
          <div className="flex items-center w-full">
            <div
              className={cn(
                "flex  cursor-pointer",
                index < currentStep && "active"
              )}
              onClick={() => handleStepClick(index + 1)}
            >
              <div
                className={cn(
                  "relative w-10 h-10 rounded-full border-2 border-gray-300 bg-transparent transition-colors duration-500 ease-in-out items-center justify-center flex-col flex",
                  index < currentStep && "bg-teal-500 border-teal-500"
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
                className={cn(
                  "flex-grow h-0.5 bg-gray-300 transition-colors duration-500 ease-in-out mx-2",
                  index < currentStep - 1 && "bg-teal-500"
                )}
              ></div>
            )}
          </div>
          {/* Center the description below the check */}
          <div className="text-start mt-2">
            <div className="text-xs text-gray-500">{step.description}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
