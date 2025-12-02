import axios from 'axios';
import { Page, Block } from '@my-notion/shared-types';

const client = axios.create({
  baseURL: 'http://localhost:3000',
});

export interface PageDetail {
  page: Page;
  blocks: Block[];
}

export async function fetchPages(): Promise<Page[]> {
  const res = await client.get<Page[]>('/api/pages');
  return res.data;
}

export async function fetchPage(id: string): Promise<PageDetail> {
  const res = await client.get<PageDetail>(`/api/pages/${id}`);
  return res.data;
}

export async function createPage(data: { title?: string; type?: string; parentId?: string | null; }) {
  const res = await client.post<Page>('/api/pages', data);
  return res.data;
}

export async function updatePage(id: string, data: Partial<Page>) {
  const res = await client.patch(`/api/pages/${id}`, data);
  return res.data;
}

export interface Backlink {
  pageId: string;
  pageTitle: string;
  blockId: string;
  preview: string;
}

export async function fetchBacklinks(pageId: string): Promise<Backlink[]> {
  const res = await client.get<{ backlinks: Backlink[] }>(`/api/pages/${pageId}/backlinks`);
  return res.data.backlinks;
}
