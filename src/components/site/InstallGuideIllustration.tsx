type DeviceKey = 'ios' | 'android' | 'desktop';

interface ArrowProps {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

const Arrow = ({ x1, y1, x2, y2 }: ArrowProps) => {
  const angle = (Math.atan2(y2 - y1, x2 - x1) * 180) / Math.PI;
  return (
    <g className="text-accent">
      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <polygon
        points="0,0 -9,-5 -9,5"
        fill="currentColor"
        transform={`translate(${x2} ${y2}) rotate(${angle})`}
      />
    </g>
  );
};

const Badge = ({ x, y, n }: { x: number; y: number; n: number }) => (
  <g>
    <circle cx={x} cy={y} r="8" className="fill-accent" />
    <text x={x} y={y + 3.5} textAnchor="middle" fontSize="10" fontWeight="700" className="fill-accent-foreground">
      {n}
    </text>
  </g>
);

const Frame = ({ x, w, h, children }: { x: number; w: number; h: number; children: React.ReactNode }) => (
  <g>
    <rect x={x} y="4" width={w} height={h} rx="12" className="fill-background stroke-border" strokeWidth="2" />
    {children}
  </g>
);

const Highlight = ({ cx, cy, r }: { cx: number; cy: number; r: number }) => (
  <circle cx={cx} cy={cy} r={r} fill="none" strokeWidth="2.5" className="stroke-accent" strokeDasharray="4 3" />
);

const Row = ({ x, y, w, text, active }: { x: number; y: number; w: number; text: string; active?: boolean }) => (
  <g>
    <rect
      x={x}
      y={y}
      width={w}
      height="22"
      rx="6"
      className={active ? 'fill-accent/15 stroke-accent' : 'fill-muted stroke-transparent'}
      strokeWidth="2"
    />
    <text x={x + 8} y={y + 15} fontSize="10" fontWeight={active ? 700 : 500} className="fill-foreground">
      {text}
    </text>
  </g>
);

const IosScene = () => (
  <>
    <Frame x={5} w={150} h={182}>
      <rect x="15" y="16" width="130" height="14" rx="7" className="fill-muted" />
      <text x="80" y="26" textAnchor="middle" fontSize="8" className="fill-muted-foreground">
        лаб-гид.рф
      </text>
      <text x="80" y="82" textAnchor="middle" fontSize="9" className="fill-muted-foreground">
        Сайт ЛабГид
      </text>
      <rect x="10" y="150" width="140" height="32" rx="10" className="fill-muted" />
      <path d="M32 162 l-6 5 l6 5" fill="none" strokeWidth="2" className="stroke-muted-foreground" strokeLinecap="round" />
      <path d="M52 162 l6 5 l-6 5" fill="none" strokeWidth="2" className="stroke-muted-foreground" strokeLinecap="round" />
      <rect x="73" y="163" width="14" height="12" rx="2" fill="none" strokeWidth="2" className="stroke-foreground" />
      <path d="M80 168 v-12 m-4 4 l4 -4 l4 4" fill="none" strokeWidth="2" className="stroke-foreground" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="108" y="162" width="12" height="12" rx="2" fill="none" strokeWidth="2" className="stroke-muted-foreground" />
      <rect x="127" y="162" width="12" height="12" rx="2" fill="none" strokeWidth="2" className="stroke-muted-foreground" />
      <Highlight cx={80} cy={166} r={16} />
      <Arrow x1={80} y1={112} x2={80} y2={146} />
      <text x="80" y="106" textAnchor="middle" fontSize="10" fontWeight="700" className="fill-foreground">
        Поделиться
      </text>
      <Badge x={22} y={50} n={1} />
    </Frame>
    <Frame x={165} w={150} h={182}>
      <Row x={173} y={18} w={134} text="Копировать" />
      <Row x={173} y={44} w={134} text="В закладки" />
      <Row x={173} y={70} w={134} text="На экран «Домой»" active />
      <Row x={173} y={96} w={134} text="Печать" />
      <Arrow x1={240} y1={152} x2={240} y2={96} />
      <text x="240" y="168" textAnchor="middle" fontSize="10" fontWeight="700" className="fill-foreground">
        Выберите эту строку
      </text>
      <Badge x={298} y={13} n={2} />
    </Frame>
  </>
);

const AndroidScene = () => (
  <>
    <Frame x={5} w={150} h={182}>
      <rect x="14" y="14" width="102" height="16" rx="8" className="fill-muted" />
      <text x="65" y="25" textAnchor="middle" fontSize="8" className="fill-muted-foreground">
        лаб-гид.рф
      </text>
      <circle cx="132" cy="17" r="1.8" className="fill-foreground" />
      <circle cx="132" cy="22" r="1.8" className="fill-foreground" />
      <circle cx="132" cy="27" r="1.8" className="fill-foreground" />
      <Highlight cx={132} cy={22} r={13} />
      <Arrow x1={100} y1={82} x2={125} y2={38} />
      <text x="80" y="102" textAnchor="middle" fontSize="10" fontWeight="700" className="fill-foreground">
        Три точки —
      </text>
      <text x="80" y="115" textAnchor="middle" fontSize="10" fontWeight="700" className="fill-foreground">
        меню браузера
      </text>
      <Badge x={22} y={60} n={1} />
    </Frame>
    <Frame x={165} w={150} h={182}>
      <Row x={173} y={18} w={134} text="Новая вкладка" />
      <Row x={173} y={44} w={134} text="Установить приложение" active />
      <Row x={173} y={70} w={134} text="Настройки" />
      <Arrow x1={240} y1={132} x2={240} y2={70} />
      <text x="240" y="148" textAnchor="middle" fontSize="10" fontWeight="700" className="fill-foreground">
        Выберите эту строку
      </text>
      <Badge x={298} y={13} n={2} />
    </Frame>
  </>
);

const DesktopScene = () => (
  <>
    <Frame x={5} w={150} h={182}>
      <circle cx="18" cy="16" r="2.5" className="fill-muted-foreground" />
      <circle cx="26" cy="16" r="2.5" className="fill-muted-foreground" />
      <circle cx="34" cy="16" r="2.5" className="fill-muted-foreground" />
      <rect x="12" y="26" width="136" height="16" rx="8" className="fill-muted" />
      <text x="42" y="37" fontSize="8" className="fill-muted-foreground">
        лаб-гид.рф
      </text>
      <rect x="116" y="30" width="12" height="9" rx="1.5" fill="none" strokeWidth="1.8" className="stroke-foreground" />
      <path d="M122 32 v4 m-2 -1.5 l2 2 l2 -2" fill="none" strokeWidth="1.6" className="stroke-foreground" strokeLinecap="round" strokeLinejoin="round" />
      <Highlight cx={122} cy={34} r={12} />
      <Arrow x1={110} y1={92} x2={120} y2={49} />
      <text x="80" y="112" textAnchor="middle" fontSize="10" fontWeight="700" className="fill-foreground">
        Значок установки
      </text>
      <text x="80" y="125" textAnchor="middle" fontSize="10" fontWeight="700" className="fill-foreground">
        справа в строке
      </text>
      <Badge x={22} y={64} n={1} />
    </Frame>
    <Frame x={165} w={150} h={182}>
      <rect x="177" y="22" width="126" height="86" rx="10" className="fill-card stroke-border" strokeWidth="2" />
      <text x="240" y="44" textAnchor="middle" fontSize="10" fontWeight="700" className="fill-foreground">
        Установить ЛабГид?
      </text>
      <rect x="186" y="74" width="50" height="20" rx="6" className="fill-muted" />
      <text x="211" y="88" textAnchor="middle" fontSize="9" className="fill-foreground">
        Отмена
      </text>
      <rect x="244" y="74" width="50" height="20" rx="6" className="fill-accent/15 stroke-accent" strokeWidth="2" />
      <text x="269" y="88" textAnchor="middle" fontSize="9" fontWeight="700" className="fill-foreground">
        Установить
      </text>
      <Arrow x1={269} y1={146} x2={269} y2={100} />
      <text x="240" y="164" textAnchor="middle" fontSize="10" fontWeight="700" className="fill-foreground">
        Нажмите «Установить»
      </text>
      <Badge x={298} y={13} n={2} />
    </Frame>
  </>
);

interface InstallGuideIllustrationProps {
  device: DeviceKey;
}

const InstallGuideIllustration = ({ device }: InstallGuideIllustrationProps) => (
  <svg
    viewBox="0 0 320 190"
    role="img"
    aria-label="Схема: куда нажимать для установки приложения"
    className="mt-3 w-full"
    fontFamily="inherit"
  >
    {device === 'ios' && <IosScene />}
    {device === 'android' && <AndroidScene />}
    {device === 'desktop' && <DesktopScene />}
  </svg>
);

export default InstallGuideIllustration;
