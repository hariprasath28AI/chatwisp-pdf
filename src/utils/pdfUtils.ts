
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
    // We need to use a CORS proxy since Claude.ai doesn't allow direct fetching
    // In production, you should set up your own proxy server
    const corsProxy = 'https://corsproxy.io/?';
    const url = `${corsProxy}https://claude.ai/share/${shareId}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch content: ${response.status} ${response.statusText}`);
    }
    
    const html = await response.text();
    return html;
  } catch (error) {
    console.error('Error fetching Claude content:', error);
    throw error;
  }
};

/**
 * Creates a temporary iframe to load the content for conversion
 * 
 * @param htmlContent The HTML content to load
 * @returns Promise with the iframe element
 */
export const createTemporaryIframe = (htmlContent: string): Promise<HTMLIFrameElement> => {
  return new Promise((resolve) => {
    const iframe = document.createElement('iframe');
    iframe.style.position = 'absolute';
    iframe.style.top = '-9999px';
    iframe.style.width = '1000px';
    iframe.style.height = '5000px'; // Make it tall enough for most conversations
    
    document.body.appendChild(iframe);
    
    iframe.onload = () => {
      resolve(iframe);
    };
    
    // Write the HTML content to the iframe
    if (iframe.contentWindow) {
      iframe.contentWindow.document.open();
      iframe.contentWindow.document.write(htmlContent);
      iframe.contentWindow.document.close();
    }
  });
};

/**
 * Extracts the conversational content from the Claude share HTML
 * 
 * @param iframe The iframe containing the Claude share content
 * @returns The HTML element containing the conversation or null if not found
 */
export const extractConversationContent = (iframe: HTMLIFrameElement): HTMLElement | null => {
  if (!iframe.contentWindow || !iframe.contentWindow.document) {
    return null;
  }
  
  const doc = iframe.contentWindow.document;
  
  // Try various selectors that might contain the conversation
  const selectors = [
    '.conversation-container',
    '.message-container',
    '.chat-container',
    'main',
    '#__next > div',
    'body'
  ];
  
  for (const selector of selectors) {
    const element = doc.querySelector(selector);
    if (element) {
      return element as HTMLElement;
    }
  }
  
  // If we can't find any specific container, return the body
  return doc.body;
};

/**
 * Enhances the conversation HTML with proper styling
 * 
 * @param element The HTML element containing the conversation
 */
export const enhanceConversationStyle = (element: HTMLElement): void => {
  // Add basic styles to make the conversation readable in PDF
  const style = document.createElement('style');
  style.textContent = `
    body { 
      font-family: Arial, sans-serif; 
      margin: 20px;
      background: white;
      color: black;
    }
    .message { 
      margin-bottom: 20px; 
      padding: 10px; 
      border-radius: 8px;
    }
    .human-message {
      background-color: #f0f0f0;
    }
    .ai-message {
      background-color: #e6f7ff;
    }
    .message-header {
      font-weight: bold;
      margin-bottom: 5px;
    }
    img, svg {
      max-width: 100%;
    }
    pre {
      background-color: #f5f5f5;
      padding: 10px;
      border-radius: 4px;
      overflow-x: auto;
    }
    code {
      font-family: monospace;
    }
  `;
  
  if (element.ownerDocument && element.ownerDocument.head) {
    element.ownerDocument.head.appendChild(style);
  }
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
    
    // Create a temporary iframe to hold the content
    const iframe = await createTemporaryIframe(htmlContent);
    
    // Find the conversation container in the iframe
    const conversationContent = extractConversationContent(iframe);
    
    if (!conversationContent) {
      throw new Error('Could not find conversation content in the Claude share');
    }
    
    // Enhance the styling for better PDF output
    enhanceConversationStyle(conversationContent);
    
    // Give the browser a moment to apply styles
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Use html2canvas to capture the conversation
    const canvas = await html2canvas(conversationContent, {
      scale: 2, // Higher quality
      useCORS: true,
      logging: false,
      allowTaint: true,
      windowWidth: 1200,
      windowHeight: 5000
    });
    
    // Create PDF from canvas
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });
    
    // Calculate dimensions to fit the image properly
    const imgWidth = 210; // A4 width in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    
    pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
    
    // If the conversation is very long, add multiple pages
    if (imgHeight > 297) { // A4 height in mm
      let remainingHeight = imgHeight;
      let position = 0;
      const pageHeight = 297;
      
      // Remove first page that was automatically added
      pdf.deletePage(1);
      
      // Add new pages as needed
      while (remainingHeight > 0) {
        position -= pageHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        remainingHeight -= pageHeight;
      }
    }
    
    // Save the PDF
    pdf.save(`claude-conversation-${shareId}.pdf`);
    
    // Clean up
    document.body.removeChild(iframe);
    
  } catch (error) {
    console.error('Error converting to PDF:', error);
    throw error;
  }
};

/**
 * Simulates the actual PDF conversion 
 * (This function is kept for fallback purposes)
 * 
 * @param url The Claude share URL
 * @returns Promise that resolves when the simulation is complete
 */
export const simulateConversion = async (url: string): Promise<void> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 2500));
  
  // In a real implementation, we would call convertClaudeToPdf(url)
  console.log('Would convert URL to PDF:', url);
  
  // For demo purposes, create a sample PDF
  const pdf = new jsPDF();
  
  pdf.setFontSize(22);
  pdf.text('Claude Conversation PDF', 105, 20, { align: 'center' });
  
  pdf.setFontSize(14);
  pdf.text(`From URL: ${url}`, 20, 40);
  
  pdf.setFontSize(12);
  pdf.text('This is a simulated PDF conversion.', 20, 60);
  pdf.text('In a real implementation, the actual Claude conversation', 20, 70);
  pdf.text('would be rendered into this PDF document.', 20, 80);
  
  // Save the PDF
  const shareId = url.split('/share/')[1] || 'demo';
  pdf.save(`claude-conversation-${shareId}.pdf`);
};
