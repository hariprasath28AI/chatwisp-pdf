// Modified src/utils/pdfUtils.ts

import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { extractShareId } from './validation';

/**
 * Fetches the content from a Claude share URL
 * 
 * @param shareId The Claude share ID
 * @returns Promise with the HTML content
 */
export const fetchClaudeContent = async (shareId: string): Promise<string> => {
  try {
    // Try multiple CORS proxies in case one fails
    const corsProxies = [
      'https://corsproxy.io/?',
      'https://cors-anywhere.herokuapp.com/',
      'https://api.allorigins.win/raw?url='
    ];
    
    let html = '';
    let success = false;
    
    // Try each proxy until one succeeds
    for (const proxy of corsProxies) {
      try {
        const url = `${proxy}https://claude.ai/share/${shareId}`;
        const response = await fetch(url);
        
        if (response.ok) {
          html = await response.text();
          success = true;
          break;
        }
      } catch (e) {
        console.warn(`Proxy ${proxy} failed:`, e);
        // Continue to next proxy
      }
    }
    
    if (!success) {
      // If all proxies failed, try direct fetch as fallback (might work in some environments)
      const directUrl = `https://claude.ai/share/${shareId}`;
      const response = await fetch(directUrl, {
        headers: {
          'Accept': 'text/html',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch content: ${response.status} ${response.statusText}`);
      }
      
      html = await response.text();
    }
    
    return html;
  } catch (error) {
    console.error('Error fetching Claude content:', error);
    throw new Error('Failed to fetch Claude conversation. Please make sure the share link is public and valid.');
  }
};

/**
 * Creates a temporary iframe to load the content for conversion
 * 
 * @param htmlContent The HTML content to load
 * @returns Promise with the iframe element
 */
export const createTemporaryIframe = (htmlContent: string): Promise<HTMLIFrameElement> => {
  return new Promise((resolve, reject) => {
    try {
      const iframe = document.createElement('iframe');
      iframe.style.position = 'absolute';
      iframe.style.top = '-9999px';
      iframe.style.width = '1000px';
      iframe.style.height = '5000px';
      
      document.body.appendChild(iframe);
      
      // Set a timeout in case iframe loading hangs
      const timeoutId = setTimeout(() => {
        reject(new Error('Iframe loading timed out'));
        document.body.removeChild(iframe);
      }, 10000);
      
      iframe.onload = () => {
        clearTimeout(timeoutId);
        resolve(iframe);
      };
      
      if (iframe.contentWindow) {
        iframe.contentWindow.document.open();
        iframe.contentWindow.document.write(htmlContent);
        iframe.contentWindow.document.close();
      } else {
        reject(new Error('Could not access iframe content window'));
      }
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Processes the HTML to extract just the conversation content
 * 
 * @param html The full HTML from Claude share
 * @returns Processed HTML with just the conversation
 */
export const processHtml = (html: string): string => {
  // Extract just the conversation part from the HTML
  // This is a more reliable approach than using the iframe DOM
  const conversationMatch = html.match(/<main[^>]*>([\s\S]*?)<\/main>/i);
  
  if (conversationMatch && conversationMatch[1]) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { 
            font-family: Arial, sans-serif; 
            margin: 20px;
            background: white;
            color: black;
            padding: 20px;
          }
          .message { 
            margin-bottom: 20px; 
            padding: 15px; 
            border-radius: 8px;
          }
          .human-message, div[data-message-author-role="user"] {
            background-color: #f0f0f0;
            margin: 15px 0;
            border-left: 4px solid #888;
          }
          .ai-message, div[data-message-author-role="assistant"] {
            background-color: #e6f7ff;
            margin: 15px 0;
            border-left: 4px solid #0066cc;
          }
          .message-header {
            font-weight: bold;
            margin-bottom: 10px;
          }
          img, svg {
            max-width: 100%;
          }
          pre {
            background-color: #f5f5f5;
            padding: 10px;
            border-radius: 4px;
            overflow-x: auto;
            font-size: 14px;
          }
          code {
            font-family: monospace;
          }
          h1, h2, h3 {
            color: #333;
          }
        </style>
      </head>
      <body>
        <div class="conversation-container">
          ${conversationMatch[1]}
        </div>
      </body>
      </html>
    `;
  }
  
  // Fallback: return full HTML with added styles
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { 
          font-family: Arial, sans-serif; 
          margin: 20px;
          background: white;
          color: black;
        }
        div[data-message-author-role="user"] {
          background-color: #f0f0f0;
          padding: 15px;
          margin: 15px 0;
          border-left: 4px solid #888;
        }
        div[data-message-author-role="assistant"] {
          background-color: #e6f7ff;
          padding: 15px;
          margin: 15px 0;
          border-left: 4px solid #0066cc;
        }
      </style>
    </head>
    <body>
      ${html}
    </body>
    </html>
  `;
};

/**
 * Converts the Claude share content to a PDF
 * 
 * @param url The Claude share URL
 * @returns Promise that resolves when the PDF is downloaded
 */
export const convertClaudeToPdf = async (url: string): Promise<void> => {
  try {
    const shareId = extractShareId(url);
    
    if (!shareId) {
      throw new Error('Invalid Claude share URL');
    }
    
    // Fetch the HTML content
    const htmlContent = await fetchClaudeContent(shareId);
    
    // Process the HTML to get clean conversation
    const processedHtml = processHtml(htmlContent);
    
    // Create a temporary iframe to hold the content
    const iframe = await createTemporaryIframe(processedHtml);
    
    // Give the browser a moment to render everything
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Get the document body or conversation container
    const element = iframe.contentWindow?.document.body || 
                    iframe.contentWindow?.document.querySelector('.conversation-container');
    
    if (!element) {
      throw new Error('Could not find content to convert');
    }
    
    // Use html2canvas with more reliable settings
    const canvas = await html2canvas(element, {
      scale: 1.5,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
      windowWidth: 1000,
      onclone: (doc) => {
        // Additional styling can be applied to the cloned document
        const style = doc.createElement('style');
        style.innerHTML = `
          body { font-size: 14px; line-height: 1.5; }
          pre { white-space: pre-wrap; }
        `;
        doc.head.appendChild(style);
      }
    });
    
    // Create PDF with proper dimensions
    const imgWidth = 210; // A4 width in mm
    const pageHeight = 297; // A4 height in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    const pdf = new jsPDF({
      orientation: imgHeight > pageHeight ? 'portrait' : 'portrait',
      unit: 'mm',
      format: 'a4',
    });
    
    // Handle multi-page PDFs more effectively
    let heightLeft = imgHeight;
    let position = 0;
    let pageCount = 0;
    
    // First page
    pdf.addImage(canvas.toDataURL('image/jpeg', 0.95), 'JPEG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;
    pageCount++;
    
    // Add more pages if needed
    while (heightLeft > 0) {
      position = -pageHeight * pageCount;
      pdf.addPage();
      pdf.addImage(canvas.toDataURL('image/jpeg', 0.95), 'JPEG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
      pageCount++;
    }
    
    // Save the PDF
    pdf.save(`claude-conversation-${shareId}.pdf`);
    
    // Clean up
    document.body.removeChild(iframe);
    
  } catch (error) {
    console.error('Error converting to PDF:', error);
    
    // Fallback to simpler PDF generation if the advanced method fails
    try {
      await fallbackPdfGeneration(url);
    } catch (fallbackError) {
      console.error('Fallback PDF generation also failed:', fallbackError);
      throw new Error('Failed to generate PDF. Please try again or use browser print function.');
    }
  }
};

/**
 * Fallback method for PDF generation with simpler approach
 */
const fallbackPdfGeneration = async (url: string): Promise<void> => {
  const shareId = extractShareId(url);
  
  if (!shareId) {
    throw new Error('Invalid Claude share URL');
  }
  
  // Create a basic PDF with error message and instructions
  const pdf = new jsPDF();
  
  pdf.setFontSize(16);
  pdf.text('Claude Conversation', 105, 20, { align: 'center' });
  
  pdf.setFontSize(12);
  pdf.text(`Share URL: https://claude.ai/share/${shareId}`, 20, 40);
  
  pdf.setFontSize(12);
  pdf.text('The automatic PDF generation encountered technical difficulties.', 20, 60);
  pdf.text('To save this conversation as PDF, please try one of these alternatives:', 20, 70);
  pdf.text('1. Open the share URL in your browser and use the browser\'s print function', 20, 85);
  pdf.text('   (Select "Save as PDF" as the printer)', 20, 95);
  pdf.text('2. Try again later when the service might be more stable', 20, 110);
  pdf.text('3. Take screenshots of the conversation', 20, 125);
  
  // Save the fallback PDF
  pdf.save(`claude-conversation-${shareId}.pdf`);
};

/**
 * Simulates the actual PDF conversion 
 * (This function is kept for fallback purposes)
 * 
 * @param url The Claude share URL
 * @returns Promise that resolves when the simulation is complete
 */
export const simulateConversion = async (url: string): Promise<void> => {
  try {
    // Call the actual conversion instead of simulating
    await convertClaudeToPdf(url);
  } catch (error) {
    console.error('Conversion failed, using simulation instead:', error);
    
    // If actual conversion fails, create a simple PDF
    const shareId = extractShareId(url) || 'demo';
    const pdf = new jsPDF();
    
    pdf.setFontSize(22);
    pdf.text('Claude Conversation PDF', 105, 20, { align: 'center' });
    
    pdf.setFontSize(14);
    pdf.text(`From URL: ${url}`, 20, 40);
    
    pdf.setFontSize(12);
    pdf.text('PDF conversion encountered an error.', 20, 60);
    pdf.text('Please try opening the share URL directly and using your browser\'s', 20, 70);
    pdf.text('print function to save as PDF.', 20, 80);
    
    pdf.save(`claude-conversation-${shareId}.pdf`);
  }
};
