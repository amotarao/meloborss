import * as cheerio from "cheerio";
import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import { escapeHtmlSpecialCharacters } from "../utils/html";
import type { ItemInterface } from "../utils/types";
import { createItemsXml } from "../utils/xml";

dayjs.extend(utc);
dayjs.extend(timezone);

const url = "http://hassya.net/melobo/bbs.cgi";

const textDecoder = new TextDecoder("shift-jis");

export async function GET(): Promise<Response> {
  const res = await fetch(url, { method: "GET" });
  const arrayBuffer = await res.arrayBuffer();
  const html = textDecoder.decode(arrayBuffer);
  const $ = cheerio.load(html);

  const items = $("a[name]")
    .map((i, elm) => {
      const allSubject = $(elm).find(".AllSubject").text();
      // const allName = $(elm).find('.AllName b').text();
      const allDate = $(elm).find(".AllDate").text();
      const allBody = $(elm).find(".AllBody").text();

      const [, id, title] = allSubject.match(/\[(\d+)\] (.+)/) ?? [];
      const [, y, m, d] = allDate.match(/(\d+)\/(\d+)\/(\d+)/) ?? [];
      const [, h, min] = allDate.match(/(\d+):(\d+)/) ?? [];
      const body = allBody
        .replace(/\n$/, "")
        .replace(/\n/g, "<br />")
        // biome-ignore lint: わからんけど昔からあったから必要なんでしょう
        .replace(//g, " ");

      const date = dayjs
        .tz(
          `${y}-${`0${m}`.slice(-2)}-${`0${d}`.slice(-2)} ${`0${h}`.slice(-2)}:${min}`,
          "Asia/Tokyo",
        )
        .tz("Asia/Tokyo")
        .format("ddd, DD MMM YYYY HH:mm:00 ZZ");
      const link = escapeHtmlSpecialCharacters(
        `${url}?page=&no=${id}&mode=one&id=&cmd=jmp`,
      );

      const item: ItemInterface = {
        title: `<![CDATA[${title}]]>`,
        link,
        description: `<![CDATA[${body}]]>`,
        pubDate: date.toString(),
        guid: link,
      };

      return item;
    })
    .get();

  const RSS = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>めろでぃ～ぼーど 更新情報</title>
    <link>${escapeHtmlSpecialCharacters(url)}</link>
    <description>めろでぃ～ぼーど：新着10件</description>
    <language>ja</language>
    <atom:link href="https://asia-northeast1-meloborss.cloudfunctions.net/rss" rel="self" type="application/rss+xml" />
${createItemsXml(items)}
  </channel>
</rss>`;

  return new Response(RSS, {
    status: 200,
    headers: {
      "Content-Type": 'application/xml; charset="UTF-8"',
    },
  });
}
