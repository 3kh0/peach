export function createRoadCourse<T extends { name: string }>(
  roads: readonly T[],
  courseSeed: number,
  eligible: (road: T) => boolean = () => true,
) {
  let seed = courseSeed >>> 0;
  const random = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  const starts = roads.filter((r) =>
    ["StartPieceTutorial", "StraightRoad", "chunk-005", "chunk-006"].includes(r.name),
  );
  const pool = roads.filter(
    (r) => (/^chunk-[0-9]+$/.test(r.name) || r.name === "StraightRoad") && eligible(r),
  );
  if (!starts.length || !pool.length) throw new Error("The road asset collection is incomplete.");
  const startingRoad = starts[Math.floor(random() * starts.length)]!;
  let last = startingRoad.name;
  let bends = last === "StraightRoad" ? 0 : 1;
  const straight = pool.find((r) => r.name === "StraightRoad")!;
  return {
    random,
    startingRoad,
    nextRoad(clearance: (road: T) => number = () => Infinity) {
      const start = Math.floor(random() * pool.length);
      let best: T | undefined;
      let bestDistance = -Infinity;
      const candidates = Array.from(
        { length: pool.length },
        (_, i) => pool[(start + i) % pool.length]!,
      );
      if (bends >= 2 && straight) candidates.unshift(straight);
      for (const candidate of candidates) {
        if (candidate.name === last && pool.length > 1) continue;
        const distance = clearance(candidate);
        if (!best || distance > bestDistance) {
          best = candidate;
          bestDistance = distance;
        }
        if (distance >= 30) {
          best = candidate;
          break;
        }
      }
      const road = (bestDistance > -Infinity ? best : straight) ?? pool[0]!;
      last = road.name;
      bends = road.name === "StraightRoad" ? 0 : bends + 1;
      return road;
    },
  };
}
