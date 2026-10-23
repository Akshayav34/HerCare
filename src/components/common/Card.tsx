import React from 'react';
import { cn } from '../../lib/utils';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverEffect?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  className,
  hoverEffect = false,
  ...props
}) => {
  return (
    <div
      className={cn(
        'bg-white rounded-2xl border border-slate-100 shadow-soft p-5 transition-all duration-200',
        hoverEffect && 'hover:shadow-card hover:-translate-y-0.5 hover:border-teal-100',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};
