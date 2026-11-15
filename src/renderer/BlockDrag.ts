import { createContext } from 'react';

export function dropSide(rect: DOMRect, x: number): boolean | undefined {
  return x < rect.left + rect.width * .22 ? false : x > rect.right - rect.width * .22 ? true : undefined;
}
export interface BlockDrag {
  sideOver: (id: string, after: boolean) => boolean;
  sideDrop: (id: string, after: boolean) => void;
  columnOver: (id: string, after: boolean) => boolean;
  columnDrop: (id: string, after: boolean) => void;
  start: (id: string) => void;
  over: (id: string, after: boolean) => boolean;
  drop: (id: string, after: boolean) => void;
  canSlot: (id: string) => boolean;
  overSlot: (id: string) => boolean;
  dropSlot: (id: string) => void;
  active: boolean;
  end: () => void;
  marker?: { id: string; after: boolean; side?: boolean };
}

export const BlockDragContext = createContext<BlockDrag | undefined>(undefined);
