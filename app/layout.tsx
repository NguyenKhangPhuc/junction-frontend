import type { Metadata } from 'next';
import './globals.css';
import { NavigationBarServer } from './components/navigation/navigationbarserver';
import { QueryProvider } from './providers/QueryProvider';
import { DynamicModalProvider } from './context/DynamicModalContext';
import { DynamicPopupModal } from './components/modal/DynamicPopupModal';

export const metadata: Metadata = {
  title: 'Pohjola Post • Independent Nordic Dispatches',
  description: 'Authoritative regional analysis, cultural inquiry, and Nordic journalism.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full antialiased scroll-smooth">
      <body className="min-h-full flex flex-col bg-background font-body text-on-surface">
        <QueryProvider>
          <DynamicModalProvider>
            <NavigationBarServer />
            <main className="flex-1 pb-20 md:pb-0">{children}</main>
            <DynamicPopupModal />
          </DynamicModalProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
