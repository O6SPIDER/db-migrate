import React from 'react';
import { Database, ClipboardList, ArrowLeftRight, CheckCircle2, X, Check } from 'lucide-react';
import { MigrationStage } from '../../types/migration';

interface MigrationStepperProps {
  stage: MigrationStage;
}

type StepStatus = 'done' | 'active' | 'pending' | 'error';

const STEPS = [
  { key: 'setup', label: 'Setup', icon: Database },
  { key: 'review', label: 'Review', icon: ClipboardList },
  { key: 'migrate', label: 'Migrate', icon: ArrowLeftRight },
  { key: 'complete', label: 'Complete', icon: CheckCircle2 },
] as const;

const flatIndex = (stage: MigrationStage): number => {
  switch (stage) {
    case 'DRAFT':
      return 0;
    case 'REVIEW':
      return 1;
    case 'PREFLIGHT':
    case 'DUMPING':
    case 'RESTORING':
    case 'VERIFYING':
      return 2;
    case 'COMPLETED':
      return 3;
    case 'FAILED':
    case 'CANCELLED':
      return 2;
    default:
      return 0;
  }
};

const statusFor = (stage: MigrationStage, index: number): StepStatus => {
  const isErrored = stage === 'FAILED' || stage === 'CANCELLED';
  const current = flatIndex(stage);
  if (isErrored && index === 2) return 'error';
  if (current > index) return 'done';
  if (current === index) return 'active';
  return 'pending';
};

export const MigrationStepper: React.FC<MigrationStepperProps> = ({ stage }) => {
  const cancelled = stage === 'CANCELLED';

  return (
    <div className="flex items-center" aria-label="Migration progress">
      {STEPS.map((step, i) => {
        const status = statusFor(stage, i);
        const Icon = step.icon;
        const isLast = i === STEPS.length - 1;

        return (
          <React.Fragment key={step.key}>
            <div className="flex flex-col items-center gap-2">
              <div
                className={[
                  'w-8 h-8 rounded-full flex items-center justify-center border transition-colors duration-300',
                  status === 'done' && 'border-blue-500 text-blue-400 bg-transparent',
                  status === 'active' && 'border-blue-500 text-white bg-blue-600 shadow-[0_0_0_3px_rgba(59,130,246,0.25)]',
                  status === 'pending' && 'border-[#262626] text-gray-500 bg-transparent',
                  status === 'error' &&
                    (cancelled
                      ? 'border-amber-500 text-amber-400 bg-transparent'
                      : 'border-red-500 text-red-400 bg-transparent'),
                ]
                  .filter(Boolean)
                  .join(' ')}
              >
                {status === 'done' ? (
                  <Check className="w-4 h-4 text-blue-400" strokeWidth={2.5} />
                ) : status === 'error' ? (
                  <X className="w-4 h-4" strokeWidth={2.5} />
                ) : (
                  <Icon className="w-3.5 h-3.5" strokeWidth={2.25} />
                )}
              </div>
              <span
                className={[
                  'text-[11px] font-medium tracking-tight',
                  status === 'active' ? 'text-white' : status === 'error' ? (cancelled ? 'text-amber-400' : 'text-red-400') : 'text-gray-400',
                ].join(' ')}
              >
                {step.label}
              </span>
            </div>

            {!isLast && (
              <div
                className={[
                  'h-px flex-1 mx-2 mb-5 transition-colors duration-300',
                  flatIndex(stage) > i && stage !== 'FAILED' && stage !== 'CANCELLED'
                    ? 'bg-blue-500'
                    : 'bg-[#262626]',
                ].join(' ')}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};
