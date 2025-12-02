import { useRef, useState, KeyboardEvent, useLayoutEffect } from 'react';
import { Block, BlockType } from '@my-notion/shared-types';
import { toInlineHtml } from '../utils/inlineFormat';

interface BlockItemProps {
  block: Block;
  depth: number;
  onChangeContent: (value: string) => void;
  onChangeType: (type: BlockType) => void;
  onToggleTodo: () => void;
  onEnter: () => void;
  onDeleteEmpty: () => void;
  onIndent: () => void;
  onOutdent: () => void;
  registerRef: (el: HTMLDivElement | null) => void;
  onArrowUp: () => void;
  onArrowDown: () => void;
  // Slash Menu Props
  onSlash: (query: string | null) => void;
  slashMenuOpen: boolean;
  onSlashArrowUp: () => void;
  onSlashArrowDown: () => void;
  onSlashEnter: () => void;
  onSlashClose: () => void;
  // Link Menu Props
  onLink: (query: string | null) => void;
  linkMenuOpen: boolean;
  onLinkArrowUp: () => void;
  onLinkArrowDown: () => void;
  onLinkEnter: () => void;
  onLinkClose: () => void;
  onNavigateToPage: (pageId: string) => void;
  isFirst: boolean;
  isLast: boolean;
  dragHandleProps?: React.HTMLAttributes<HTMLButtonElement>;
  isDragging?: boolean;
}

export function BlockItem(props: BlockItemProps) {
  const {
    block,
    depth,
    onChangeContent,
    onChangeType,
    onToggleTodo,
    onEnter,
    onDeleteEmpty,
    onIndent,
    onOutdent,
    registerRef,
    onArrowUp,
    onArrowDown,
    onSlash,
    slashMenuOpen,
    onSlashArrowUp,
    onSlashArrowDown,
    onSlashEnter,
    onSlashClose,
    onLink,
    linkMenuOpen,
    onLinkArrowUp,
    onLinkArrowDown,
    onLinkEnter,
    onLinkClose,
    onNavigateToPage,
    dragHandleProps,
    isDragging,
  } = props;

  const [isFocused, setIsFocused] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useLayoutEffect(() => {
    if (isFocused && ref.current) {
        if (ref.current.innerText !== block.content) {
            ref.current.innerText = block.content;
            // Restore cursor to end
            const range = document.createRange();
            const sel = window.getSelection();
            range.selectNodeContents(ref.current);
            range.collapse(false);
            sel?.removeAllRanges();
            sel?.addRange(range);
        }
    }
  }, [block.content, isFocused]);

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    // Slash Menu Navigation
    if (slashMenuOpen) {
      if (e.key === 'ArrowUp') { e.preventDefault(); onSlashArrowUp(); return; }
      if (e.key === 'ArrowDown') { e.preventDefault(); onSlashArrowDown(); return; }
      if (e.key === 'Enter') { e.preventDefault(); onSlashEnter(); return; }
      if (e.key === 'Escape') { e.preventDefault(); onSlashClose(); return; }
    }

    // Link Menu Navigation
    if (linkMenuOpen) {
      if (e.key === 'ArrowUp') { e.preventDefault(); onLinkArrowUp(); return; }
      if (e.key === 'ArrowDown') { e.preventDefault(); onLinkArrowDown(); return; }
      if (e.key === 'Enter') { e.preventDefault(); onLinkEnter(); return; }
      if (e.key === 'Escape') { e.preventDefault(); onLinkClose(); return; }
    }

    // Enter：新建块
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onEnter();
    }

    // Backspace：空块时删除
    if (e.key === 'Backspace') {
      const text = getPlainText(ref.current);
      if (!text) {
        e.preventDefault();
        onDeleteEmpty();
      }
    }

    // Tab: 缩进/反缩进
    if (e.key === 'Tab') {
      e.preventDefault();
      if (e.shiftKey) {
        onOutdent();
      } else {
        onIndent();
      }
    }

    // Arrow keys
    if (e.key === 'ArrowUp') {
        e.preventDefault();
        onArrowUp();
    }
    if (e.key === 'ArrowDown') {
        e.preventDefault();
        onArrowDown();
    }
  };

  const handleInput = () => {
    if (!ref.current) return;
    const text = getPlainText(ref.current);
    
    // Trigger Slash Menu
    if (text.startsWith('/')) {
      onSlash(text.slice(1));
    } else {
      onSlash(null);
    }

    // Trigger Link Menu
    const linkMatch = text.match(/\[\[([^\]]*)$/); 
    if (linkMatch) {
        onLink(linkMatch[1]);
    } else {
        onLink(null);
    }

    onChangeContent(text);
  };

  // 根据 type 渲染不同样式
  const renderPrefix = () => {
    if (block.type === 'todo') {
      const checked = !!block.props?.checked;
      return (
        <input
          type="checkbox"
          checked={checked}
          onChange={onToggleTodo}
          className="mr-2 mt-1.5"
        />
      );
    }
    if (block.type === 'heading1') return <span className="mr-2 text-xl font-bold select-none text-gray-400 dark:text-gray-500">H1</span>;
    if (block.type === 'heading2') return <span className="mr-2 text-lg font-semibold select-none text-gray-400 dark:text-gray-500">H2</span>;
    if (block.type === 'heading3') return <span className="mr-2 text-base font-semibold select-none text-gray-400 dark:text-gray-500">H3</span>;
    if (block.type === 'code') return <span className="mr-2 select-none text-gray-400 dark:text-gray-500">{"</>"}</span>;
    return null;
  };

  const style = {
    paddingLeft: `${depth * 24}px`, // 24px per level
  };

  if (block.type === 'divider') {
    return (
      <div 
        style={style} 
        ref={(el) => {
            ref.current = el;
            registerRef(el);
        }}
        tabIndex={0} // Make divider focusable for arrow nav
        onKeyDown={handleKeyDown}
        className="outline-none"
      >
        <hr className="my-2 border-gray-300 dark:border-gray-700" />
      </div>
    );
  }

  return (
    <div 
      className={`flex items-start gap-2 py-1 group ${isDragging ? 'opacity-50' : ''}`}
      style={style}
    >
      {/* Drag Handle */}
      <button
          type="button"
          {...dragHandleProps}
          className="mt-1 cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-600 dark:text-gray-600 dark:hover:text-gray-400 select-none opacity-0 group-hover:opacity-100 transition-opacity"
          title="Drag to move"
      >
         ⋮⋮
      </button>

      {/* 类型选择 */}
      <select
        value={block.type}
        onChange={(e) => onChangeType(e.target.value as BlockType)}
        className="text-xs mt-1 opacity-0 group-hover:opacity-100 transition-opacity bg-transparent dark:text-gray-400 w-4"
      >
        <option value="paragraph">P</option>
        <option value="heading1">H1</option>
        <option value="heading2">H2</option>
        <option value="heading3">H3</option>
        <option value="todo">Todo</option>
        <option value="code">Code</option>
        <option value="divider">Divider</option>
      </select>

      {renderPrefix()}

      <div
        ref={(el) => {
            ref.current = el;
            registerRef(el);
        }}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        onClick={(e) => {
            const target = e.target as HTMLElement;
            const pageId = target.getAttribute('data-page-id');
            if (pageId) {
                e.preventDefault();
                // Don't navigate if editing? 
                // Notion navigates on click even in edit mode if you click the link specifically?
                // Actually Notion requires Ctrl+Click in edit mode usually, or just click.
                // Let's just navigate.
                onNavigateToPage(pageId);
            }
        }}
        className={getBlockClassName(block)}
        dangerouslySetInnerHTML={
            !isFocused ? { __html: toInlineHtml(block.content) || '<br/>' } : undefined
        }
      />
    </div>
  );
}

function getPlainText(el: HTMLDivElement | null): string {
  if (!el) return '';
  return el.innerText; 
}

function getBlockClassName(block: Block): string {
  const base = 'flex-1 outline-none min-h-[1.5em]'; // Add min-h to ensure empty blocks are clickable
  if (block.type === 'heading1') return `${base} text-2xl font-bold`;
  if (block.type === 'heading2') return `${base} text-xl font-semibold`;
  if (block.type === 'heading3') return `${base} text-lg font-semibold`;
  if (block.type === 'code') return `${base} font-mono bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded whitespace-pre-wrap`;
  return `${base} leading-relaxed`;
}
