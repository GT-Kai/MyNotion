import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchDatabase, updateRow, createRow, createColumn, updateColumn, deleteRow } from '../../api/databases';
import { DatabaseRow, DatabaseColumn } from '@my-notion/shared-types';
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from '@dnd-kit/core';
import {
  SortableContext,
  horizontalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface TableBlockProps {
  databaseId: string;
}

export function TableBlock({ databaseId }: TableBlockProps) {
  const queryClient = useQueryClient();
  const [lastCreatedColumnId, setLastCreatedColumnId] = useState<string | null>(null);
  const [lastCreatedRowId, setLastCreatedRowId] = useState<string | null>(null);
  const { data, isLoading, error } = useQuery(['database', databaseId], () => fetchDatabase(databaseId));

  const [orderedColumns, setOrderedColumns] = useState<DatabaseColumn[]>([]);

  useEffect(() => {
      if (data?.columns) {
          if (orderedColumns.length === 0 || orderedColumns.length !== data.columns.length) {
              const sorted = [...data.columns].sort(
                  (a, b) => (a.position ?? 0) - (b.position ?? 0)
              );
              setOrderedColumns(sorted);
          }
      }
  }, [data?.columns, orderedColumns.length]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = orderedColumns.findIndex((c) => c.id === active.id);
    const newIndex = orderedColumns.findIndex((c) => c.id === over.id);

    const newColumns = arrayMove(orderedColumns, oldIndex, newIndex);
    setOrderedColumns(newColumns);

    newColumns.forEach((col, index) => {
        if (col.position !== index) {
            updateColumnMutation.mutate({ colId: col.id, position: index });
        }
    });
  };

  const updateRowMutation = useMutation({
    mutationFn: (vars: { rowId: string; data: any }) => updateRow(vars.rowId, vars.data),
    onSuccess: () => {
      queryClient.invalidateQueries(['database', databaseId]);
    }
  });

  // ... (other mutations same as before) ...

  const createRowMutation = useMutation({
    mutationFn: () => createRow(databaseId),
    onSuccess: (newRow) => {
      setLastCreatedRowId(newRow.id);
      queryClient.invalidateQueries(['database', databaseId]);
    }
  });

  const deleteRowMutation = useMutation({
    mutationFn: (rowId: string) => deleteRow(rowId),
    onSuccess: () => {
      queryClient.invalidateQueries(['database', databaseId]);
    }
  });

  const createColumnMutation = useMutation({
    mutationFn: () => createColumn(databaseId),
    onSuccess: (newCol) => {
      setLastCreatedColumnId(newCol.id);
      queryClient.invalidateQueries(['database', databaseId]);
    }
  });

  const updateColumnMutation = useMutation({
    mutationFn: (vars: { colId: string; name?: string; type?: string; position?: number }) => updateColumn(vars.colId, { name: vars.name, type: vars.type, position: vars.position }),
    onSuccess: () => {
      queryClient.invalidateQueries(['database', databaseId]);
    }
  });

  if (isLoading) return <div className="text-gray-400 p-2 text-sm">Loading table...</div>;
  if (error) return <div className="text-red-400 p-2 text-sm">Error loading table</div>;
  if (!data) return null;

  const { rows } = data;
  // Use orderedColumns if available, else data.columns
  const displayColumns = orderedColumns.length > 0 ? orderedColumns : data.columns;

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
    <div className="overflow-x-auto border rounded-md border-gray-200 dark:border-gray-700 my-2 shadow-sm">
      <table className="w-full text-sm border-collapse bg-white dark:bg-gray-800 table-fixed">
        <thead>
          <SortableContext items={displayColumns.map(c => c.id)} strategy={horizontalListSortingStrategy}>
          <tr>
            {displayColumns.map(col => (
              <SortableColumnHeader 
                  key={col.id}
                  column={col} 
                  autoFocus={col.id === lastCreatedColumnId}
                  onUpdate={(updates: any) => updateColumnMutation.mutate({ colId: col.id, ...updates })} 
                  onBlurDone={() => {
                      if (lastCreatedColumnId === col.id) {
                          setLastCreatedColumnId(null);
                      }
                  }}
              />
            ))}
             <th className="border-b border-gray-200 dark:border-gray-700 w-10 text-center p-0">
                <button 
                    onClick={() => createColumnMutation.mutate()}
                    className="text-gray-400 hover:text-gray-700 dark:text-gray-500 dark:hover:text-gray-200 w-full h-full flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    title="New Column"
                >
                    +
                </button>
             </th>
          </tr>
          </SortableContext>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <TableRow 
                key={row.id} 
                row={row} 
                columns={displayColumns} 
                isLastRow={rowIndex === rows.length - 1}
                autoFocus={row.id === lastCreatedRowId}
                onUpdate={(newData) => updateRowMutation.mutate({ rowId: row.id, data: newData })}
                onCreateRow={() => createRowMutation.mutate()}
                onDelete={() => deleteRowMutation.mutate(row.id)}
                onFocusDone={() => {
                    if (lastCreatedRowId === row.id) setLastCreatedRowId(null);
                }}
            />
          ))}
          <tr>
             <td colSpan={displayColumns.length + 1} className="p-1 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                 <button 
                    onClick={() => createRowMutation.mutate()}
                    className="text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 flex items-center gap-1 text-xs px-2 py-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                 >
                     + New row
                 </button>
             </td>
          </tr>
        </tbody>
      </table>
    </div>
    </DndContext>
  );
}

function SortableColumnHeader({ column, ...props }: any) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: column.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : undefined,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <th
      ref={setNodeRef}
      style={style}
      className="border-b border-r border-gray-200 dark:border-gray-700 px-0 py-0 text-left font-medium text-gray-500 dark:text-gray-400 w-[200px] relative h-8 group"
    >
        <div className="flex items-center h-full w-full">
            {/* Drag Handle */}
            <div 
                {...attributes} 
                {...listeners} 
                className="cursor-grab active:cursor-grabbing px-1 text-gray-300 hover:text-gray-600 dark:hover:text-gray-400 opacity-0 group-hover:opacity-100 absolute left-0 top-0 bottom-0 flex items-center z-20"
            >
                ⋮⋮
            </div>
            <div className="pl-4 w-full h-full">
                 <TableColumnHeader column={column} {...props} />
            </div>
        </div>
    </th>
  );
}

function TableColumnHeader({ 
    column, 
    autoFocus, 
    onUpdate, 
    onBlurDone 
}: { 
    column: DatabaseColumn; 
    autoFocus?: boolean; 
    onUpdate: (updates: { name?: string; type?: string }) => void; 
    onBlurDone?: () => void;
}) {
    const [name, setName] = useState(column.name);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const inputRef = useRef<HTMLInputElement | null>(null);
    
    useEffect(() => {
        setName(column.name);
    }, [column.name]);

    useEffect(() => {
        if (autoFocus && inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, [autoFocus]);

    const handleBlur = () => {
        if (name !== column.name) {
            onUpdate({ name });
        }
        onBlurDone?.();
    };

    const handleTypeChange = (type: string) => {
        onUpdate({ type });
        setIsMenuOpen(false);
    };

    return (
        <div className="flex items-center w-full h-full relative group/header">
            <button 
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="flex items-center justify-center px-2 h-full text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-xs font-mono"
                title="Change Type"
            >
                {column.type === 'number' ? '#' : 'Aa'}
            </button>
            
            <input
                ref={inputRef}
                className="flex-1 h-full px-1 py-2 bg-transparent outline-none text-sm font-medium text-gray-600 dark:text-gray-300 focus:bg-gray-50 dark:focus:bg-gray-700"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onBlur={handleBlur}
            />

            {isMenuOpen && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsMenuOpen(false)} />
                    <div className="absolute top-full left-0 mt-1 w-32 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded shadow-lg z-50 py-1 flex flex-col">
                        <div className="px-3 py-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Type</div>
                        <button 
                            onClick={() => handleTypeChange('text')}
                            className={`px-3 py-1.5 text-left text-xs hover:bg-gray-100 dark:hover:bg-gray-700 ${column.type === 'text' ? 'text-blue-500 font-medium' : 'text-gray-700 dark:text-gray-200'}`}
                        >
                            <span className="font-mono mr-2 text-gray-400">Aa</span> Text
                        </button>
                        <button 
                            onClick={() => handleTypeChange('number')}
                            className={`px-3 py-1.5 text-left text-xs hover:bg-gray-100 dark:hover:bg-gray-700 ${column.type === 'number' ? 'text-blue-500 font-medium' : 'text-gray-700 dark:text-gray-200'}`}
                        >
                            <span className="font-mono mr-2 text-gray-400">#</span> Number
                        </button>
                    </div>
                </>
            )}
        </div>
    );
}

function TableRow({ 
    row, 
    columns, 
    isLastRow, 
    autoFocus,
    onUpdate, 
    onCreateRow, 
    onDelete,
    onFocusDone
}: { 
    row: DatabaseRow; 
    columns: DatabaseColumn[]; 
    isLastRow: boolean; 
    autoFocus?: boolean;
    onUpdate: (data: any) => void; 
    onCreateRow: () => void; 
    onDelete: () => void;
    onFocusDone?: () => void;
}) {
    const [values, setValues] = useState(row.data);
    const firstInputRef = useRef<HTMLInputElement | null>(null);
    
    useEffect(() => {
        setValues(row.data);
    }, [row.data]);

    useEffect(() => {
        if (autoFocus && firstInputRef.current) {
            firstInputRef.current.focus();
            onFocusDone?.();
        }
    }, [autoFocus, onFocusDone]);

    const handleChange = (colId: string, val: string) => {
        setValues(prev => ({ ...prev, [colId]: val }));
    };

    const handleBlur = () => {
        if (JSON.stringify(values) !== JSON.stringify(row.data)) {
            onUpdate(values);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, colId: string) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            // 1. Save current row content
            if (JSON.stringify(values) !== JSON.stringify(row.data)) {
                onUpdate(values);
            }
            // 2. If it's the last row, create a new row
            if (isLastRow) {
                onCreateRow();
            }
        } else if (e.key === 'Tab') {
            e.preventDefault();
            const currentInput = e.currentTarget;
            const currentRow = currentInput.closest('tr');
            if (!currentRow) return;
            
            const allInputs = Array.from(currentRow.querySelectorAll('input'));
            const currentIndex = allInputs.indexOf(currentInput);
            
            if (!e.shiftKey) {
                // Tab -> Next
                if (currentIndex < allInputs.length - 1) {
                    // Same row, next cell
                    const next = allInputs[currentIndex + 1];
                    next.focus();
                    next.select();
                } else {
                    // Last cell in row -> Next row first cell
                    const nextRow = currentRow.nextElementSibling;
                    if (nextRow && nextRow.tagName === 'TR') {
                        const nextRowInputs = nextRow.querySelectorAll('input');
                        if (nextRowInputs.length > 0) {
                            const next = nextRowInputs[0] as HTMLInputElement;
                            next.focus();
                            next.select();
                        }
                    } else {
                        // Last row, last cell -> Create new row
                        if (isLastRow) {
                            onCreateRow();
                        }
                    }
                }
            } else {
                // Shift+Tab -> Prev
                if (currentIndex > 0) {
                     const prev = allInputs[currentIndex - 1];
                     prev.focus();
                     prev.select();
                } else {
                    // First cell in row -> Prev row last cell
                    const prevRow = currentRow.previousElementSibling;
                    if (prevRow && prevRow.tagName === 'TR') {
                        const prevRowInputs = prevRow.querySelectorAll('input');
                         if (prevRowInputs.length > 0) {
                            const prev = prevRowInputs[prevRowInputs.length - 1] as HTMLInputElement;
                            prev.focus();
                            prev.select();
                        }
                    }
                }
            }
        }
    };

    return (
        <tr className="group hover:bg-gray-50 dark:hover:bg-gray-700">
            {columns.map((col, index) => {
                const isNumber = col.type === 'number';
                return (
                    <td key={col.id} className="border-b border-r border-gray-200 dark:border-gray-700 px-0 py-0 h-8 relative">
                        <input
                            ref={index === 0 ? firstInputRef : undefined}
                            inputMode={isNumber ? 'decimal' : 'text'}
                            className={`absolute inset-0 w-full h-full px-3 py-1 bg-transparent outline-none text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 focus:ring-inset z-10 ${isNumber ? 'text-right tabular-nums' : 'text-left'}`}
                            value={values[col.id] || ''}
                            onChange={(e) => handleChange(col.id, e.target.value)}
                            onBlur={handleBlur}
                            onKeyDown={(e) => handleKeyDown(e, col.id)}
                        />
                    </td>
                );
            })}
            <td className="border-b border-gray-200 dark:border-gray-700 px-0 text-center w-10">
                <button 
                    onClick={onDelete}
                    className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-opacity p-1"
                    title="Delete Row"
                >
                    🗑
                </button>
            </td>
        </tr>
    );
}
