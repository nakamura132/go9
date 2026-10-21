declare module "@sabaki/deadstones" {
  export function useFetch(path: string): unknown;
  export function guess(data: number[][], options?: { finished?: boolean; iterations?: number }): Promise<[number, number][]>;
}
declare module "@sabaki/deadstones/wasm/deadstones_bg.wasm?url" {
  const url: string;
  export default url;
}
