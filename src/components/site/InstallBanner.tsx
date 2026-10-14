import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import Icon from '@/components/ui/icon';
import InstallAppButton from '@/components/site/InstallAppButton';

const STORAGE_KEY = 'labgid_install_banner_closed';

const isStandalone = () =>
  window.matchMedia('(display-mode: standalone)').matches ||
  (navigator as Navigator & { standalone?: boolean }).standalone === true;

const readClosed = () => {
  try {
    return localStorage.getItem(STORAGE_KEY) === '1';
  } catch {
    return false;
  }
};

const InstallBanner = () => {
  const { pathname } = useLocation();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (readClosed() || isStandalone()) return;
    setVisible(true);
    const hide = () => setVisible(false);
    window.addEventListener('appinstalled', hide);
    return () => window.removeEventListener('appinstalled', hide);
  }, []);

  const close = () => {
    try {
      localStorage.setItem(STORAGE_KEY, '1');
    } catch {
      setVisible(false);
    }
    setVisible(false);
  };

  if (!visible || pathname.startsWith('/admin')) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:hidden">
      <div className="animate-fade-in flex items-center gap-3 rounded-2xl border border-border bg-card p-3 pl-4 shadow-lg">
        <img src="/icon-192.png" alt="" className="h-10 w-10 shrink-0 rounded-xl" />
        <p className="min-w-0 flex-1 text-sm font-semibold leading-snug text-foreground">
          Установите приложение ЛабГид
        </p>
        <InstallAppButton className="inline-flex shrink-0 items-center gap-1.5 rounded-[var(--radius)] bg-hand px-3.5 py-2 text-sm font-semibold text-accent-foreground" />
        <button
          onClick={close}
          aria-label="Закрыть"
          className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-muted-foreground hover:bg-muted"
        >
          <Icon name="X" size={18} />
        </button>
      </div>
    </div>
  );
};

export default InstallBanner;
