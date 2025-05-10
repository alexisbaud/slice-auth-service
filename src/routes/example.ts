// src/routes/example.ts
import { Hono } from 'hono';
import { ExampleType } from '@/types';

const exampleRoutes = new Hono();

const mockData: ExampleType[] = [
  { id: '1', name: 'Example Item 1', value: 100 },
  { id: '2', name: 'Example Item 2', value: 200 },
  { id: '3', name: 'Example Item 3', value: 300 },
];

/**
 * GET /example
 * Returns a list of mock example data.
 */
exampleRoutes.get('/', (c: import('hono').Context) => {
  return c.json(mockData);
});

export default exampleRoutes; 