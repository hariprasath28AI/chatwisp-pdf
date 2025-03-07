
/**
 * Validates if the provided URL is a valid Claude share URL
 * 
 * @param url The URL to validate
 * @returns True if the URL is valid, false otherwise
 */
export const validateClaudeURL = (url: string): boolean => {
  if (!url) return false;
  
  try {
    const urlObj = new URL(url);
    
    // Check if it's a claude.ai URL
    if (!urlObj.hostname.includes('claude.ai')) {
      return false;
    }
    
    // Check if it's a share URL
    if (!urlObj.pathname.startsWith('/share/')) {
      return false;
    }
    
    // Check if it has a valid share ID (UUID-like format)
    const shareId = urlObj.pathname.split('/share/')[1];
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    
    if (!shareId || !uuidRegex.test(shareId)) {
      return false;
    }
    
    return true;
  } catch (error) {
    return false;
  }
};

/**
 * Extracts the share ID from a Claude share URL
 * 
 * @param url The Claude share URL
 * @returns The extracted share ID or null if invalid
 */
export const extractShareId = (url: string): string | null => {
  if (!validateClaudeURL(url)) {
    return null;
  }
  
  try {
    const urlObj = new URL(url);
    return urlObj.pathname.split('/share/')[1];
  } catch (error) {
    return null;
  }
};
