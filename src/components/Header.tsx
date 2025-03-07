
import React from 'react';
import { cn } from '@/lib/utils';

interface HeaderProps {
  className?: string;
}

const Header: React.FC<HeaderProps> = ({ className }) => {
  return (
    <header className={cn("w-full py-6 px-4 sm:px-8 flex justify-center items-center animate-fade-in", className)}>
      <div className="flex flex-col items-center space-y-2">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <svg 
              viewBox="0 0 24 24" 
              fill="none" 
              className="w-6 h-6 text-primary"
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
              <polyline points="14 2 14 8 20 8" />
              <path d="M10 18v-7" />
              <path d="M14 15l-4 3-4-3" />
            </svg>
          </div>
          <h1 className="text-2xl font-medium tracking-tight">ChatPDF</h1>
        </div>
        <p className="text-sm text-muted-foreground max-w-md text-center">
          Convert Claude AI conversations to beautiful PDFs with a single click
        </p>
      </div>
    </header>
  );
};

export default Header;
