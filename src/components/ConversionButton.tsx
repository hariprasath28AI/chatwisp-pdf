
import React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface ConversionButtonProps {
  onClick: () => void;
  isLoading: boolean;
  disabled?: boolean;
  className?: string;
}

const ConversionButton: React.FC<ConversionButtonProps> = ({
  onClick,
  isLoading,
  disabled = false,
  className,
}) => {
  return (
    <Button
      onClick={onClick}
      disabled={disabled || isLoading}
      className={cn(
        "relative h-12 px-8 py-3 text-sm font-medium transition-all duration-300",
        "bg-primary hover:bg-primary/90 text-primary-foreground",
        "rounded-xl shadow-sm hover:shadow-md active:shadow-sm",
        "disabled:opacity-70 disabled:pointer-events-none",
        "overflow-hidden",
        className
      )}
    >
      <span className={cn(
        "flex items-center justify-center gap-2",
        isLoading ? "opacity-0" : "opacity-100",
        "transition-opacity duration-200"
      )}>
        <svg 
          className="w-5 h-5" 
          fill="none" 
          viewBox="0 0 24 24"
          stroke="currentColor" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round"
        >
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" x2="12" y1="15" y2="3" />
        </svg>
        Convert to PDF
      </span>
      
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center animate-fade-in">
          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
    </Button>
  );
};

export default ConversionButton;
