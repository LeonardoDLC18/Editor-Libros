const paths = {
  lightbulb: 'M9 18h6M10 22h4M8 14a6 6 0 1 1 8 0c-1 1-1 2-1 4H9c0-2 0-3-1-4Z',
  target: 'M21 12a9 9 0 1 1-9-9M17 12a5 5 0 1 1-5-5M12 12 22 2M17 2v5h5',
  help: 'M9 8a3 3 0 0 1 6 0c0 2-3 2-3 5m0 4h.01M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0Z',
  chart: 'M4 20v-6h3v6H4Zm7 0V9h3v11h-3Zm7 0V3h3v17h-3',
  'map-pin': 'M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0ZM15 10a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z',
  book: 'M3 4h6l3 2 3-2h6v16h-6l-3 2-3-2H3V4Zm9 2v16',
  save: 'M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h12l4 4v12a2 2 0 0 1-2 2ZM7 3v6h10V3M7 21v-8h10v8',
  undo: 'M9 4 4 9l5 5M4 9h9a7 7 0 0 1 0 14',
  redo: 'm15 4 5 5-5 5m5-5h-9a7 7 0 0 0 0 14',
  eye: 'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Zm13 0a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z',
  print: 'M6 9V3h12v6M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2M6 14h12v8H6v-8Zm12-2h.01',
  page: 'M14 2H5v20h14V7l-5-5Zm0 0v6h5M8 12h8M8 16h6',
  check: 'm5 12 4 4L19 6',
  cursor: 'm4 3 7 18 3-7 7-3L4 3Z',
  left: 'm15 18-6-6 6-6',
  right: 'm9 18 6-6-6-6',
  close: 'm6 6 12 12M6 18 18 6',
  info: 'M12 11v6m0-10h.01M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0Z',
};
export function Icon({ name, size = 18 }: { name: keyof typeof paths; size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[name]} /></svg>;
}
