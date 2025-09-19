import type { SITES } from "@twidro/consts";
import type { Video } from "@twidro/types";

export abstract class BaseService<T extends SITES> {
  abstract priority: number;
  abstract getRealtime(): Promise<Video<T>[]>;
  abstract getTrending(range?: string): Promise<Video<T>[]>;
}
