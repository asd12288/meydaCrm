'use client';

import { useState, useEffect } from 'react';
import { IconCheck, IconX, IconLoader2, IconFile, IconClipboardCheck, IconUpload, IconClock, IconBolt } from '@tabler/icons-react';
import type { ImportProgress as ImportProgressType } from '../types';

interface ImportProgressProps {
  progress: ImportProgressType;
  showDetails?: boolean;
}

export function ImportProgressBar({ progress, showDetails = false }: ImportProgressProps) {
  const { phase, totalRows, processedRows } = progress;
  const [startTime] = useState(Date.now());
  const [speed, setSpeed] = useState(0);
  const [eta, setETA] = useState(0);

  useEffect(() => {
    if (processedRows > 0 && totalRows > processedRows) {
      const elapsedSeconds = (Date.now() - startTime) / 1000;
      const currentSpeed = processedRows / elapsedSeconds;
      const remainingRows = totalRows - processedRows;
      const estimatedSeconds = currentSpeed > 0 ? remainingRows / currentSpeed : 0;

      setSpeed(Math.round(currentSpeed));
      setETA(Math.round(estimatedSeconds));
    }
  }, [processedRows, totalRows, startTime]);

  const percentage =
    totalRows > 0 ? Math.round((processedRows / totalRows) * 100) : 0;

  const getProgressColor = (): string => {
    switch (phase) {
      case 'completed':
        return 'bg-success';
      case 'failed':
        return 'bg-error';
      default:
        return 'bg-primary';
    }
  };

  const formatETA = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  return (
    <div className="w-full max-w-md mx-auto space-y-3">
      {/* Progress bar */}
      <div className="h-3 bg-border rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-500 ease-out rounded-full ${getProgressColor()}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      
      <div className="flex items-center justify-between text-sm">
        <div className="text-center flex-1">
          <p className="text-2xl font-semibold text-ld">{percentage}%</p>
        </div>
        
        {showDetails && speed > 0 && (
          <>
            <div className="text-center flex-1">
              <div className="flex items-center justify-center gap-1 text-primary">
                <IconBolt className="w-4 h-4" />
                <p className="font-medium">{speed}</p>
              </div>
              <p className="text-xs text-darklink">lignes/sec</p>
            </div>
            
            <div className="text-center flex-1">
              <div className="flex items-center justify-center gap-1 text-primary">
                <IconClock className="w-4 h-4" />
                <p className="font-medium">{formatETA(eta)}</p>
              </div>
              <p className="text-xs text-darklink">restant</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// =============================================================================
// WIZARD STEPS PROGRESS - Improved Design
// =============================================================================

interface WizardStepsProps {
  steps: Array<{ id: string; label: string }>;
  currentStep: number;
  onStepClick?: (stepIndex: number) => void;
}

const STEP_ICONS = [IconFile, IconClipboardCheck, IconUpload];

export function WizardSteps({ steps, currentStep, onStepClick }: WizardStepsProps) {
  return (
    <div className="w-full">
      {/* Steps container */}
      <div className="flex items-center justify-between relative">
        {/* Background line */}
        <div className="absolute top-5 left-0 right-0 h-0.5 bg-border" />

        {/* Active line overlay */}
        <div
          className="absolute top-5 left-0 h-0.5 bg-primary transition-all duration-300"
          style={{
            width: currentStep === 0 ? '0%' : currentStep === 1 ? '50%' : '100%'
          }}
        />

        {steps.map((step, index) => {
          const isComplete = index < currentStep;
          const isCurrent = index === currentStep;
          const isClickable = isComplete && onStepClick;
          const StepIcon = STEP_ICONS[index] || IconCheck;

          return (
            <button
              key={step.id}
              type="button"
              onClick={() => isClickable && onStepClick(index)}
              disabled={!isClickable}
              className={`
                relative z-10 flex flex-col items-center
                ${isClickable ? 'cursor-pointer' : 'cursor-default'}
              `}
            >
              {/* Circle with icon */}
              <div
                className={`
                  w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300
                  ${isComplete
                    ? 'bg-primary text-white shadow-md'
                    : isCurrent
                      ? 'bg-primary text-white shadow-lg ring-4 ring-primary/20'
                      : 'bg-white dark:bg-dark text-darklink border-2 border-border'
                  }
                  ${isClickable ? 'hover:scale-110' : ''}
                `}
              >
                {isComplete ? (
                  <IconCheck className="w-5 h-5" strokeWidth={2.5} />
                ) : (
                  <StepIcon className="w-5 h-5" />
                )}
              </div>

              {/* Label */}
              <span
                className={`
                  mt-2 text-sm font-medium whitespace-nowrap
                  ${isCurrent || isComplete ? 'text-ld' : 'text-darklink'}
                `}
              >
                {step.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
