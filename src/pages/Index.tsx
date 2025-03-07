
import React from 'react';
import Header from '@/components/Header';
import PdfConverter from '@/components/PdfConverter';

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-secondary/60 to-background py-8 px-4">
      <div className="flex-1 max-w-4xl mx-auto w-full flex flex-col items-center justify-center gap-8">
        <Header />
        
        <main className="w-full animate-slide-up" style={{ animationDelay: '100ms' }}>
          <PdfConverter />
        </main>
        
        <footer className="mt-auto pt-6 w-full max-w-lg mx-auto text-center text-sm text-muted-foreground">
          <p>
            Claude ChatPDF Converter
          </p>
        </footer>
      </div>
    </div>
  );
};

export default Index;
