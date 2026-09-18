import './globals.css';
import { AuthProvider } from '@/context/AuthContext';

export const metadata = {
  title: 'Interview Studio | AI Mock Interview Coach',
  description: 'Practice smarter with AI-powered interviews in a professional studio environment.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[#040608]">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
