import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Page } from '@my-notion/shared-types';
import { fetchPages, createPage } from '../../api/pages';
import { useDarkMode } from '../../hooks/useDarkMode';

interface SidebarProps {
  selectedPageId: string | null;
  onSelectPage: (id: string) => void;
}

interface PageNode extends Page {
  children: PageNode[];
}

// ... buildPageTree implementation remains same ...
function buildPageTree(pages: Page[]): PageNode[] {
  const map = new Map<string, PageNode>();
  pages.forEach(p => map.set(p.id, { ...p, children: [] }));

  const roots: PageNode[] = [];

  map.forEach(node => {
    if (node.parentId) {
      const parent = map.get(node.parentId);
      if (parent) {
        parent.children.push(node);
      } else {
        roots.push(node);
      }
    } else {
      roots.push(node);
    }
  });

  const sortRec = (nodes: PageNode[]) => {
    nodes.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
    nodes.forEach(n => sortRec(n.children));
  };
  sortRec(roots);

  return roots;
}

export function Sidebar({ selectedPageId, onSelectPage }: SidebarProps) {
  const queryClient = useQueryClient();
  const { data: pages } = useQuery(['pages'], fetchPages);
  const [collapsedIds, setCollapsedIds] = useState<Set<string>>(new Set());
  const [isDark, setIsDark] = useDarkMode();

  const createMutation = useMutation({
    mutationFn: (parentId: string | null) => createPage({ 
        title: 'Untitled', 
        parentId: parentId 
    }),
    onSuccess: (newPage) => {
        queryClient.invalidateQueries(['pages']);
        onSelectPage(newPage.id);
        if (newPage.parentId) {
            setCollapsedIds(prev => {
                const next = new Set(prev);
                next.delete(newPage.parentId!);
                return next;
            });
        }
    },
  });

  const handleCreatePage = () => {
      createMutation.mutate(selectedPageId);
  };

  const toggleCollapse = (id: string) => {
    setCollapsedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const renderTree = (nodes: PageNode[], depth: number = 0) => {
    return nodes.map(node => {
      const isActive = node.id === selectedPageId;
      const isCollapsed = collapsedIds.has(node.id);
      const hasChildren = node.children.length > 0;

      return (
        <li key={node.id}>
          <div
            className={`flex items-center gap-1 px-3 py-1 text-sm rounded-sm cursor-pointer select-none transition-colors ${
              isActive 
                ? 'bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-medium' 
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
            style={{ paddingLeft: `${depth * 12 + 12}px` }}
            onClick={() => onSelectPage(node.id)}
          >
            <div
              className={`w-4 h-4 flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors ${hasChildren ? 'visible' : 'invisible'}`}
              onClick={(e) => {
                e.stopPropagation();
                toggleCollapse(node.id);
              }}
            >
              <span className="text-[10px] transform transition-transform" style={{ transform: isCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)' }}>
                ▼
              </span>
            </div>
            <span className="truncate flex-1">{node.title || 'Untitled'}</span>
          </div>

          {!isCollapsed && hasChildren && (
            <ul>
              {renderTree(node.children, depth + 1)}
            </ul>
          )}
        </li>
      );
    });
  };

  const tree = buildPageTree(pages || []);

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-950 border-r border-gray-200 dark:border-gray-800 transition-colors duration-200">
      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between sticky top-0 bg-gray-50 dark:bg-gray-950 z-10">
        <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
          Workspace
        </span>
        <div className="flex items-center gap-2">
            <button
                onClick={() => setIsDark(!isDark)}
                className="text-xs px-2 py-1 rounded hover:bg-gray-200 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 transition-colors"
                title="Toggle Dark Mode"
            >
                {isDark ? '🌙' : '☀️'}
            </button>
            <button 
                onClick={handleCreatePage}
                className="text-xs px-2 py-1 rounded bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 transition-colors"
                title="Create a new page"
            >
                + New
            </button>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto py-2">
        {tree.length === 0 ? (
            <div className="px-4 text-xs text-gray-400 mt-4 text-center">No pages yet</div>
        ) : (
            <ul>
                {renderTree(tree)}
            </ul>
        )}
      </div>
    </div>
  );
}
