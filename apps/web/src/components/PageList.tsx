import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchPages, createPage } from '../api/pages';

interface PageListProps {
  onSelectPage: (id: string) => void;
}

export function PageList({ onSelectPage }: PageListProps) {
  const queryClient = useQueryClient();
  const { data: pages, isLoading } = useQuery(['pages'], fetchPages);

  const createMutation = useMutation({
    mutationFn: () => createPage({ title: 'New Page ' + new Date().toLocaleTimeString() }),
    onSuccess: () => queryClient.invalidateQueries(['pages']),
  });

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Pages</h2>
        <button 
          onClick={() => createMutation.mutate()}
          className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
          disabled={createMutation.isLoading}
        >
          + New Page
        </button>
      </div>
      <ul className="space-y-2">
        {pages?.map((p) => (
          <li 
            key={p.id} 
            className="p-2 border rounded hover:bg-gray-50 cursor-pointer"
            onClick={() => onSelectPage(p.id)}
          >
            <div className="font-medium">{p.title}</div>
            <div className="text-xs text-gray-500">{p.type}</div>
          </li>
        ))}
      </ul>
    </div>
  );
}
