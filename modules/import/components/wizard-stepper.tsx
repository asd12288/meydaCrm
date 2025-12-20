'use client';

import { IconCheck, IconLoader2 } from '@tabler/icons-react';
import { IMPORT_WIZARD_STEPS, type ImportWizardStep } from '../config/constants';

interface WizardStepperProps {
  /** Current active step */
  currentStep: ImportWizardStep;
  /** Completed steps (used for validation) */
  completedSteps?: ImportWizardStep[];
  /** Whether the current step is processing */
  isProcessing?: boolean;
  /** Callback when a step is clicked (only for completed steps) */
  onStepClick?: (step: ImportWizardStep) => void;
  /** Compact mode for smaller screens */
  compact?: boolean;
}

/**
 * Visual stepper component for the import wizard
 * Shows progress through the 6 import steps
 */
export function WizardStepper({
  currentStep,
  completedSteps = [],
  isProcessing = false,
  onStepClick,
  compact = false,
}: WizardStepperProps) {
  const currentIndex = IMPORT_WIZARD_STEPS.findIndex((s) => s.id === currentStep);

  const getStepStatus = (stepId: ImportWizardStep, stepIndex: number) => {
    if (completedSteps.includes(stepId)) return 'completed';
    if (stepId === currentStep) return isProcessing ? 'processing' : 'current';
    if (stepIndex < currentIndex) return 'completed';
    return 'upcoming';
  };

  const isClickable = (stepId: ImportWizardStep) => {
    return completedSteps.includes(stepId) && onStepClick;
  };

  if (compact) {
    return (
      <div className="flex items-center justify-between gap-2 mb-6">
        {IMPORT_WIZARD_STEPS.map((step, index) => {
          const status = getStepStatus(step.id, index);
          const clickable = isClickable(step.id);

          return (
            <div key={step.id} className="flex items-center gap-2">
              {/* Step indicator */}
              <button
                onClick={() => clickable && onStepClick?.(step.id)}
                disabled={!clickable}
                className={`
                  w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                  transition-all duration-200
                  ${status === 'completed' ? 'bg-primary text-white' : ''}
                  ${status === 'current' ? 'bg-primary text-white ring-2 ring-primary/30' : ''}
                  ${status === 'processing' ? 'bg-primary text-white animate-pulse' : ''}
                  ${status === 'upcoming' ? 'bg-surface border border-border text-darklink' : ''}
                  ${clickable ? 'cursor-pointer hover:ring-2 hover:ring-primary/30' : ''}
                `}
              >
                {status === 'completed' ? (
                  <IconCheck size={16} />
                ) : status === 'processing' ? (
                  <IconLoader2 size={16} className="animate-spin" />
                ) : (
                  step.number
                )}
              </button>

              {/* Connector line (except for last step) */}
              {index < IMPORT_WIZARD_STEPS.length - 1 && (
                <div
                  className={`
                    flex-1 h-0.5 min-w-[20px]
                    ${index < currentIndex ? 'bg-primary' : 'bg-border'}
                  `}
                />
              )}
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="mb-8">
      {/* Desktop stepper */}
      <div className="hidden md:flex items-center justify-between">
        {IMPORT_WIZARD_STEPS.map((step, index) => {
          const status = getStepStatus(step.id, index);
          const clickable = isClickable(step.id);

          return (
            <div key={step.id} className="flex items-center flex-1 last:flex-none">
              {/* Step */}
              <div className="flex flex-col items-center">
                <button
                  onClick={() => clickable && onStepClick?.(step.id)}
                  disabled={!clickable}
                  className={`
                    w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold
                    transition-all duration-200 mb-2
                    ${status === 'completed' ? 'bg-primary text-white' : ''}
                    ${status === 'current' ? 'bg-primary text-white ring-4 ring-primary/20' : ''}
                    ${status === 'processing' ? 'bg-primary text-white' : ''}
                    ${status === 'upcoming' ? 'bg-surface border-2 border-border text-darklink' : ''}
                    ${clickable ? 'cursor-pointer hover:ring-4 hover:ring-primary/20' : ''}
                  `}
                >
                  {status === 'completed' ? (
                    <IconCheck size={20} />
                  ) : status === 'processing' ? (
                    <IconLoader2 size={20} className="animate-spin" />
                  ) : (
                    step.number
                  )}
                </button>

                <span
                  className={`
                    text-sm font-medium text-center
                    ${status === 'current' || status === 'processing' ? 'text-primary' : ''}
                    ${status === 'completed' ? 'text-primary' : ''}
                    ${status === 'upcoming' ? 'text-darklink' : ''}
                  `}
                >
                  {step.label}
                </span>
              </div>

              {/* Connector line (except for last step) */}
              {index < IMPORT_WIZARD_STEPS.length - 1 && (
                <div
                  className={`
                    flex-1 h-0.5 mx-4 mt-[-24px]
                    ${index < currentIndex ? 'bg-primary' : 'bg-border'}
                  `}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Mobile stepper */}
      <div className="md:hidden">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-darklink">
            Etape {currentIndex + 1} sur {IMPORT_WIZARD_STEPS.length}
          </span>
          <span className="text-sm font-semibold text-primary">
            {IMPORT_WIZARD_STEPS[currentIndex]?.label}
          </span>
        </div>

        {/* Progress bar */}
        <div className="h-2 bg-surface rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${
              isProcessing ? 'bg-primary animate-pulse' : 'bg-primary'
            }`}
            style={{ width: `${((currentIndex + 1) / IMPORT_WIZARD_STEPS.length) * 100}%` }}
          />
        </div>

        {/* Description */}
        <p className="text-sm text-darklink mt-2">
          {IMPORT_WIZARD_STEPS[currentIndex]?.description}
        </p>
      </div>
    </div>
  );
}
