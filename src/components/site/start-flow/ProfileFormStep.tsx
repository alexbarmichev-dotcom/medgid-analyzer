import Icon from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface ProfileFormStepProps {
  isFree: boolean;
  gender: 'm' | 'f' | '';
  setGender: (gender: 'm' | 'f' | '') => void;
  age: string;
  setAge: (age: string) => void;
  complaints: string;
  setComplaints: (complaints: string) => void;
  conditions: string;
  setConditions: (conditions: string) => void;
  meds: string;
  setMeds: (meds: string) => void;
  email: string;
  setEmail: (email: string) => void;
  files: File[];
  addFiles: (list: FileList | null) => void;
  analyzing: boolean;
  onBack: () => void;
  onSubmit: () => void;
}

const ProfileFormStep = ({
  isFree,
  gender,
  setGender,
  age,
  setAge,
  complaints,
  setComplaints,
  conditions,
  setConditions,
  meds,
  setMeds,
  email,
  setEmail,
  files,
  addFiles,
  analyzing,
  onBack,
  onSubmit,
}: ProfileFormStepProps) => {
  return (
    <div className="animate-fade-in space-y-5">
      <h3 className="font-head text-xl font-bold">Расскажите о себе</h3>
      {isFree && (
        <p className="inline-flex items-center gap-2 rounded-xl bg-hand/12 px-4 py-2.5 text-sm font-medium text-hand">
          <Icon name="Gift" size={16} />
          Для вашего аккаунта разбор анализа бесплатный
        </p>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Пол</Label>
          <div className="flex gap-2">
            {([
              ['m', 'Мужской'],
              ['f', 'Женский'],
            ] as const).map(([v, l]) => (
              <button
                key={v}
                type="button"
                onClick={() => setGender(v)}
                className={`flex-1 rounded-xl border px-3 py-3 text-sm font-medium transition-colors ${
                  gender === v
                    ? 'border-accent bg-accent/10 text-accent'
                    : 'border-border bg-background text-ink-soft hover:border-accent/40'
                }`}
              >
                {l}
              </button>
            ))}
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="age">Возраст</Label>
          <Input
            id="age"
            inputMode="numeric"
            placeholder="например, 34"
            value={age}
            onChange={(e) => setAge(e.target.value.replace(/\D/g, '').slice(0, 3))}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="complaints">Недомогания в данный момент</Label>
        <Textarea
          id="complaints"
          placeholder="что беспокоит сейчас"
          value={complaints}
          onChange={(e) => setComplaints(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="conditions">Сопутствующие заболевания</Label>
        <Input
          id="conditions"
          placeholder="если есть"
          value={conditions}
          onChange={(e) => setConditions(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="meds">Постоянный приём лекарств</Label>
        <Input
          id="meds"
          placeholder="статины, антибиотики, обезболивающие, травы/БАДы"
          value={meds}
          onChange={(e) => setMeds(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email для уведомления (необязательно)</Label>
        <Input
          id="email"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <p className="text-xs text-muted-foreground">
          Пришлём результат расшифровки на почту, когда он будет готов
        </p>
      </div>

      <div className="space-y-2">
        <Label>Фото или скан анализов</Label>
        <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border bg-background px-4 py-8 text-center transition-colors hover:border-accent/50">
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-accent/10 text-accent">
            <Icon name="ImageUp" size={22} />
          </span>
          <span className="text-sm font-medium">Нажмите, чтобы загрузить</span>
          <span className="max-w-xs text-xs leading-snug text-muted-foreground">
            Фото можно сделать телефоном, не беспокоясь о качестве. Если нейросеть не сможет
            прочесть — попросит переснять.
          </span>
          <input
            type="file"
            accept="image/*,application/pdf"
            multiple
            className="hidden"
            onChange={(e) => addFiles(e.target.files)}
          />
        </label>
        {files.length > 0 && (
          <ul className="space-y-1.5 pt-1">
            {files.map((f, i) => (
              <li
                key={`${f.name}-${i}`}
                className="flex items-center gap-2 text-sm text-ink-soft"
              >
                <Icon name="Paperclip" size={14} className="text-hand" />
                {f.name}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="flex gap-3">
        <button
          onClick={onBack}
          className="inline-flex items-center justify-center gap-2 rounded-[var(--radius)] border border-border bg-background px-5 py-4 text-sm font-semibold text-ink-soft"
        >
          <Icon name="ArrowLeft" size={16} />
          Назад
        </button>
        <button
          onClick={onSubmit}
          disabled={analyzing}
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-[var(--radius)] bg-accent px-6 py-4 text-base font-semibold text-accent-foreground transition-transform hover:-translate-y-0.5 disabled:opacity-60"
        >
          {analyzing ? 'Разбираем анализ…' : 'Отправить'}
          {!analyzing && <Icon name="ArrowRight" size={18} />}
        </button>
      </div>
    </div>
  );
};

export default ProfileFormStep;