import { useEffect, useRef } from 'react';
import { Page } from '@my-notion/shared-types';

interface LinkMenuProps {
  pages: Page[];
  selectedIndex: number;
  onSelect: (page: Page) => void;
  position: { top: number; left: number };
}

export function LinkMenu({ pages, selectedIndex, onSelect, position }: LinkMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (menuRef.current) {
      const selected = menuRef.current.children[selectedIndex] as HTMLElement;
      if (selected) {
        selected.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex]);

  if (pages.length === 0) return null;

  return (
    <div
      ref={menuRef}
      className="fixed z-50 w-72 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 max-h-80 overflow-y-auto py-2"
      style={{ top: position.top + 24, left: position.left }}
    >
      <div className="text-xs font-medium text-gray-500 dark:text-gray-400 px-3 py-1 mb-1 uppercase">Link to page</div>
      {pages.map((page, index) => (
        <button
          key={page.id}
          className={`w-full text-left px-3 py-2 flex items-center gap-3 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
            index === selectedIndex ? 'bg-gray-100 dark:bg-gray-700' : ''
          }`}
          onMouseDown={(e) => {
            e.preventDefault(); // Prevent blur
            onSelect(page);
          }}
        >
          <div className="w-8 h-8 flex items-center justify-center bg-gray-100 dark:bg-gray-700 rounded text-gray-500 dark:text-gray-400 text-xs">
             📄
          </div>
          <div>
            <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{page.title || 'Untitled'}</div>
          </div>
        </button>
      ))}
    </div>
  );
}
