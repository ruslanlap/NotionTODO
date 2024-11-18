// src/types.ts
// import type { Client } from '@notionhq/client';

export interface Todo {
  id: string;
  text: string;
  completed: boolean;
  createdAt: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
}
