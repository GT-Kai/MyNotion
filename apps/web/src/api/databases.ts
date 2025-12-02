import { Database, DatabaseDetails, DatabaseRow, DatabaseColumn } from '@my-notion/shared-types';

const API_BASE = 'http://localhost:3000/api';

export async function createDatabase(pageId: string, title?: string): Promise<Database> {
  const res = await fetch(`${API_BASE}/databases`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pageId, title }),
  });
  if (!res.ok) throw new Error('Failed to create database');
  return res.json();
}

export async function fetchDatabase(id: string): Promise<DatabaseDetails> {
  const res = await fetch(`${API_BASE}/databases/${id}`);
  if (!res.ok) throw new Error('Failed to fetch database');
  return res.json();
}

export async function createRow(databaseId: string): Promise<DatabaseRow> {
  const res = await fetch(`${API_BASE}/databases/${databaseId}/rows`, {
    method: 'POST',
  });
  if (!res.ok) throw new Error('Failed to create row');
  return res.json();
}

export async function updateRow(rowId: string, data: Record<string, any>): Promise<void> {
  const res = await fetch(`${API_BASE}/database-rows/${rowId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ data }),
  });
  if (!res.ok) throw new Error('Failed to update row');
}

export async function deleteRow(rowId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/database-rows/${rowId}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to delete row');
}

export async function createColumn(databaseId: string): Promise<DatabaseColumn> {
  const res = await fetch(`${API_BASE}/databases/${databaseId}/columns`, {
    method: 'POST',
  });
  if (!res.ok) throw new Error('Failed to create column');
  return res.json();
}

export async function updateColumn(colId: string, name: string): Promise<void> {
  const res = await fetch(`${API_BASE}/database-columns/${colId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  });
  if (!res.ok) throw new Error('Failed to update column');
}
