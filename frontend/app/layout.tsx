import { AuthProvider } from '@/lib/contexts/AuthContext';
import { NotificationProvider } from '@/lib/contexts/NotificationContext';
import { Inter } from 'next/font/google';
import { Toaster } from 'react-hot-toast';
import { GoogleOAuthProvider } from '@react-oauth/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Hack Club Channel',
  description: 'Where amazing things get built - A secret club for Hackathon participants',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ''}>
          <AuthProvider>
            <NotificationProvider>
              {children}
              <Toaster
                position="top-right"
                toastOptions={{
                  duration: 3000,
                  style: {
                    background: '#1a1a1a',
                    color: '#e5e5e5',
                    border: '1px solid #2a2a2a',
                  },
                }}
              />
            </NotificationProvider>
          </AuthProvider>
        </GoogleOAuthProvider>
      </body>
    </html>
  );
}
