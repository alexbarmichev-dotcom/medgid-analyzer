import { useEffect } from 'react';

export const useNoindex = (active = true) => {
  useEffect(() => {
    if (!active) return;
    let meta = document.querySelector<HTMLMetaElement>('meta[name="robots"]');
    const created = !meta;
    const prev = meta?.content ?? '';
    if (!meta) {
      meta = document.createElement('meta');
      meta.name = 'robots';
      document.head.appendChild(meta);
    }
    meta.content = 'noindex, nofollow';
    return () => {
      if (!meta) return;
      if (created) meta.remove();
      else meta.content = prev;
    };
  }, [active]);
};
