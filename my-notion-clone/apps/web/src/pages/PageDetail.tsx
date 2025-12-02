import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchPage, updatePage, fetchBacklinks } from '../api/pages';
import { BlockEditor } from '../components/BlockEditor';

interface PageDetailProps {
  pageId: string;
  onNavigateToPage: (pageId: string) => void;
}

export function PageDetail({ pageId, onNavigateToPage }: PageDetailProps) {
  const queryClient = useQueryClient();
  const { data, isLoading, error } = useQuery(['page', pageId], () => fetchPage(pageId));
  
  const { data: backlinks, isLoading: backlinksLoading } = useQuery(
    ['backlinks', pageId],
    () => fetchBacklinks(pageId),
    { enabled: !!pageId }
  );

  const [title, setTitle] = useState('');

  // Sync local title state with fetched data
  useEffect(() => {
    if (data?.page) {
      setTitle(data.page.title);
    }
  }, [data?.page]);

  const updateMutation = useMutation({
    mutationFn: (newTitle: string) => updatePage(pageId, { title: newTitle }),
    onSuccess: () => {
        queryClient.invalidateQueries(['pages']); // Refresh sidebar
    }
  });

  // Debounced save
  const [saveTimer, setSaveTimer] = useState<number | null>(null);

  const handleTitleChange = useCallback((newTitle: string) => {
    setTitle(newTitle);
    if (saveTimer) window.clearTimeout(saveTimer);
    
    const timer = window.setTimeout(() => {
        updateMutation.mutate(newTitle);
    }, 500);
    setSaveTimer(timer);
  }, [saveTimer, updateMutation]);

  if (isLoading) return <div className="p-8 text-gray-400">Loading page...</div>;
  if (error) return <div className="p-8 text-red-500">Error loading page</div>;
  if (!data) return <div className="p-8 text-gray-400">Page not found</div>;

  return (
    <div>
      {/* Header / Cover Area */}
      <div className="mb-8 group">
        <div className="mb-2 text-xs text-gray-400 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <span>Start adding an icon</span>
            <span>•</span>
            <span>Add cover</span>
        </div>
        
        <input
            className="w-full text-4xl font-bold outline-none bg-transparent placeholder-gray-300 dark:placeholder-gray-600 text-gray-900 dark:text-gray-100"
            placeholder="Untitled"
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
        />
        
        <div className="mt-2 flex items-center gap-2 text-xs text-gray-400">
            {data.page.updatedAt && (
                <span>Last edited {new Date(data.page.updatedAt).toLocaleString()}</span>
            )}
        </div>
      </div>
      
      <div className="pb-12">
        <BlockEditor 
            pageId={pageId} 
            initialBlocks={data.blocks} 
            onNavigateToPage={onNavigateToPage}
        />
      </div>

      {/* Backlinks Section */}
      <div className="mt-12 border-t border-gray-200 dark:border-gray-800 pt-6">
        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
            {backlinks && backlinks.length > 0 ? `${backlinks.length} Backlinks` : 'No Backlinks'}
        </div>
        
        {backlinksLoading && <div className="text-sm text-gray-400">Loading backlinks...</div>}
        
        {backlinks && backlinks.length > 0 && (
            <ul className="space-y-2">
                {backlinks.map(link => (
                    <li key={link.blockId} className="text-sm">
                        <button 
                            onClick={() => onNavigateToPage(link.pageId)}
                            className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
                        >
                            {link.pageTitle || 'Untitled'}
                        </button>
                        {link.preview && (
                            <span className="text-gray-500 dark:text-gray-400 ml-2 truncate inline-block max-w-md align-bottom">
                                ...{link.preview.replace(/\[\[page:[^|]+\|([^\]]+)\]\]/g, '$1')}...
                            </span>
                        )}
                    </li>
                ))}
            </ul>
        )}
      </div>
    </div>
  );
}
