import { VercelRequest, VercelResponse } from '@vercel/node';
import cors from 'cors';

const corsMiddleware = cors({
  origin: ['https://doit-tau.vercel.app', 'http://localhost:3000'],
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Notion-Version'],
  credentials: true
});

export function runMiddleware(
  req: VercelRequest,
  res: VercelResponse,
  fn: Function
) {
  return new Promise((resolve, reject) => {
    fn(req, res, (result: any) => {
      if (result instanceof Error) {
        return reject(result);
      }
      return resolve(result);
    });
  });
}

export async function handleCors(req: VercelRequest, res: VercelResponse) {
  await runMiddleware(req, res, corsMiddleware);
}