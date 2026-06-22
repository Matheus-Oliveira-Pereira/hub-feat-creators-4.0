import { ProgressSpinner } from 'primereact/progressspinner';
import { CSSProperties } from 'react';

interface LoadingSpinnerProps {
  style?: CSSProperties;
  strokeWidth?: string;
  fill?: string;
  animationDuration?: string;
}

function LoadingSpinner({ style, strokeWidth = '4', fill = 'var(--surface-ground)', animationDuration = '.5s' }: LoadingSpinnerProps) {
  return (
    <div className="flex justify-content-center align-items-center" style={{ minHeight: '200px', ...style }}>
      <ProgressSpinner strokeWidth={strokeWidth} fill={fill} animationDuration={animationDuration} />
    </div>
  );
}

export default LoadingSpinner;
