import { useLayoutEffect, useRef, useState } from 'react';

export function usePageScale(widthMm: number, heightMm: number) {
  const ref = useRef<HTMLDivElement>(null);
  const [fit, setFit] = useState(0.5);
  useLayoutEffect(() => {
    const target = ref.current;
    if (!target) return;
    const update = () => setFit(Math.max(0.15, Math.min(
      (target.clientWidth - 64) / (widthMm * 96 / 25.4),
      (target.clientHeight - 48) / (heightMm * 96 / 25.4), 1,
    )));
    const observer = new ResizeObserver(update);
    observer.observe(target);
    update();
    return () => observer.disconnect();
  }, [widthMm, heightMm]);
  return { ref, fit };
}
