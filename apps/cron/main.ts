import c from "chalk";
import { POPULARITY, REALTIME_KEY, SITES } from "@twidro/consts";
import { TwidougaService } from "./services/twidouga/index.ts";
import { TwivideoService } from "./services/twivideo/index.ts";
import { TwiflixService } from "./services/twiflix/index.ts";
import { TwiigleService } from "./services/twiigle/index.ts";
import { Video } from "@twidro/types";

// Note: 前提として、データは持続性のある物では無いのでグローバルに置くことにする
const kv = await Deno.openKv();

const services = [
  new TwidougaService(),
  new TwivideoService(),
  new TwiflixService(),
  new TwiigleService(),
];

Deno.cron("TWIDRO CRON REALTIME", "*/1 * * * *", async () => {
  const realtimeKeys = await kv.list({ prefix: [REALTIME_KEY] });
  for await (const key of realtimeKeys) {
    await kv.delete(key.key);
  }

  console.log(
    `${c.blue("[TWIDRO CRON]")} Cron job started at ${new Date().toISOString()}`
  );

  const realtimeVideos: Video<SITES>[] = [];
  for (const service of services) {
    const videos = await service.getRealtime();
    console.log(
      `${c.blue("[TWIDRO CRON]")} '${service.constructor.name}' fetched ${
        videos.length
      } videos`
    );
    realtimeVideos.push(...videos);
  }

  const scoredVideos = realtimeVideos.map((video, index) => ({
    video,
    index,
  }));

  const sorted = scoredVideos
    .sort((a, b) => {
      const diff = POPULARITY[b.video.type] - POPULARITY[a.video.type];
      if (diff !== 0) return diff;
      // Note: 新しいほど優先
      return a.index - b.index;
    })
    .map((item) => item.video);

  console.log(`${c.blue("[TWIDRO CRON]")} Sorted ${sorted.length} videos`);

  for (const [index, video] of sorted.entries()) {
    await kv.set([REALTIME_KEY, index], video);
  }
});
