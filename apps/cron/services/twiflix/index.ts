import { BaseService } from "../base.ts";
import type { Video } from "@twidro/types";
import { JSDOM } from "jsdom";
import { POPULARITY, SITES } from "@twidro/consts";

const fetchVideos = async (type: string) => {
  const res = await fetch("https://twiflix.jp/" + type, {
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
      "sec-fetch-site": "cross-site",
      "sec-fetch-user": "?1",
      "upgrade-insecure-requests": "1",
    },
    referrer: "https://twiflix.jp/",
    referrerPolicy: "strict-origin-when-cross-origin",
    body: null,
    method: "GET",
    mode: "cors",
    credentials: "include",
  });

  if (!res.ok) {
    throw new Error("Failed to fetch videos");
  }

  const text = await res.text();
  const doc = new JSDOM(text).window.document;
  return Array.from(doc.querySelectorAll(".twitter__container.post-card"));
};

const parseVideoData = (data: Element[]): Video<SITES.TWIFLIX>[] => {
  const videos: Video<SITES.TWIFLIX>[] = [];

  for (const item of data) {
    const videoUrl = item
      .querySelector("video > source[src]")
      ?.getAttribute("src");
    const thumbnailUrl = item
      .querySelector("video[poster]")
      ?.getAttribute("poster");
    const link = item
      .querySelector(".twitter__icon > a[href].no-color-change")
      ?.getAttribute("href");

    if (!videoUrl || !thumbnailUrl || !link) {
      continue;
    }

    videos.push({
      type: SITES.TWIFLIX,
      videoUrl,
      thumbnailUrl,
      link,
    });
  }

  return videos;
};

export class TwiflixService extends BaseService<SITES.TWIFLIX> {
  priority = POPULARITY.TWIFLIX;

  async getRealtime(): Promise<Video<SITES.TWIFLIX>[]> {
    const data = await fetchVideos("recent");
    return parseVideoData(data);
  }

  async getTrending(): Promise<Video<SITES.TWIFLIX>[]> {
    const data = await fetchVideos("popular");
    return parseVideoData(data);
  }
}
