import { NextApiRequest, NextApiResponse } from 'next';
import { Client } from '@notionhq/client';

const notion = new Client({ auth: process.env.NOTION_API_KEY });

export default async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== 'PATCH') {
    res.setHeader('Allow', ['PATCH']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const { id, text, completed } = req.body;

  try {
    const updateData: any = { to_do: {} };

    if (text !== undefined) {
      updateData.to_do.rich_text = [{ text: { content: text } }];
    }

    if (completed !== undefined) {
      updateData.to_do.checked = completed;
    }

    await notion.blocks.update({
      block_id: id,
      ...updateData,
    });

    res.status(200).json({ success: true });
  } catch (error: any) {
    console.error('Error updating todo:', error);
    res.status(500).json({ error: 'Failed to update todo' });
  }
};
