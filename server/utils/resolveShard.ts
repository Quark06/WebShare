import config from "../config.ts";

export function getShardIds(): number[] {
  if (!config.SHARD) return [0];
  const count = Math.max(1, Number(config.SHARD_COUNT) || 1);
  return Array.from({ length: count }, (_, index) => index + 1);
}

export function resolveShard(roomId: string): number {
  if (!config.SHARD) {
    return 0;
  }
  const numShards = getShardIds().length;
  const letter = roomId[0];
  const charCode = letter.charCodeAt(0);
  return Number((charCode % numShards) + 1);
}
