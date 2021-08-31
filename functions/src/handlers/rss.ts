import * as functions from 'firebase-functions';
import * as cheerio from 'cheerio';
import * as encoding from 'encoding-japanese';
import * as moment from 'moment-timezone';
import fetch from 'node-fetch';
import { htmlspecialchars } from '../utils/html';
import { createItemsXml } from '../utils/xml';

const url = 'http://hassya.net/melobo/bbs.cgi';

export interface ItemInterface {
  title: string;
  link: string;
  description: string;
  pubDate: string;
  guid: string;
}

export default async function (req: functions.https.Request, resp: functions.Response) {
  const res = await fetch(url, { method: 'GET' });
  const buffer = await res.buffer();
  const html = encoding.codeToString(encoding.convert(buffer, 'UNICODE', 'SJIS'));
  const $ = cheerio.load(html);

  const items = $('a[name]').map((i, elm) => {
    const allSubject = $(elm).find('.AllSubject').text();
    // const allName = $(elm).find('.AllName b').text();
    const allDate = $(elm).find('.AllDate').text();
    const allBody = $(elm).find('.AllBody').text();

    const [, id, title] = allSubject.match(/\[(\d+)\] (.+)/)!;
    const [, y, m, d] = allDate.match(/(\d+)\/(\d+)\/(\d+)/)!;
    const [, h, min] = allDate.match(/(\d+):(\d+)/)!;
    const body = allBody.replace(/\n$/, '').replace(/\n/g, '<br />').replace(//g, ' ');

    const date = moment.tz(`20${y}-${`0${m}`.slice(-2)}-${`0${d}`.slice(-2)} ${`0${h}`.slice(-2)}:${min}`, 'Asia/Tokyo').format('ddd, DD MMM YYYY HH:mm:00 ZZ');
    const link = htmlspecialchars(`${url}?page=&no=${id}&mode=one&id=&cmd=jmp`);

    const item: ItemInterface = {
      title,
      link,
      description: `<![CDATA[${body}]]>`,
      pubDate: date.toString(),
      guid: link,
    };

    return item;
  }).get();

  const RSS = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>めろでぃ～ぼーど 更新情報</title>
    <link>${htmlspecialchars(url)}</link>
    <description>めろでぃ～ぼーど：新着10件</description>
    <language>ja</language>
    <atom:link href="https://asia-northeast1-meloborss.cloudfunctions.net/rss" rel="self" type="application/rss+xml" />
${createItemsXml(items)}
  </channel>
</rss>`;

  resp.set('Content-Type', 'application/rss+xml').status(200).send(RSS);
}
