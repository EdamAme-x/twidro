import { BaseService } from "../base.ts";
import type { Video } from "@twidro/types";
import { JSDOM } from "jsdom";
import { POPULARITY, SITES, type RANKING_KEY } from "@twidro/consts";
import { RANKING_1D_KEY, RANKING_3D_KEY } from "@twidro/consts";

const fetchVideos = async (
  count: number,
  params: { type: string; order: string; ty: string },
) => {
  const res = await fetch("https://twivideo.net/templates/view_lists.php", {
    headers: {
      accept: "*/*",
      "accept-language": "ja-JP,ja;q=0.9",
      "cache-control": "no-cache",
      "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
      pragma: "no-cache",
      priority: "u=1, i",
      "sec-ch-ua":
        '"Chromium";v="136", "Google Chrome";v="136", "Not.A/Brand";v="99"',
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-platform": '"Windows"',
      "sec-fetch-dest": "empty",
      "sec-fetch-mode": "cors",
      "sec-fetch-site": "same-origin",
      "x-requested-with": "XMLHttpRequest",
    },
    referrer: `https://twivideo.net/?${
      params.type === "0" ? "realtime" : "ranking"
    }`,
    referrerPolicy: "strict-origin-when-cross-origin",
    body:
      `offset=0&limit=${count}&tag=null&type=${params.type}&order=${params.order}&le=1000&ty=${params.ty}${
        params.type === "ranking" ? "&offset_int=0" : ""
      }`,
    method: "POST",
    mode: "cors",
    credentials: "include",
  });

  if (!res.ok) {
    throw new Error("Failed to fetch videos");
  }

  const doc = new JSDOM(await res.text()).window.document;
  return Array.from(doc.querySelectorAll("div.item_inner"));
};

const parseVideoData = (data: Element[]): Video<SITES.TWIVIDEO>[] => {
  const videos: Video<SITES.TWIVIDEO>[] = [];

  for (const item of data) {
    const videoUrl = item.querySelector("a[href].item_link")?.getAttribute(
      "href",
    );
    const thumbnailUrl = item.querySelector("img[src]")?.getAttribute("src");
    const link = item.querySelector("div.tw_icon > a[href]")?.getAttribute(
      "href",
    );

    if (!videoUrl || !thumbnailUrl || !link) {
      continue;
    }

    videos.push({
      type: SITES.TWIVIDEO,
      videoUrl,
      thumbnailUrl,
      link,
    });
  }

  return videos;
};

export class TwivideoService extends BaseService<SITES.TWIVIDEO> {
  priority = POPULARITY.TWIVIDEO;

  async getRealtime(): Promise<Video<SITES.TWIVIDEO>[]> {
    const data = await fetchVideos(500, {
      type: "0",
      order: "post_date",
      ty: "p4",
    });
    return parseVideoData(data);
  }

  async getTrending(range: RANKING_KEY): Promise<Video<SITES.TWIVIDEO>[]> {
    const data = await fetchVideos(500, {
      type: "ranking",
      order: range === RANKING_1D_KEY ? "24" : range === RANKING_3D_KEY ? "72" : "168",
      ty: "p6",
    });
    return parseVideoData(data);
  }
}
