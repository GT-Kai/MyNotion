import { ReactNode } from 'react';
import { Sidebar } from './Sidebar';

interface AppLayoutProps {
  children: ReactNode;
  selectedPageId: string | null;
  onSelectPage: (id: string) => void;
}

export function AppLayout({ children, selectedPageId, onSelectPage }: AppLayoutProps) {
  return (
    <div className="flex h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-200">
      {/* Sidebar */}
      <aside className="w-64 flex-shrink-0 border-r border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 overflow-y-auto transition-colors duration-200">
        <Sidebar selectedPageId={selectedPageId} onSelectPage={onSelectPage} />
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-white dark:bg-gray-900 transition-colors duration-200">
        <div className="max-w-4xl mx-auto px-8 py-12 min-h-full">
            {children}
        </div>
      </main>
    </div>
  );
}
