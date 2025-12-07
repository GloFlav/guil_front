import React from 'react';
import { CheckCircle, Loader, Circle } from 'lucide-react';

const AnalysisLoader = ({ steps }) => {
  const GREEN_COLOR = '#5DA781';

  // Vérifier si steps est un tableau valide
  if (!Array.isArray(steps) || steps.length === 0) {
    return null;
  }

  return (
    <div className="bg-white border border-gray-300 rounded-lg p-8 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Loader className="w-5 h-5 animate-spin" style={{ color: GREEN_COLOR }} />
          <h3 className="text-lg font-semibold text-gray-900">
            Analyse en cours...
          </h3>
        </div>
        <p className="text-sm text-gray-600">
          Veuillez patienter, nous traitons vos données
        </p>
      </div>

      {/* Steps Progress */}
      <div className="space-y-4">
        {/* All possible steps */}
        {[1, 2, 3, 4, 5, 6, 7].map((stepNumber) => {
          const currentStep = steps?.find((s) => s?.step === stepNumber);
          const isCompleted = currentStep !== undefined;
          const isActive = isCompleted && stepNumber === steps?.[steps.length - 1]?.step;

          return (
            <div key={stepNumber} className="flex items-center gap-4">
              {/* Step Icon */}
              <div className="flex-shrink-0">
                {isCompleted ? (
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: GREEN_COLOR }}
                  >
                    {isActive ? (
                      <Loader className="w-4 h-4 text-white animate-spin" />
                    ) : (
                      <CheckCircle className="w-5 h-5 text-white" />
                    )}
                  </div>
                ) : (
                  <Circle className="w-8 h-8 text-gray-300" />
                )}
              </div>

              {/* Step Text */}
              <div className="flex-1">
                {currentStep ? (
                  <p
                    className={`text-sm font-medium transition-colors ${
                      isCompleted ? 'text-gray-900' : 'text-gray-500'
                    }`}
                  >
                    {currentStep.message}
                  </p>
                ) : (
                  <p className="text-sm text-gray-400">
                    Étape {stepNumber}...
                  </p>
                )}
              </div>

              {/* Step Number Badge */}
              <div
                className="text-xs font-semibold px-2.5 py-0.5 rounded-full"
                style={{
                  backgroundColor: isCompleted ? '#f0f7f3' : '#f3f4f6',
                  color: isCompleted ? GREEN_COLOR : '#9ca3af',
                }}
              >
                {stepNumber}/7
              </div>
            </div>
          );
        })}
      </div>

      {/* Progress Bar */}
      <div className="pt-4 border-t border-gray-200">
        <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
          <div
            className="h-full transition-all duration-500 ease-out rounded-full"
            style={{
              width: `${(steps.length / 7) * 100}%`,
              backgroundColor: GREEN_COLOR,
            }}
          />
        </div>
        <p className="text-xs text-gray-600 text-center mt-2">
          {Math.round((steps.length / 7) * 100)}% complété
        </p>
      </div>
    </div>
  );
};

export default AnalysisLoader;