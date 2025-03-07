
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

/**
 * Fetches the content from a Claude share URL
 * 
 * @param shareId The Claude share ID
 * @returns Promise with the HTML content
 */
export const fetchClaudeContent = async (shareId: string): Promise<string> => {
  try {
    const url = `https://claude.ai/share/${shareId}`;
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
 * Converts the Claude share content to a PDF
 * 
 * @param shareId The Claude share ID
 * @returns Promise that resolves when the PDF is downloaded
 */
export const convertClaudeToPdf = async (url: string): Promise<void> => {
  try {
    const shareId = url.split('/share/')[1];
    const htmlContent = await fetchClaudeContent(shareId);
    
    // Create a temporary iframe to hold the content
    const iframe = await createTemporaryIframe(htmlContent);
    
    // Find the conversation container in the iframe
    const conversationContainer = iframe.contentWindow?.document.querySelector('.conversation-container');
    
    if (!conversationContainer) {
      throw new Error('Could not find conversation content in the Claude share');
    }
    
    // Use html2canvas to capture the conversation
    const canvas = await html2canvas(conversationContainer as HTMLElement, {
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
 * (This is a placeholder since we can't directly access Claude content in this demo)
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
