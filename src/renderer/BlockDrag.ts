import { createContext } from 'react';

export interface BlockDrag {
  start: (id: string) => void;
  over: (id: string, after: boolean) => boolean;
  drop: (id: string, after: boolean) => void;
  canSlot: (id: string) => boolean;
  overSlot: (id: string) => boolean;
  dropSlot: (id: string) => void;
  active: boolean;
  end: () => void;
  marker?: { id: string; after: boolean };
}

export const BlockDragContext = createContext<BlockDrag | undefined>(undefined);
