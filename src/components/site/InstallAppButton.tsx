import { useEffect, useState } from 'react';
import Icon from '@/components/ui/icon';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface InstallAppButtonProps {
  className?: string;
  onDone?: () => void;
}

type DeviceKey = 'ios' | 'android' | 'desktop';

const GUIDES: { key: DeviceKey; title: string; icon: string; steps: string[] }[] = [
  {
    key: 'ios',
    title: 'iPhone и iPad',
    icon: 'Smartphone',
    steps: [
      'Откройте сайт именно в браузере Safari (синий компас). В других браузерах на iPhone установка не работает.',
      'Внизу экрана нажмите кнопку «Поделиться» — квадрат со стрелкой вверх.',
      'В открывшемся списке пролистайте вниз и выберите «На экран Домой».',
      'Нажмите «Добавить» в правом верхнем углу. Значок ЛабГид появится среди ваших приложений.',
    ],
  },
  {
    key: 'android',
    title: 'Телефон на Android',
    icon: 'Smartphone',
    steps: [
      'Откройте сайт в браузере Chrome.',
      'Справа вверху нажмите на три вертикальные точки — это меню браузера.',
      'Выберите «Установить приложение» или «Добавить на главный экран».',
      'Подтвердите кнопкой «Установить». Значок ЛабГид появится на экране телефона.',
    ],
  },
  {
    key: 'desktop',
    title: 'Компьютер',
    icon: 'Monitor',
    steps: [
      'Откройте сайт в браузере Chrome, Яндекс Браузер или Edge.',
      'В адресной строке сверху, справа от адреса сайта, найдите значок установки — маленький экран со стрелкой вниз.',
      'Нажмите на него и выберите «Установить».',
      'Если значка нет, откройте меню браузера (три точки справа вверху) и выберите «Установить ЛабГид».',
    ],
  },
];

const isStandalone = () =>
  window.matchMedia('(display-mode: standalone)').matches ||
  (navigator as Navigator & { standalone?: boolean }).standalone === true;

const InstallAppButton = ({ className = '', onDone }: InstallAppButtonProps) => {
  const [promptEvent, setPromptEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [help, setHelp] = useState(false);

  useEffect(() => {
    setInstalled(isStandalone());
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setPromptEvent(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setPromptEvent(null);
    };
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  if (installed) return null;

  const ua = navigator.userAgent;
  const device: DeviceKey = /iPhone|iPad|iPod/.test(ua)
    ? 'ios'
    : /Android/.test(ua)
      ? 'android'
      : 'desktop';
  const sections = [...GUIDES].sort((a, b) => Number(b.key === device) - Number(a.key === device));

  const handleClick = async () => {
    onDone?.();
    if (promptEvent) {
      await promptEvent.prompt();
      await promptEvent.userChoice;
      setPromptEvent(null);
      return;
    }
    setHelp(true);
  };

  return (
    <>
      <button onClick={handleClick} className={className}>
        <Icon name="Download" size={16} />
        Установить приложение
      </button>
      <Dialog open={help} onOpenChange={setHelp}>
        <DialogContent className="max-h-[88vh] max-w-md overflow-y-auto rounded-3xl">
          <DialogHeader>
            <DialogTitle className="font-head text-xl font-bold">Установка приложения</DialogTitle>
            <DialogDescription>
              Ничего скачивать из магазинов не нужно: значок ЛабГид просто добавится на экран, как обычное приложение. Выберите своё устройство.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {sections.map((g) => (
              <section
                key={g.key}
                className={`rounded-2xl border p-4 ${
                  g.key === device ? 'border-hand/40 bg-hand/5' : 'border-border'
                }`}
              >
                <h3 className="flex items-center gap-2 font-head text-base font-bold">
                  <Icon name={g.icon} size={18} className="text-hand" />
                  {g.title}
                  {g.key === device && (
                    <span className="rounded-full bg-hand px-2 py-0.5 text-xs font-semibold text-accent-foreground">
                      ваше устройство
                    </span>
                  )}
                </h3>
                <ol className="mt-2 list-decimal space-y-1.5 pl-5 text-sm leading-relaxed text-ink-soft">
                  {g.steps.map((step) => (
                    <li key={step}>{step}</li>
                  ))}
                </ol>
              </section>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default InstallAppButton;
