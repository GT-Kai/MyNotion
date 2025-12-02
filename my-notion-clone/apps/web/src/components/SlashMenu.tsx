import { useEffect, useRef } from 'react';
import { BlockType } from '@my-notion/shared-types';

export type SlashCommand = {
  id: string;
  label: string;
  type: BlockType;
  description?: string;
};

export const SLASH_COMMANDS: SlashCommand[] = [
  { id: 'text', label: 'Text', type: 'paragraph', description: 'Just start writing with plain text.' },
  { id: 'h1', label: 'Heading 1', type: 'heading1', description: 'Big section heading.' },
  { id: 'h2', label: 'Heading 2', type: 'heading2', description: 'Medium section heading.' },
  { id: 'h3', label: 'Heading 3', type: 'heading3', description: 'Small section heading.' },
  { id: 'todo', label: 'To-do list', type: 'todo', description: 'Track tasks with a to-do list.' },
  { id: 'code', label: 'Code', type: 'code', description: 'Capture a code snippet.' },
  { id: 'divider', label: 'Divider', type: 'divider', description: 'Visually divide blocks.' },
];

interface SlashMenuProps {
  commands: SlashCommand[];
  selectedIndex: number;
  onSelect: (cmd: SlashCommand) => void;
  position: { top: number; left: number };
}

export function SlashMenu({ commands, selectedIndex, onSelect, position }: SlashMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (menuRef.current) {
      const selected = menuRef.current.children[selectedIndex] as HTMLElement;
      if (selected) {
        selected.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex]);

  if (commands.length === 0) return null;

  return (
    <div
      ref={menuRef}
      className="fixed z-50 w-72 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 max-h-80 overflow-y-auto py-2"
      style={{ top: position.top + 24, left: position.left }}
    >
      <div className="text-xs font-medium text-gray-500 dark:text-gray-400 px-3 py-1 mb-1 uppercase">Basic blocks</div>
      {commands.map((cmd, index) => (
        <button
          key={cmd.id}
          className={`w-full text-left px-3 py-2 flex items-center gap-3 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
            index === selectedIndex ? 'bg-gray-100 dark:bg-gray-700' : ''
          }`}
          onMouseDown={(e) => {
            e.preventDefault(); // Prevent blur on click
            onSelect(cmd);
          }}
        >
          {/* Placeholder Icon */}
          <div className="w-10 h-10 flex items-center justify-center bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded shadow-sm text-gray-600 dark:text-gray-300">
             {cmd.label[0]}
          </div>
          <div>
            <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{cmd.label}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400 truncate">{cmd.description}</div>
          </div>
        </button>
      ))}
    </div>
  );
}
