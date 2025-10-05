import fs from 'fs';
import path from 'path';

interface ContactMessage {
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  timestamp: string;
}

export function logContactMessage(message: ContactMessage) {
  try {
    const logDir = path.join(process.cwd(), 'logs');
    const logFile = path.join(logDir, 'contact-messages.json');
    
    // Create logs directory if it doesn't exist
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
    
    // Read existing messages
    let messages: ContactMessage[] = [];
    if (fs.existsSync(logFile)) {
      try {
        const data = fs.readFileSync(logFile, 'utf8');
        messages = JSON.parse(data);
      } catch (error) {
        console.error('Error reading contact log file:', error);
        messages = [];
      }
    }
    
    // Add new message
    messages.push(message);
    
    // Write back to file
    fs.writeFileSync(logFile, JSON.stringify(messages, null, 2));
    
    console.log('Contact message logged to file:', message);
  } catch (error) {
    console.error('Error logging contact message:', error);
  }
}

export function getContactMessages(): ContactMessage[] {
  try {
    const logDir = path.join(process.cwd(), 'logs');
    const logFile = path.join(logDir, 'contact-messages.json');
    
    if (!fs.existsSync(logFile)) {
      return [];
    }
    
    const data = fs.readFileSync(logFile, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading contact messages:', error);
    return [];
  }
}
