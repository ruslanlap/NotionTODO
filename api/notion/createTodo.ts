import { NextApiRequest, NextApiResponse } from 'next';
import { Client } from '@notionhq/client';

const notion = new Client({ auth: process.env.NOTION_API_KEY });

export default async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const { text } = req.body;
  const pageId = process.env.YOUR_PAGE_ID;

  try {
    const response = await notion.blocks.children.append({
      block_id: pageId!,
      children: [
        {
          object: 'block',
          type: 'to_do',
          to_do: {
            rich_text: [{ text: { content: text } }],
            checked: false,
          },
        },
      ],
    });

    const newBlock = response.results[0];
    res.status(200).json({
      id: newBlock.id,
      text,
      completed: false,
      createdAt: new Date(newBlock.created_time).getTime(),
    });
  } catch (error: any) {
    console.error('Error creating todo:', error);
    res.status(500).json({ error: 'Failed to create todo' });
  }
};
