declare module "@sabaki/sgf" {
  export type SgfNode = { data: Record<string, string[]>; children: SgfNode[] };
  export function parse(text: string): SgfNode[];
  export function stringify(nodes: SgfNode[], options?: { linebreak?: string }): string;
}
