'use client';

import { usePathname } from 'next/navigation';
import CitizenChatbot from '@/components/CitizenChatbot';

export default function ChatbotWrapper() {
  const pathname = usePathname();
  
  // Don't show chatbot on auth pages (sign-in, sign-up, and sso-callback)
  const isAuthPage = pathname?.includes('/sign-in') || 
                     pathname?.includes('/sign-up') ||
                     pathname?.includes('/sso-callback');
  
  if (isAuthPage) {
    return null;
  }
  
  return <CitizenChatbot />;
}
