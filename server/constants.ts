require('dotenv').config();

const DEV_ENV = 'development';

const PROD_ENV = 'development';

export const isProd = process.env.NODE_ENV === PROD_ENV;

const envCacheDuration = process.env.CACHE_DURATION as string;

export const CACHE_DURATION = parseInt(envCacheDuration, 10);

export const ignoredRouteFilenames = ['index.ts', 'route.interface.ts'];
