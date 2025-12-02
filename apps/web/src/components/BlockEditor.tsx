import { useState, useCallback, useRef, useMemo } from 'react';
import { Block, BlockType, Page } from '@my-notion/shared-types';
import { nanoid } from 'nanoid';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { saveBlocksApi } from '../api/blocks';
import { fetchPages } from '../api/pages';
import { createDatabase } from '../api/databases';
import { BlockItem } from './BlockItem';
import { SortableBlockItem } from './SortableBlockItem';
import { SlashMenu, SLASH_COMMANDS, SlashCommand } from './SlashMenu';
import { LinkMenu } from './LinkMenu';

interface BlockEditorProps {
  pageId: string;
  initialBlocks: Block[];
  onNavigateToPage: (pageId: string) => void;
}

interface BlockNode extends Block {
  children: BlockNode[];
}

interface SlashState {
  blockId: string;
  query: string;
  selectedIndex: number;
}

interface LinkState {
  blockId: string;
  query: string;
  selectedIndex: number;
}

export function BlockEditor({ pageId, initialBlocks, onNavigateToPage }: BlockEditorProps) {
  // If initialBlocks is empty, start with one paragraph
  const [blocks, setBlocks] = useState<Block[]>(
    initialBlocks.length > 0 
      ? initialBlocks 
      : [{
          id: nanoid(),
          pageId,
          type: 'paragraph',
          content: '',
          props: {},
          index: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          version: 1
        }]
  );

  const blockRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [slashState, setSlashState] = useState<SlashState | null>(null);
  const [linkState, setLinkState] = useState<LinkState | null>(null);

  // Pages for linking
  const { data: pages } = useQuery(['pages'], fetchPages);

  // 保存 API（整页保存）
  const saveMutation = useMutation({
    mutationFn: (data: Block[]) => saveBlocksApi(pageId, data),
  });

  // 简易 debounce
  const [saveTimer, setSaveTimer] = useState<number | null>(null);

  const scheduleSave = useCallback(
    (nextBlocks: Block[]) => {
      setBlocks(nextBlocks);

      if (saveTimer) {
        window.clearTimeout(saveTimer);
      }
      const timer = window.setTimeout(() => {
        saveMutation.mutate(nextBlocks);
      }, 500);
      setSaveTimer(timer);
    },
    [saveMutation, saveTimer]
  );

  // --- Tree Building Logic ---
  
  const buildBlockTree = (flatBlocks: Block[]): BlockNode[] => {
    const map = new Map<string, BlockNode>();
    // Initialize nodes
    flatBlocks.forEach((b) => {
      map.set(b.id, { ...b, children: [] });
    });

    const roots: BlockNode[] = [];
    
    // Build hierarchy
    flatBlocks.forEach((b) => {
      const node = map.get(b.id)!;
      if (b.parentBlockId) {
        const parent = map.get(b.parentBlockId);
        if (parent) {
          parent.children.push(node);
        } else {
          // Parent missing, fallback to root
          roots.push(node);
        }
      } else {
        roots.push(node);
      }
    });

    // Sort by index
    const sortRec = (nodes: BlockNode[]) => {
      nodes.sort((a, b) => a.index - b.index);
      nodes.forEach((n) => sortRec(n.children));
    };
    sortRec(roots);

    return roots;
  };

  // Helper to flatten tree for linear navigation
  const flattenTree = (nodes: BlockNode[]): BlockNode[] => {
    let flat: BlockNode[] = [];
    nodes.forEach(node => {
      flat.push(node);
      if (node.children.length > 0) {
        flat = flat.concat(flattenTree(node.children));
      }
    });
    return flat;
  };

  // --- Actions ---

  const updateBlockContent = (id: string, content: string) => {
    const next = blocks.map((b) => (b.id === id ? { ...b, content } : b));
    scheduleSave(next);
  };

  const updateBlockType = (id: string, type: BlockType) => {
    const next = blocks.map((b) => (b.id === id ? { ...b, type } : b));
    scheduleSave(next);
  };

  const updateBlockProps = (id: string, props: any) => {
    const next = blocks.map((b) => {
        if (b.id === id) {
            return { ...b, props: { ...b.props, ...props } };
        }
        return b;
    });
    scheduleSave(next);
  };

  const toggleTodoChecked = (id: string) => {
    const next = blocks.map((b) => {
      if (b.id !== id) return b;
      const checked = !!b.props?.checked;
      return { ...b, props: { ...b.props, checked: !checked } };
    });
    scheduleSave(next);
  };

  const addBlockAfter = (id: string) => {
    const idx = blocks.findIndex((b) => b.id === id);
    if (idx === -1) return;
    
    const currentBlock = blocks[idx];
    
    // Determine new block type
    let newType: BlockType = 'paragraph';
    if (currentBlock.type === 'todo') {
        newType = 'todo';
    }
    // Headers always result in paragraph
    
    const now = new Date().toISOString();
    const newBlock: Block = {
      id: nanoid(),
      pageId,
      type: newType,
      content: '',
      props: {},
      // We will re-index everything anyway, so just put it after current
      index: currentBlock.index + 1,
      parentBlockId: currentBlock.parentBlockId, // Same level by default
      createdAt: now,
      updatedAt: now,
      version: 1
    };

    // 1. Find all blocks with same parent
    const siblings = blocks.filter(b => b.parentBlockId === currentBlock.parentBlockId).sort((a, b) => a.index - b.index);
    const siblingIndex = siblings.findIndex(b => b.id === id);
    
    // Insert new block after current in siblings list
    const newSiblings = [
      ...siblings.slice(0, siblingIndex + 1),
      newBlock,
      ...siblings.slice(siblingIndex + 1)
    ];
    
    // Update indices for these siblings
    const updatedSiblings = newSiblings.map((b, i) => ({ ...b, index: i }));
    
    // Merge back into main list
    const otherBlocks = blocks.filter(b => b.parentBlockId !== currentBlock.parentBlockId);
    const next = [...otherBlocks, ...updatedSiblings];

    scheduleSave(next);
    
    // Auto-focus new block after render
    setTimeout(() => {
        const el = blockRefs.current[newBlock.id];
        if (el) el.focus();
    }, 0);
  };

  const deleteBlock = (id: string) => {
    if (blocks.length <= 1) {
      const only = blocks[0];
      const next = [{ ...only, content: '' }];
      scheduleSave(next);
      return;
    }

    // Calculate focus target before deleting
    const rootNodes = buildBlockTree(blocks);
    const flat = flattenTree(rootNodes);
    const idx = flat.findIndex(b => b.id === id);
    const prevBlockId = idx > 0 ? flat[idx - 1].id : (flat.length > 1 ? flat[idx + 1].id : null);

    // Also delete children? For MVP, yes, cascade delete locally.
    // We need to find all descendants.
    const getDescendants = (rootId: string): string[] => {
        const children = blocks.filter(b => b.parentBlockId === rootId);
        let ids = children.map(c => c.id);
        children.forEach(c => {
            ids = [...ids, ...getDescendants(c.id)];
        });
        return ids;
    };
    
    const idsToDelete = [id, ...getDescendants(id)];
    const next = blocks.filter(b => !idsToDelete.includes(b.id));
    scheduleSave(next);

    if (prevBlockId && !idsToDelete.includes(prevBlockId)) {
        setTimeout(() => {
            const el = blockRefs.current[prevBlockId];
            if (el) {
                el.focus();
                // Move cursor to end
                const range = document.createRange();
                const sel = window.getSelection();
                range.selectNodeContents(el);
                range.collapse(false);
                sel?.removeAllRanges();
                sel?.addRange(range);
            }
        }, 0);
    }
  };

  const indentBlock = (id: string) => {
    const block = blocks.find(b => b.id === id);
    if (!block) return;

    // Find siblings to determine previous block
    const siblings = blocks
      .filter(b => b.parentBlockId === block.parentBlockId)
      .sort((a, b) => a.index - b.index);
    
    const idx = siblings.findIndex(b => b.id === id);
    if (idx <= 0) return; // No previous block to nest under

    const prevBlock = siblings[idx - 1];
    
    // Update parentBlockId to prevBlock.id
    const next = blocks.map(b => {
        if (b.id === id) {
            return { ...b, parentBlockId: prevBlock.id };
        }
        return b;
    });
    
    scheduleSave(next);
  };

  const outdentBlock = (id: string) => {
    const block = blocks.find(b => b.id === id);
    if (!block) return;

    if (!block.parentBlockId) return; // Already at root

    const parent = blocks.find(b => b.id === block.parentBlockId);
    // New parent is grandparent
    const newParentId = parent?.parentBlockId || null; // If parent not found (shouldn't happen), move to root

    const next = blocks.map(b => {
        if (b.id === id) {
            return { ...b, parentBlockId: newParentId };
        }
        return b;
    });
    scheduleSave(next);
  };

  // --- Focus Navigation ---

  const focusBlock = (id: string) => {
    const el = blockRefs.current[id];
    if (el) el.focus();
  };

  const focusPrev = (id: string) => {
    const rootNodes = buildBlockTree(blocks);
    const flat = flattenTree(rootNodes);
    const idx = flat.findIndex(b => b.id === id);
    if (idx > 0) {
        focusBlock(flat[idx - 1].id);
    }
  };

  const focusNext = (id: string) => {
    const rootNodes = buildBlockTree(blocks);
    const flat = flattenTree(rootNodes);
    const idx = flat.findIndex(b => b.id === id);
    if (idx !== -1 && idx < flat.length - 1) {
        focusBlock(flat[idx + 1].id);
    }
  };

  // --- Slash Command Logic ---

  const handleSlashChange = (blockId: string, query: string | null) => {
    if (query === null) {
        setSlashState(null);
        return;
    }
    setSlashState({
        blockId,
        query,
        selectedIndex: 0,
    });
  };

  const getAvailableCommands = () => {
    if (!slashState) return [];
    return SLASH_COMMANDS.filter((cmd) =>
      cmd.label.toLowerCase().includes(slashState.query.toLowerCase())
    );
  };

  const applySlashCommand = async (blockId: string, cmd: SlashCommand) => {
    const idx = blocks.findIndex(b => b.id === blockId);
    if (idx === -1) return;

    const target = blocks[idx];
    const next = [...blocks];

    if (cmd.type === 'divider') {
        next[idx] = {
            ...target,
            type: 'divider',
            content: '',
            props: {},
        };
    } else if (cmd.type === 'table') {
        try {
            const db = await createDatabase(pageId, 'Untitled Database');
            next[idx] = {
                ...target,
                type: 'table',
                content: db.id,
                props: {},
            };

            // Insert new paragraph block after table so flow continues
            const newBlock: Block = {
                id: nanoid(),
                pageId,
                type: 'paragraph',
                content: '',
                props: {},
                index: target.index + 1, // Approx index
                parentBlockId: target.parentBlockId,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                version: 1
            };
            next.splice(idx + 1, 0, newBlock);
            
            // Simple reindex of siblings to be safe
            const siblings = next.filter(b => b.parentBlockId === target.parentBlockId);
            siblings.sort((a, b) => a.index - b.index).forEach((b, i) => b.index = i);

            setTimeout(() => {
                const el = blockRefs.current[newBlock.id];
                if (el) el.focus();
            }, 0);

        } catch (err) {
            console.error('Failed to create table', err);
            return;
        }
    } else {
        next[idx] = {
            ...target,
            type: cmd.type,
            content: '', // Clear the '/xxx' content
            props: cmd.type === 'todo' ? { checked: false } : {},
        };
    }

    setSlashState(null);
    scheduleSave(next);
    
    // Refocus
    if (cmd.type !== 'table') {
        setTimeout(() => {
            const el = blockRefs.current[blockId];
            if (el) {
                el.focus();
                if (cmd.type !== 'divider') {
                    // Clear input value in DOM if needed (React should handle it but safety first)
                    el.innerText = '';
                }
            }
        }, 0);
    }
  };

  // --- Link Logic ---

  const handleLinkChange = (blockId: string, query: string | null) => {
    if (query === null) {
        setLinkState(null);
        return;
    }
    setLinkState({
        blockId,
        query,
        selectedIndex: 0,
    });
  };

  const getFilteredPages = () => {
      if (!linkState || !pages) return [];
      const q = linkState.query.toLowerCase();
      return pages.filter(p => p.title.toLowerCase().includes(q)).slice(0, 10);
  };

  const applyLinkCommand = (blockId: string, page: Page) => {
      const idx = blocks.findIndex(b => b.id === blockId);
      if (idx === -1) return;
      
      const block = blocks[idx];
      const text = block.content;
      const lastIdx = text.lastIndexOf('[[');
      if (lastIdx === -1) return;

      const before = text.slice(0, lastIdx);
      // We replace everything after [[ with the link token
      // [[page:id|Title]]
      const linkToken = `[[page:${page.id}|${page.title}]]`;
      const newContent = before + linkToken + ' '; // Add space after

      const next = [...blocks];
      next[idx] = { ...block, content: newContent };

      setLinkState(null);
      scheduleSave(next);

      // Refocus
      setTimeout(() => {
          const el = blockRefs.current[blockId];
          if (el) el.focus();
      }, 0);
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const activeBlock = blocks.find((b) => b.id === activeId);
    const overBlock = blocks.find((b) => b.id === overId);

    if (!activeBlock || !overBlock) return;

    // MVP: Only allow reordering within same parent
    if (activeBlock.parentBlockId !== overBlock.parentBlockId) {
        return;
    }

    const parentId = activeBlock.parentBlockId;

    const siblings = blocks
        .filter((b) => b.parentBlockId === parentId)
        .sort((a, b) => a.index - b.index);

    const oldIndex = siblings.findIndex((b) => b.id === activeId);
    const newIndex = siblings.findIndex((b) => b.id === overId);

    if (oldIndex !== -1 && newIndex !== -1) {
        const newSiblings = arrayMove(siblings, oldIndex, newIndex).map((b, i) => ({
            ...b,
            index: i,
        }));

        const nextBlocks = blocks.map((b) => {
            const updated = newSiblings.find((s) => s.id === b.id);
            return updated || b;
        });

        scheduleSave(nextBlocks);
    }
  };

  const handleAppendEmptyBlock = () => {
      const lastBlock = blocks[blocks.length - 1];
      const newBlock: Block = {
          id: nanoid(),
          pageId,
          type: 'paragraph',
          content: '',
          props: {},
          index: (lastBlock?.index ?? 0) + 1,
          parentBlockId: null, 
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          version: 1
      };
      const next = [...blocks, newBlock];
      scheduleSave(next);
      setTimeout(() => {
          const el = blockRefs.current[newBlock.id];
          if (el) el.focus();
      }, 0);
  };

  // --- Rendering ---

  const renderNodes = (nodes: BlockNode[], depth: number = 0) => {
    return nodes.map((node) => (
      <div key={node.id}>
        <SortableBlockItem id={node.id}>
            {({ dragHandleProps, isDragging }) => (
                <BlockItem
                    block={node}
                    depth={depth}
                    onChangeContent={(content) => updateBlockContent(node.id, content)}
                    onChangeType={(type) => updateBlockType(node.id, type)}
                    onUpdateProps={(props) => updateBlockProps(node.id, props)}
                    onToggleTodo={() => toggleTodoChecked(node.id)}
                    onEnter={() => addBlockAfter(node.id)}
                    onDeleteEmpty={() => deleteBlock(node.id)}
                    onIndent={() => indentBlock(node.id)}
                    onOutdent={() => outdentBlock(node.id)}
                    // Refs & Nav
                    registerRef={(el) => (blockRefs.current[node.id] = el)}
                    onArrowUp={() => focusPrev(node.id)}
                    onArrowDown={() => focusNext(node.id)}
                    // Slash
                    onSlash={(query) => handleSlashChange(node.id, query)}
                    slashMenuOpen={slashState?.blockId === node.id}
                    onSlashArrowUp={() => setSlashState(prev => prev ? ({ ...prev, selectedIndex: Math.max(0, prev.selectedIndex - 1) }) : null)}
                    onSlashArrowDown={() => setSlashState(prev => {
                        if (!prev) return null;
                        const max = getAvailableCommands().length - 1;
                        return { ...prev, selectedIndex: Math.min(max, prev.selectedIndex + 1) };
                    })}
                    onSlashEnter={() => {
                        if (slashState) {
                            const cmds = getAvailableCommands();
                            if (cmds[slashState.selectedIndex]) {
                                applySlashCommand(slashState.blockId, cmds[slashState.selectedIndex]);
                            }
                        }
                    }}
                    onSlashClose={() => setSlashState(null)}
                    // Link
                    onLink={(query) => handleLinkChange(node.id, query)}
                    linkMenuOpen={linkState?.blockId === node.id}
                    onLinkArrowUp={() => setLinkState(prev => prev ? ({ ...prev, selectedIndex: Math.max(0, prev.selectedIndex - 1) }) : null)}
                    onLinkArrowDown={() => setLinkState(prev => {
                        if (!prev) return null;
                        const max = getFilteredPages().length - 1;
                        return { ...prev, selectedIndex: Math.min(max, prev.selectedIndex + 1) };
                    })}
                    onLinkEnter={() => {
                        if (linkState) {
                            const pg = getFilteredPages();
                            if (pg[linkState.selectedIndex]) {
                                applyLinkCommand(linkState.blockId, pg[linkState.selectedIndex]);
                            }
                        }
                    }}
                    onLinkClose={() => setLinkState(null)}
                    onNavigateToPage={onNavigateToPage}
                    isFirst={false} 
                    isLast={false}
                    dragHandleProps={dragHandleProps}
                    isDragging={isDragging}
                />
            )}
        </SortableBlockItem>
        {node.children.length > 0 && renderNodes(node.children, depth + 1)}
      </div>
    ));
  };

  const rootNodes = buildBlockTree(blocks);
  const availableCommands = getAvailableCommands();
  const filteredPages = getFilteredPages();

  const visibleIds = useMemo(() => {
      return flattenTree(rootNodes).map(n => n.id);
  }, [rootNodes]); // rootNodes changes when blocks change, so this is safe

  // Calculate menu position
  let menuPos = { top: 0, left: 0 };
  // Use either slashState or linkState
  const activeBlockId = slashState?.blockId || linkState?.blockId;
  
  if (activeBlockId && blockRefs.current[activeBlockId]) {
      const rect = blockRefs.current[activeBlockId]?.getBoundingClientRect();
      if (rect) {
          menuPos = { top: rect.bottom, left: rect.left };
      }
  }

  return (
    <DndContext 
        sensors={sensors} 
        collisionDetection={closestCenter} 
        onDragEnd={handleDragEnd}
    >
        <SortableContext 
            items={visibleIds} 
            strategy={verticalListSortingStrategy}
        >
            <div className="max-w-3xl mx-auto pb-32">
              {renderNodes(rootNodes)}
              
              {slashState && availableCommands.length > 0 && (
                <SlashMenu 
                    commands={availableCommands} 
                    selectedIndex={slashState.selectedIndex} 
                    onSelect={(cmd) => applySlashCommand(slashState.blockId, cmd)}
                    position={menuPos}
                />
              )}

              {linkState && filteredPages.length > 0 && (
                <LinkMenu
                    pages={filteredPages}
                    selectedIndex={linkState.selectedIndex}
                    onSelect={(page) => applyLinkCommand(linkState.blockId, page)}
                    position={menuPos}
                />
              )}
            </div>
        </SortableContext>
    </DndContext>
  );
}
