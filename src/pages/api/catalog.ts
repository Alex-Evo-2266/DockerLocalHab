import type { NextApiRequest, NextApiResponse } from 'next';

type CatalogResponse = {
  repositories: string[];
};

type ErrorResponse = {
  error: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<CatalogResponse | ErrorResponse>
) {
  const registryUrl = process.env.REGISTRY_URL;
  if (!registryUrl) {
    return res.status(500).json({ error: 'REGISTRY_URL not set' });
  }

  try {
    const response = await fetch(`${registryUrl}/v2/_catalog`);
    if (!response.ok) {
      return res.status(response.status).json({ error: 'Registry request failed' });
    }
    const data: CatalogResponse = await response.json();
    res.status(200).json(data);
  }  catch (err: unknown) {
    if (err instanceof Error) {
      res.status(500).json({ error: err.message });
    } else {
      console.error(String(err));
    }
  }
}
