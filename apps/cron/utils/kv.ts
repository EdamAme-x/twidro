export async function deleteByPrefix(
  kv: Deno.Kv,
  prefix: Deno.KvKey,
): Promise<number> {
  const iter = await kv.list({ prefix });
  let deletedCount = 0;
  for await (const entry of iter) {
    await kv.delete(entry.key);
    deletedCount++;
  }
  return deletedCount;
}

export async function deleteByPrefixes(
  kv: Deno.Kv,
  prefixes: Deno.KvKey[],
): Promise<number> {
  let total = 0;
  for (const prefix of prefixes) {
    total += await deleteByPrefix(kv, prefix);
  }
  return total;
}


