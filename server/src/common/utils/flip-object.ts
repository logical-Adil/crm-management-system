export const flipObject = <K extends string | number | symbol, V extends string | number>(
  obj: Record<K, V>,
) => Object.fromEntries(Object.entries(obj).map(([k, v]) => [v, k])) as Record<V, K>;
