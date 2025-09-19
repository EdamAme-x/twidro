import { BaseService } from "../base.ts";
import type { Video } from "@twidro/types";
import { JSDOM } from "jsdom";
import { POPULARITY, SITES } from "@twidro/consts";

const fetchVideos = async (type: string) => {
  const res = await fetch("https://twiigle.com/" + type + ".html", {
    headers: {
      accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
      "accept-language": "ja-JP,ja;q=0.9",
      "cache-control": "no-cache",
      pragma: "no-cache",
      priority: "u=0, i",
      "sec-ch-ua":
        '"Chromium";v="136", "Google Chrome";v="136", "Not.A/Brand";v="99"',
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-platform": '"Windows"',
      "sec-fetch-dest": "document",
      "sec-fetch-mode": "navigate",
      "sec-fetch-site": "same-origin",
      "sec-fetch-user": "?1",
      "upgrade-insecure-requests": "1",
      Referer: "https://twiigle.com/",
      "Referrer-Policy": "strict-origin-when-cross-origin",
    },
    body: null,
    method: "GET",
  });

  if (!res.ok) {
    throw new Error("Failed to fetch videos");
  }

  const text = await res.text();
  const doc = new JSDOM(text).window.document;
  return Array.from(doc.querySelectorAll("div.item_inner"));
};

const parseVideoData = (data: Element[]): Video<SITES.TWIIGLE>[] => {
  const videos: Video<SITES.TWIIGLE>[] = [];

  for (const item of data) {
    const videoUrl = item
      .querySelector("a[href].item_link")
      ?.getAttribute("href");
    const thumbnailUrl = item.querySelector("img[src]")?.getAttribute("src");
    let link = item
      .querySelector("div.tw_icon > a[href]")
      ?.getAttribute("href");

    if (!videoUrl || !thumbnailUrl || !link) {
      continue;
    }

    if (/^\d+$/.test(link)) {
      link = undefined;
    }

    videos.push({
      type: SITES.TWIIGLE,
      videoUrl: videoUrl.replace(
        "https://twiigle.com/contents.html#contents=",
        "",
      ),
      thumbnailUrl,
      link,
    });
  }

  return videos;
};

export class TwiigleService extends BaseService<SITES.TWIIGLE> {
  priority = POPULARITY.TWIIGLE;

  async getRealtime(): Promise<Video<SITES.TWIIGLE>[]> {
    const data = await fetchVideos("realtime");
    return parseVideoData(data);
  }

  async getTrending(): Promise<Video<SITES.TWIIGLE>[]> {
    const data = await fetchVideos("index");
    return parseVideoData(data);
  }
}
