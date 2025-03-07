
import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import URLInput from './URLInput';
import ConversionButton from './ConversionButton';
import { validateClaudeURL } from '@/utils/validation';
import { simulateConversion } from '@/utils/pdfUtils';
import { Card, CardContent } from '@/components/ui/card';

interface PdfConverterProps {
  className?: string;
}

const PdfConverter: React.FC<PdfConverterProps> = ({ className }) => {
  const [url, setUrl] = useState('');
  const [isConverting, setIsConverting] = useState(false);
  const [recentUrls, setRecentUrls] = useState<string[]>([]);
  
  const isValidUrl = validateClaudeURL(url);
  
  const handleConvert = async () => {
    if (!isValidUrl) {
      toast.error('Please enter a valid Claude share URL');
      return;
    }
    
    setIsConverting(true);
    
    try {
      // In a real implementation, we would use convertClaudeToPdf
      // Since we can't actually access Claude content in this demo,
      // we'll use a simulation function
      await simulateConversion(url);
      
      // Add to recent URLs (no duplicates)
      if (!recentUrls.includes(url)) {
        setRecentUrls(prev => [url, ...prev].slice(0, 5));
      }
      
      toast.success('PDF generated successfully!');
      
    } catch (error) {
      console.error('Conversion error:', error);
      toast.error('Failed to generate PDF. Please try again.');
    } finally {
      setIsConverting(false);
    }
  };
  
  return (
    <div className={cn("w-full max-w-xl mx-auto p-2", className)}>
      <Card className="overflow-hidden border-border bg-white dark:bg-black/20 shadow-soft backdrop-blur-sm">
        <CardContent className="p-6">
          <div className="space-y-6 animate-fade-in">
            <div className="space-y-3">
              <h2 className="text-xl font-medium">Convert Claude Conversation</h2>
              <p className="text-sm text-muted-foreground">
                Enter a Claude.ai share URL to convert the conversation to a downloadable PDF
              </p>
            </div>
            
            <div className="space-y-4">
              <URLInput 
                value={url}
                onChange={setUrl}
                disabled={isConverting}
              />
              
              <div className="flex justify-end">
                <ConversionButton 
                  onClick={handleConvert}
                  isLoading={isConverting}
                  disabled={!isValidUrl || isConverting}
                />
              </div>
            </div>
            
            {recentUrls.length > 0 && (
              <div className="pt-4 border-t border-border animate-fade-in">
                <h3 className="text-sm font-medium mb-3">Recent Conversions</h3>
                <div className="space-y-2">
                  {recentUrls.map((recentUrl, index) => (
                    <div 
                      key={index} 
                      className="text-xs bg-secondary rounded-md p-2 flex justify-between items-center animate-slide-up"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <span className="truncate max-w-[80%]">{recentUrl}</span>
                      <button
                        onClick={() => {
                          setUrl(recentUrl);
                        }}
                        className="text-primary hover:text-primary/80 transition-colors"
                      >
                        Use
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      
      <div className="mt-8 px-4 text-center">
        <p className="text-xs text-muted-foreground">
          This tool converts public Claude AI shared conversations to PDF format.
          <br />
          Make sure you have permission to download and use the content.
        </p>
      </div>
    </div>
  );
};

export default PdfConverter;
