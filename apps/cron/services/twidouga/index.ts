import { BaseService } from "../base.ts";
import type { Video } from "@twidro/types";
import { JSDOM } from "jsdom";
import { POPULARITY, RANKING_KEY, SITES } from "@twidro/consts";
import { RANKING_1D_KEY, RANKING_3D_KEY, RANKING_1W_KEY } from "@twidro/consts";

const fetchRealtimeVideos = async (page: number) => {
  let source: string = "";

  for (let cur = 1; cur <= page; cur++) {
    const res = await fetch(
      "https://www.twidouga.net/jp/realtime_t1.php?page=" + cur,
      {
        "headers": {
          "accept": "text/html, */*; q=0.01",
          "accept-language": "ja-JP,ja;q=0.9",
          "cache-control": "no-cache",
          "pragma": "no-cache",
          "priority": "u=1, i",
          "sec-ch-ua":
            '"Chromium";v="136", "Google Chrome";v="136", "Not.A/Brand";v="99"',
          "sec-ch-ua-mobile": "?0",
          "sec-ch-ua-platform": '"Windows"',
          "sec-fetch-dest": "empty",
          "sec-fetch-mode": "cors",
          "sec-fetch-site": "same-origin",
          "x-requested-with": "XMLHttpRequest",
          "Referer": "https://www.twidouga.net/jp/realtime_t1.php",
          "Referrer-Policy": "strict-origin-when-cross-origin",
        },
        "body": null,
        "method": "GET",
      },
    );

    if (!res.ok) {
      continue;
    }

    const text = await res.text();

    source += text;
  }

  const doc = new JSDOM(source).window.document;
  return Array.from(doc.querySelectorAll("#container > div.item"));
};

const fetchTrendingVideos = async (range: RANKING_KEY) => {
  const endpoint = {
    [RANKING_1D_KEY]: "ranking_t1.php",
    [RANKING_3D_KEY]: "ranking_tweek.php",
    [RANKING_1W_KEY]: "ranking_tmonth.php",
  };
  const res = await fetch("https://www.twidouga.net/jp/" + endpoint[range], {
    "headers": {
      "accept":
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
      "accept-language": "ja-JP,ja;q=0.9",
      "cache-control": "no-cache",
      "pragma": "no-cache",
      "priority": "u=0, i",
      "sec-ch-ua":
        '"Chromium";v="136", "Google Chrome";v="136", "Not.A/Brand";v="99"',
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-platform": '"Windows"',
      "sec-fetch-dest": "document",
      "sec-fetch-mode": "navigate",
      "sec-fetch-site": "same-origin",
      "sec-fetch-user": "?1",
      "upgrade-insecure-requests": "1",
      "Referer": "https://www.twidouga.net/jp/" + endpoint[range],
      "Referrer-Policy": "strict-origin-when-cross-origin",
    },
    "body": null,
    "method": "GET",
  });

  if (!res.ok) {
    throw new Error("Failed to fetch trending videos");
  }

  const text = await res.text();
  const doc = new JSDOM(text).window.document;
  return Array.from(doc.querySelectorAll(".gazou"));
};

const parseRealtimeVideoData = (data: Element[]): Video<SITES.TWIDOUGA>[] => {
  const videos: Video<SITES.TWIDOUGA>[] = [];

  for (const item of data) {
    const videoUrl = item.querySelector("a[href]")?.getAttribute("href");
    const thumbnailUrl = item.querySelector("img[src]")?.getAttribute("src");
    const link = item.querySelector(".saisei > a[href]")?.getAttribute("href");

    if (!videoUrl || !thumbnailUrl || !link) {
      continue;
    }

    videos.push({
      type: SITES.TWIDOUGA,
      videoUrl,
      thumbnailUrl,
      link,
    });
  }

  return videos;
};

const parseTrendingVideoData = (data: Element[]): Video<SITES.TWIDOUGA>[] => {
  const videos: Video<SITES.TWIDOUGA>[] = [];

  for (const item of data) {
    const videoUrl = item.querySelector("a[href]")?.getAttribute("href");
    const thumbnailUrl = item.querySelector("img[src]")?.getAttribute("src");

    if (!videoUrl || !thumbnailUrl) {
      continue;
    }

    if (videoUrl.includes("b-short")) {
      continue;
    }

    videos.push({
      type: SITES.TWIDOUGA,
      videoUrl,
      thumbnailUrl,
      link: undefined,
    });
  }
  return videos;
};

export class TwidougaService extends BaseService<SITES.TWIDOUGA> {
  priority = POPULARITY.TWIDOUGA;

  async getRealtime(): Promise<Video<SITES.TWIDOUGA>[]> {
    const data = await fetchRealtimeVideos(5);
    return parseRealtimeVideoData(data);
  }

  async getTrending(range: RANKING_KEY): Promise<Video<SITES.TWIDOUGA>[]> {
    const data = await fetchTrendingVideos(range);
    return parseTrendingVideoData(data);
  }
}
