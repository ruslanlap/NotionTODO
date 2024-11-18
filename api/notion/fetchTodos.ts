import { NextApiRequest, NextApiResponse } from 'next';
import { Client } from '@notionhq/client';

const notion = new Client({ auth: process.env.NOTION_API_KEY });

export default async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const pageId = process.env.YOUR_PAGE_ID;
  try {
    const response = await notion.blocks.children.list({ block_id: pageId! });

    const todos = response.results
      .filter((block: any) => block.type === 'to_do')
      .map((block: any) => ({
        id: block.id,
        text: block.to_do.rich_text[0]?.text?.content || '',
        completed: block.to_do.checked || false,
        createdAt: new Date(block.created_time).getTime(),
      }));

    res.status(200).json(todos);
  } catch (error: any) {
    console.error('Error fetching todos:', error);
    res.status(500).json({ error: 'Failed to fetch todos' });
  }
};
