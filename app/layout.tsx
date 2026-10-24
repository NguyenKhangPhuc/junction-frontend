import type { Metadata } from 'next';
import './globals.css';
import { NavigationBarServer } from './components/navigation/navigationbarserver';
import { QueryProvider } from './providers/QueryProvider';

export const metadata: Metadata = {
  title: 'Pohjola Post • Independent Nordic Dispatches',
  description: 'Authoritative regional analysis, cultural inquiry, and Nordic journalism.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-background font-body text-on-surface">
        <QueryProvider>
          <NavigationBarServer />
          <main className="flex-1 pb-20 md:pb-0">{children}</main>
        </QueryProvider>
      </body>
    </html>
  );
}
