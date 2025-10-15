/** リアルタイム */
export const REALTIME_KEY = "realtime";
/** 1日 */
export const RANKING_1D_KEY = "ranking:1d";
/** 3日 */
export const RANKING_3D_KEY = "ranking:3d";
/** 1週間 */
export const RANKING_1W_KEY = "ranking:1w";

export const RANKING_KEYS = [RANKING_1D_KEY, RANKING_3D_KEY, RANKING_1W_KEY] as const;

export type RANKING_KEY = (typeof RANKING_KEYS)[number];

export enum SITES {
  TWIDOUGA = "TWIDOUGA",
  TWIVIDEO = "TWIVIDEO",
  TWIFLIX = "TWIFLIX",
  TWIIGLE = "TWIIGLE",
}

export const POPULARITY = {
  TWIDOUGA: 3,
  TWIVIDEO: 4,
  TWIFLIX: 1,
  TWIIGLE: 2,
} as const satisfies Record<SITES, number>;

// 最大のPOP
export const MAX_POPULARITY = Math.max(...Object.values(POPULARITY));
