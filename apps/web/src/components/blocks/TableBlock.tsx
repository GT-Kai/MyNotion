import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchDatabase, updateRow, createRow, createColumn, updateColumn, deleteRow } from '../../api/databases';
import { DatabaseRow, DatabaseColumn } from '@my-notion/shared-types';

interface TableBlockProps {
  databaseId: string;
}

export function TableBlock({ databaseId }: TableBlockProps) {
  const queryClient = useQueryClient();
  const { data, isLoading, error } = useQuery(['database', databaseId], () => fetchDatabase(databaseId));

  const updateRowMutation = useMutation({
    mutationFn: (vars: { rowId: string; data: any }) => updateRow(vars.rowId, vars.data),
    onSuccess: () => {
      queryClient.invalidateQueries(['database', databaseId]);
    }
  });

  const createRowMutation = useMutation({
    mutationFn: () => createRow(databaseId),
    onSuccess: () => {
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
    onSuccess: () => {
      queryClient.invalidateQueries(['database', databaseId]);
    }
  });

  const updateColumnMutation = useMutation({
    mutationFn: (vars: { colId: string; name: string }) => updateColumn(vars.colId, vars.name),
    onSuccess: () => {
      queryClient.invalidateQueries(['database', databaseId]);
    }
  });

  if (isLoading) return <div className="text-gray-400 p-2 text-sm">Loading table...</div>;
  if (error) return <div className="text-red-400 p-2 text-sm">Error loading table</div>;
  if (!data) return null;

  const { columns, rows } = data;

  return (
    <div className="overflow-x-auto border rounded-md border-gray-200 dark:border-gray-700 my-2 shadow-sm">
      <table className="w-full text-sm border-collapse bg-white dark:bg-gray-800 table-fixed">
        <thead>
          <tr>
            {columns.map(col => (
              <th key={col.id} className="border-b border-r border-gray-200 dark:border-gray-700 px-0 py-0 text-left font-medium text-gray-500 dark:text-gray-400 w-[200px] relative h-8">
                <TableColumnHeader column={col} onUpdate={(name) => updateColumnMutation.mutate({ colId: col.id, name })} />
              </th>
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
        </thead>
        <tbody>
          {rows.map(row => (
            <TableRow 
                key={row.id} 
                row={row} 
                columns={columns} 
                onUpdate={(newData) => updateRowMutation.mutate({ rowId: row.id, data: newData })}
                onDelete={() => deleteRowMutation.mutate(row.id)}
            />
          ))}
          <tr>
             <td colSpan={columns.length + 1} className="p-1 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
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
  );
}

function TableColumnHeader({ column, onUpdate }: { column: DatabaseColumn, onUpdate: (name: string) => void }) {
    const [name, setName] = useState(column.name);
    
    useEffect(() => {
        setName(column.name);
    }, [column.name]);

    const handleBlur = () => {
        if (name !== column.name) {
            onUpdate(name);
        }
    };

    return (
        <input
            className="w-full h-full px-3 py-2 bg-transparent outline-none text-sm font-medium text-gray-600 dark:text-gray-300 focus:bg-gray-100 dark:focus:bg-gray-700"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={handleBlur}
        />
    );
}

function TableRow({ row, columns, onUpdate, onDelete }: { row: DatabaseRow, columns: DatabaseColumn[], onUpdate: (data: any) => void, onDelete: () => void }) {
    const [values, setValues] = useState(row.data);
    
    useEffect(() => {
        setValues(row.data);
    }, [row.data]);

    const handleChange = (colId: string, val: string) => {
        setValues(prev => ({ ...prev, [colId]: val }));
    };

    const handleBlur = () => {
        if (JSON.stringify(values) !== JSON.stringify(row.data)) {
            onUpdate(values);
        }
    };

    return (
        <tr className="group hover:bg-gray-50 dark:hover:bg-gray-700">
            {columns.map(col => (
                <td key={col.id} className="border-b border-r border-gray-200 dark:border-gray-700 px-0 py-0 h-8 relative">
                    <input
                        className="absolute inset-0 w-full h-full px-3 py-1 bg-transparent outline-none text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 focus:ring-inset z-10"
                        value={values[col.id] || ''}
                        onChange={(e) => handleChange(col.id, e.target.value)}
                        onBlur={handleBlur}
                    />
                </td>
            ))}
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
