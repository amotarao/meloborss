import * as functions from 'firebase-functions';
import rssHandler from './handlers/rss';

export const rss = functions
  .region('asia-northeast1')
  .runWith({ memory: '512MB', timeoutSeconds: 10 })
  .https.onRequest(rssHandler);
