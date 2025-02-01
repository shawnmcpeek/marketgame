import { redirect } from '@sveltejs/kit';
import type { LayoutLoad } from './$types';

export const load: LayoutLoad = async ({ url }) => {
  const unprotectedRoutes = ['/', '/auth', '/auth/register'];
  const path = url.pathname;

  // Pass the path to the layout component
  return {
    path
  };
}; 