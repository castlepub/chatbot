import type { NextApiRequest, NextApiResponse } from 'next';

export default function handler(_req: NextApiRequest, res: NextApiResponse) {
  const tz = process.env.TZ || 'Europe/Berlin';
  res.status(200).json({ status: 'OK', tz });
}
