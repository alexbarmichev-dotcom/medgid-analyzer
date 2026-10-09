import Icon from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import {
  MAX_FILES,
  MAX_TOTAL_BYTES,
  formatSize,
  totalSize,
} from '@/components/site/start-flow/uploadClient';

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
  removeFile: (index: number) => void;
  uploadProgress: number | null;
  uploadFileIndex: number;
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
  removeFile,
  uploadProgress,
  uploadFileIndex,
  analyzing,
  onBack,
  onSubmit,
}: ProfileFormStepProps) => {
  const uploading = uploadProgress !== null;
  const busy = uploading || analyzing;
  const used = totalSize(files);
  const usedPercent = Math.min(100, Math.round((used / MAX_TOTAL_BYTES) * 100));
  const full = files.length >= MAX_FILES;
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
        <label
          className={`flex flex-col ${full || busy ? 'pointer-events-none opacity-50' : 'cursor-pointer'} items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border bg-background px-4 py-8 text-center transition-colors hover:border-accent/50`}
        >
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-accent/10 text-accent">
            <Icon name="ImageUp" size={22} />
          </span>
          <span className="text-sm font-medium">
            {full ? 'Достигнут лимит файлов' : 'Нажмите, чтобы загрузить'}
          </span>
          <span className="text-xs font-medium text-ink-soft">
            До {MAX_FILES} файлов, всего до 50 МБ · фото или PDF
          </span>
          <span className="max-w-xs text-xs leading-snug text-muted-foreground">
            Фото можно сделать телефоном, не беспокоясь о качестве. Если нейросеть не сможет
            прочесть — попросит переснять.
          </span>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/heic,image/heif,.heic,.heif,application/pdf"
            multiple
            className="hidden"
            disabled={full || busy}
            onChange={(e) => {
              addFiles(e.target.files);
              e.target.value = '';
            }}
          />
        </label>
        {files.length > 0 && (
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>
                Файлов: {files.length} из {MAX_FILES}
              </span>
              <span>
                {formatSize(used)} из 50 МБ
              </span>
            </div>
            <Progress value={usedPercent} className="h-1.5" />
            <ul className="space-y-1.5 pt-1">
              {files.map((f, i) => (
                <li
                  key={`${f.name}-${i}`}
                  className="flex items-center gap-2 rounded-xl bg-background px-3 py-2 text-sm text-ink-soft"
                >
                  <Icon
                    name={
                      uploading && i < uploadFileIndex
                        ? 'CircleCheck'
                        : uploading && i === uploadFileIndex
                          ? 'Loader2'
                          : 'Paperclip'
                    }
                    size={14}
                    className={`shrink-0 text-hand ${uploading && i === uploadFileIndex ? 'animate-spin' : ''}`}
                  />
                  <span className="min-w-0 flex-1 truncate">{f.name}</span>
                  <span className="shrink-0 text-xs text-muted-foreground">{formatSize(f.size)}</span>
                  {!busy && (
                    <button
                      type="button"
                      onClick={() => removeFile(i)}
                      aria-label="Убрать файл"
                      className="shrink-0 rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                    >
                      <Icon name="X" size={14} />
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}

        {uploading && (
          <div className="space-y-2 rounded-2xl border border-accent/30 bg-accent/5 p-4">
            <div className="flex items-center justify-between text-sm font-medium">
              <span className="inline-flex items-center gap-2">
                <Icon name="UploadCloud" size={16} className="text-accent" />
                Загружаем файл {Math.min(uploadFileIndex + 1, files.length)} из {files.length}
              </span>
              <span>{uploadProgress}%</span>
            </div>
            <Progress value={uploadProgress ?? 0} className="h-2" />
            <p className="text-xs text-muted-foreground">
              Не закрывайте страницу. Если связь прервётся, мы удалим загруженное и предложим
              повторить.
            </p>
          </div>
        )}
      </div>

      <div className="flex gap-3">
        <button
          onClick={onBack}
          disabled={busy}
          className="inline-flex items-center justify-center gap-2 rounded-[var(--radius)] border border-border bg-background px-5 py-4 text-sm font-semibold text-ink-soft"
        >
          <Icon name="ArrowLeft" size={16} />
          Назад
        </button>
        <button
          onClick={onSubmit}
          disabled={busy}
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-[var(--radius)] bg-accent px-6 py-4 text-base font-semibold text-accent-foreground transition-transform hover:-translate-y-0.5 disabled:opacity-60"
        >
          {uploading ? 'Загружаем файлы…' : analyzing ? 'Разбираем анализ…' : 'Отправить'}
          {!busy && <Icon name="ArrowRight" size={18} />}
        </button>
      </div>
    </div>
  );
};

export default ProfileFormStep;