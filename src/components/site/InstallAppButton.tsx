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
  const isIos = /iPhone|iPad|iPod/.test(ua);

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
        <DialogContent className="max-w-md rounded-3xl">
          <DialogHeader>
            <DialogTitle className="font-head text-xl font-bold">Установка приложения</DialogTitle>
            <DialogDescription>
              ЛабГид появится на экране как обычное приложение, без магазинов и скачивания файлов.
            </DialogDescription>
          </DialogHeader>
          <ol className="list-decimal space-y-2 pl-5 text-sm leading-relaxed text-ink-soft">
            {isIos ? (
              <>
                <li>Откройте сайт в браузере Safari.</li>
                <li>Нажмите кнопку «Поделиться» внизу экрана.</li>
                <li>Выберите «На экран Домой» и подтвердите.</li>
              </>
            ) : (
              <>
                <li>Откройте меню браузера (три точки в углу).</li>
                <li>Выберите «Установить приложение» или «Добавить на главный экран».</li>
                <li>Подтвердите установку.</li>
              </>
            )}
          </ol>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default InstallAppButton;
