/** リアルタイム */
export const REALTIME_KEY = "realtime";
/** 1日 */
export const RANKING_1D_KEY = "ranking:1d";
/** 3日 */
export const RANKING_3D_KEY = "ranking:3d";
/** 1週間 */
export const RANKING_1W_KEY = "ranking:1w";

export enum SITES {
  TWIDOUGA = "TWIDOUGA",
  TWIVIDEO = "TWIVIDEO",
  TWIFLIX = "TWIFLIX",
  TWIIGLE = "TWIIGLE",
}

export const POPULARITY = {
  TWIDOUGA: 19,
  TWIVIDEO: 20,
  TWIFLIX: 14,
  TWIIGLE: 18,
} as const satisfies Record<SITES, number>;
