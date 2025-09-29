import type { NextApiRequest, NextApiResponse } from 'next';

type TagsResponse = {
  name: string;
  tags: string[];
};

type ErrorResponse = {
  error: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<TagsResponse | ErrorResponse>
) {
  const { repo } = req.query;
  const registryUrl = process.env.REGISTRY_URL;

  if (!registryUrl) return res.status(500).json({ error: 'REGISTRY_URL not set' });
  if (!repo || Array.isArray(repo)) return res.status(400).json({ error: 'Invalid repo name' });

  try {
    const response = await fetch(`${registryUrl}/v2/${repo}/tags/list`);
    if (!response.ok) {
      return res.status(response.status).json({ error: 'Failed to fetch tags' });
    }
    const data: TagsResponse = await response.json();
    res.status(200).json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}
