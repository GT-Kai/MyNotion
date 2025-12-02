import axios from 'axios';
import { Block } from '@my-notion/shared-types';

const client = axios.create({
  baseURL: 'http://localhost:3000',
});

export async function saveBlocksApi(pageId: string, blocks: Block[]) {
  const res = await client.put<Block[]>(`/api/pages/${pageId}/blocks`, blocks);
  return res.data;
}
