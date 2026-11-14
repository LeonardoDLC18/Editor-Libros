import { createContext } from 'react';

export interface BlockDrag {
  start: (id: string) => void;
  over: (id: string, after: boolean) => boolean;
  drop: (id: string, after: boolean) => void;
  end: () => void;
  marker?: { id: string; after: boolean };
}

export const BlockDragContext = createContext<BlockDrag | undefined>(undefined);
