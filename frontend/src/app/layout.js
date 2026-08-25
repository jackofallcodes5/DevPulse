import '../styles/globals.css';
import Providers from './providers';

export const metadata = {
  title: 'DevPulse — Developer Collaboration & API Monitoring Platform',
  description: 'Real-time developer collaboration, GitHub activity tracking, issue management, and automated API uptime monitoring.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#0a0a0f] text-gray-100 antialiased min-h-screen">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
