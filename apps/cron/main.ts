import c from "chalk";
import {
  POPULARITY,
  RANKING_KEY,
  RANKING_KEYS,
  REALTIME_KEY,
  SITES,
} from "@twidro/consts";
import { TwidougaService } from "./services/twidouga/index.ts";
import { TwivideoService } from "./services/twivideo/index.ts";
import { TwiflixService } from "./services/twiflix/index.ts";
import { TwiigleService } from "./services/twiigle/index.ts";
import { Video } from "@twidro/types";
import { deleteByPrefix } from "./utils/kv.ts";
import { Hono } from "hono";

// 注意: 前提として、データは持続性のある物では無いのでグローバルに置くことにする
const kv = await Deno.openKv();
const app = new Hono();

app.get("/health", (c) => c.text("OK"));
app.get("/realtime", async (c) => {
  const realtimeVideos = [];
  for await (const entry of kv.list({ prefix: [REALTIME_KEY] })) {
    realtimeVideos.push(entry.value);
  }
  return c.json(realtimeVideos);
});
app.get("/ranking/:key", async (c) => {
  const key = c.req.param("key");
  if (!RANKING_KEYS.includes(key as RANKING_KEY)) {
    return c.json({ error: "Invalid ranking key" }, 400);
  }
  const rankingVideos = [];
  for await (const entry of kv.list({ prefix: [key] })) {
    rankingVideos.push(entry.value);
  }
  return c.json(rankingVideos);
});
app.onError((err, c) => {
  console.error(c.req.url, err);
  return c.json({ error: "Internal server error" }, 500);
});
app.notFound((c) => c.json({ error: "Not found" }, 404));

type WithMeta = {
  video: Video<SITES>;
  index: number;
  serviceIndex: number;
  score?: number;
};

function calcScore(item: WithMeta) {
  const typeWeight = POPULARITY[item.video.type] ?? 1;
  const posWeight = 1 / (item.index + 1); // index=0 が最強
  return typeWeight * posWeight;
}

function deterministicSort(a: WithMeta, b: WithMeta) {
  // 先に score 比較（降順）
  if (a.score! !== b.score!) return b.score! - a.score!;
  // score が同じなら serviceIndex（昇順）
  if (a.serviceIndex !== b.serviceIndex) return a.serviceIndex - b.serviceIndex;
  // さらに同じなら元の index（昇順）
  return a.index - b.index;
}

const services = [
  new TwidougaService(),
  new TwivideoService(),
  new TwiflixService(),
  new TwiigleService(),
];

Deno.cron("TWIDRO CRON REALTIME", "*/1 * * * *", async () => {
  console.log(
    `${c.blue(
      "[TWIDRO CRON]"
    )} Cron realtime job started at ${new Date().toISOString()}`
  );
  await deleteByPrefix(kv, [REALTIME_KEY]);

  const realtimeWithMeta: WithMeta[] = [];
  for (const [svcIdx, service] of services.entries()) {
    const videos = await service.getRealtime();
    console.log(
      `${c.blue("[TWIDRO CRON]")} '${service.constructor.name}' fetched ${
        videos.length
      } videos`
    );
    realtimeWithMeta.push(
      ...videos.map((v, i) => ({ video: v, index: i, serviceIndex: svcIdx }))
    );
  }

  for (const item of realtimeWithMeta) {
    item.score = calcScore(item);
  }

  // ソート
  const sorted = realtimeWithMeta.sort(deterministicSort).map((x) => x.video);

  console.log(`${c.blue("[TWIDRO CRON]")} Sorted ${sorted.length} videos`);
  for (const [index, video] of sorted.entries()) {
    await kv.set([REALTIME_KEY, index], video);
  }
});

Deno.cron("TWIDRO CRON RANKING", "*/10 * * * *", async () => {
  console.log(
    `${c.blue(
      "[TWIDRO CRON]"
    )} Cron ranking job started at ${new Date().toISOString()}`
  );

  for (const rankingKey of RANKING_KEYS) {
    await deleteByPrefix(kv, [rankingKey]);

    const rankingWithMeta: WithMeta[] = [];
    for (const [svcIdx, service] of services.entries()) {
      const videos = await service.getTrending(rankingKey);
      rankingWithMeta.push(
        ...videos.map((v, i) => ({ video: v, index: i, serviceIndex: svcIdx }))
      );
    }

    console.log(
      `${c.blue("[TWIDRO CRON]")} '${rankingKey}' fetched ${
        rankingWithMeta.length
      } videos`
    );

    for (const item of rankingWithMeta) {
      item.score = calcScore(item);
    }

    // ソート（降順）
    const sorted = rankingWithMeta.sort(deterministicSort).map((x) => x.video);

    console.log(`${c.blue("[TWIDRO CRON]")} Sorted ${sorted.length} videos`);

    for (const [index, video] of sorted.entries()) {
      await kv.set([rankingKey, index], video);
    }
  }
});

Deno.serve(
  {
    port: 2001,
  },
  app.fetch
);
