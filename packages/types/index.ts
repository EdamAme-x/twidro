import type { SITES } from "@twidro/consts";

export interface Video<T extends SITES> {
  type: T;
  videoUrl: string;
  thumbnailUrl?: string;
  link?: string;
}
