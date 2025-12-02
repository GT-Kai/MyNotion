import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PageDetail } from './pages/PageDetail';
import { AppLayout } from './components/Layout/AppLayout';

const queryClient = new QueryClient();

function App() {
  const [selectedPageId, setSelectedPageId] = useState<string | null>(null);

  return (
    <QueryClientProvider client={queryClient}>
      <AppLayout 
        selectedPageId={selectedPageId} 
        onSelectPage={setSelectedPageId}
      >
        {selectedPageId ? (
          <PageDetail 
            pageId={selectedPageId} 
            onBack={() => setSelectedPageId(null)} 
          />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400">
            Select a page or create a new one
          </div>
        )}
      </AppLayout>
    </QueryClientProvider>
  );
}

export default App;
