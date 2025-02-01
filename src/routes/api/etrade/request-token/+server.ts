import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import OAuth from 'oauth';

const SANDBOX_BASE_URL = 'https://apisb.etrade.com';
const CALLBACK_URL = 'http://localhost:5173/auth/etrade/callback';

export const GET: RequestHandler = async () => {
  const oauth = new OAuth.OAuth(
    `${SANDBOX_BASE_URL}/oauth/request_token`,
    `${SANDBOX_BASE_URL}/oauth/access_token`,
    import.meta.env.VITE_ETRADE_API_KEY,
    import.meta.env.VITE_ETRADE_API_SECRET,
    '1.0A',
    CALLBACK_URL,
    'HMAC-SHA1'
  );

  return new Promise((resolve) => {
    oauth.getOAuthRequestToken((error, token, secret) => {
      if (error) {
        resolve(json({ error: 'Failed to get request token' }, { status: 500 }));
      } else {
        const authorizeUrl = `${SANDBOX_BASE_URL}/oauth/authorize?key=${import.meta.env.VITE_ETRADE_API_KEY}&token=${token}`;
        resolve(json({ authorizeUrl }));
      }
    });
  });
}; 