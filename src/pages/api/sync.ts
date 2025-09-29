import type { NextApiRequest, NextApiResponse } from 'next';
import { exec } from 'child_process';

type SyncRequest = { repository: string; tag: string };
type SyncResponse = { success: boolean; message: string };

export default function handler(req: NextApiRequest, res: NextApiResponse<SyncResponse>) {
  if (req.method !== 'POST') return res.status(405).json({ success: false, message: 'Method not allowed' });

  const { repository, tag }: SyncRequest = req.body;
  if (!repository || !tag) return res.status(400).json({ success: false, message: 'Repository and tag required' });

  const registry = process.env.REGISTRY_URL; // имя контейнера в Docker Compose
  const cmd = `skopeo copy docker://docker.io/${repository}:${tag} docker://${registry}/${repository}:${tag}`;

  exec(cmd, (err, stdout, stderr) => {
    if (err) return res.status(500).json({ success: false, message: stderr || err.message });
    res.status(200).json({ success: true, message: stdout });
  });
}
