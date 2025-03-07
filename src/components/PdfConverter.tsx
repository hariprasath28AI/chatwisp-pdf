// Modified PdfConverter.tsx (I'm assuming this exists based on your imports)

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { validateClaudeURL } from '@/utils/validation';
import { convertClaudeToPdf } from '@/utils/pdfUtils';
import { useToast } from '@/hooks/use-toast';

const PdfConverter = () => {
  const [url, setUrl] = useState('');
  const [isConverting, setIsConverting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleConvert = async () => {
    setError(null);
    
    // Validate URL
    if (!validateClaudeURL(url)) {
      setError('Please enter a valid Claude.ai share URL (e.g., https://claude.ai/share/uuid-format)');
      return;
    }
    
    setIsConverting(true);
    
    try {
      // Show toast for starting conversion
      toast({
        title: "Starting conversion",
        description: "Processing your Claude conversation...",
      });
      
      // Attempt to convert the URL to PDF
      await convertClaudeToPdf(url);
      
      // Show success toast
      toast({
        title: "Conversion complete",
        description: "Your PDF has been downloaded.",
        variant: "default",
      });
    } catch (error) {
      console.error('Conversion error:', error);
      
      // Show error toast
      toast({
        title: "Conversion failed",
        description: error instanceof Error ? error.message : "Failed to generate PDF. Please try again.",
        variant: "destructive",
      });
      
      setError(error instanceof Error ? error.message : "Failed to generate PDF. Please try again.");
    } finally {
      setIsConverting(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Claude Share to PDF Converter</CardTitle>
        <CardDescription>
          Convert a Claude.ai share link to a downloadable PDF
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="url">Claude Share URL</Label>
            <Input
              id="url"
              placeholder="https://claude.ai/share/..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              disabled={isConverting}
            />
            {error && <p className="text-sm text-red-500">{error}</p>}
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          onClick={handleConvert} 
          disabled={isConverting || !url} 
          className="w-full"
        >
          {isConverting ? 'Converting...' : 'Convert to PDF'}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default PdfConverter;
