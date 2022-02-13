import url from 'url';
import { NextApiResponse, NextApiRequest } from 'next/types';

interface Request {
  url: NextApiRequest['url'];
}

interface Response {
  clearPreviewData: NextApiResponse['clearPreviewData'];
  writeHead: NextApiResponse['writeHead'];
  end: NextApiResponse['end'];
}

export default async function exit(req: Request, res: Response): Promise<void> {
  res.clearPreviewData();

  const queryObject = url.parse(req.url, true).query;
  const redirectUrl =
    queryObject && queryObject.currentUrl ? queryObject.currentUrl : '/';

  res.writeHead(307, { Location: redirectUrl });
  res.end();
}
