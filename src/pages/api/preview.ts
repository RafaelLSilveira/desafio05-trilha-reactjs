import { Document } from '@prismicio/client/types/documents';
import { NextApiResponse, NextApiRequest } from 'next/types';
import { getPrismicClient } from '../../services/prismic';

function linkResolver(doc: Document): string {
  if (doc.type === 'posts') {
    return `/post/${doc.uid}`;
  }
  return '/';
}

interface Request {
  query: NextApiRequest['query'];
}

interface Response {
  status: NextApiResponse['status'];
  setPreviewData: NextApiResponse['setPreviewData'];
  write: NextApiResponse['write'];
  end: NextApiResponse['end'];
}

export default async (req: Request, res: Response): Promise<void> => {
  const { token: ref, documentId } = req.query;
  const prismic = getPrismicClient();

  const redirectUrl = await prismic
    .getPreviewResolver(String(ref), String(documentId))
    .resolve(linkResolver, '/');

  if (!redirectUrl || redirectUrl === null) {
    return res.status(401).json({ message: 'Invalid Token' });
  }

  res.setPreviewData({ ref });

  res.write(
    `<!DOCTYPE html><html><head><meta http-equiv="Refresh" content="0; url=${redirectUrl}" />
    <script>window.location.href = '${redirectUrl}'</script>
    </head>`
  );
  res.end();

  return null;
};
