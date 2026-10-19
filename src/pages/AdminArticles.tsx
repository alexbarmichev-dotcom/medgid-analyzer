import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import Icon from '@/components/ui/icon';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import AdminNav from '@/components/site/AdminNav';
import { HISTORY_URL } from '@/hooks/useArticles';

interface AdminArticle {
  id: number;
  slug: string;
  title: string;
  excerpt: string;
  body: string;
  author: string;
  cover: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  status: 'draft' | 'published';
  publishedAt: string | null;
  updatedAt: string;
}

interface Form {
  id: number | null;
  title: string;
  slug: string;
  slugTouched: boolean;
  excerpt: string;
  body: string;
  author: string;
  cover: string;
  seoTitle: string;
  seoDescription: string;
}

const EMPTY: Form = {
  id: null,
  title: '',
  slug: '',
  slugTouched: false,
  excerpt: '',
  body: '',
  author: 'Команда ЛабГид',
  cover: '',
  seoTitle: '',
  seoDescription: '',
};

const RU: Record<string, string> = {
  а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'e', ж: 'zh', з: 'z', и: 'i', й: 'y',
  к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f',
  х: 'h', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'sch', ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya',
};

const makeSlug = (title: string) =>
  title
    .toLowerCase()
    .split('')
    .map((c) => RU[c] ?? c)
    .join('')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);

const toBase64 = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(',')[1] || '');
    reader.onerror = () => reject(new Error('read'));
    reader.readAsDataURL(file);
  });

const formatDate = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' }) : '—';

const AdminArticles = () => {
  const [password, setPassword] = useState(() => sessionStorage.getItem('medgid_admin_pwd') || '');
  const [authorized, setAuthorized] = useState(false);
  const [checking, setChecking] = useState(false);
  const [items, setItems] = useState<AdminArticle[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<Form | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const authHeaders = (pwd = password) => ({ 'X-Admin-Password': pwd });

  const load = async (pwd = password) => {
    setLoading(true);
    try {
      const res = await fetch(`${HISTORY_URL}?resource=articles&all=1`, { headers: authHeaders(pwd) });
      const data = await res.json();
      if (res.ok) {
        setItems(data.items || []);
        setAuthorized(true);
        sessionStorage.setItem('medgid_admin_pwd', pwd);
      } else if (res.status === 429) {
        toast({ title: 'Вход временно заблокирован', description: 'Слишком много неверных попыток. Попробуйте через 15 минут.' });
      } else if (res.status === 401) {
        toast({ title: 'Неверный пароль' });
        setAuthorized(false);
      } else {
        toast({ title: data.error || 'Не удалось загрузить статьи' });
      }
    } catch {
      toast({ title: 'Ошибка сети, попробуйте ещё раз' });
    } finally {
      setLoading(false);
      setChecking(false);
    }
  };

  useEffect(() => {
    if (password) {
      setChecking(true);
      load(password);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const edit = (a: AdminArticle) =>
    setForm({
      id: a.id,
      title: a.title,
      slug: a.slug,
      slugTouched: true,
      excerpt: a.excerpt,
      body: a.body,
      author: a.author,
      cover: a.cover || '',
      seoTitle: a.seoTitle || '',
      seoDescription: a.seoDescription || '',
    });

  const upload = async (file: File | undefined) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: 'Файл больше 5 МБ', description: 'Выберите картинку поменьше' });
      return;
    }
    setUploading(true);
    try {
      const data = await toBase64(file);
      const res = await fetch(`${HISTORY_URL}?resource=articles&action=cover`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ mime: file.type, data }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast({ title: json.error || 'Не удалось загрузить обложку' });
        return;
      }
      setForm((f) => (f ? { ...f, cover: json.url } : f));
    } catch {
      toast({ title: 'Ошибка сети, попробуйте ещё раз' });
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const save = async (status: 'draft' | 'published') => {
    if (!form) return;
    setSaving(true);
    try {
      const payload = {
        title: form.title,
        slug: form.slug,
        excerpt: form.excerpt,
        body: form.body,
        author: form.author,
        cover: form.cover,
        seoTitle: form.seoTitle,
        seoDescription: form.seoDescription,
        status,
      };
      const url = form.id
        ? `${HISTORY_URL}?resource=articles&id=${form.id}`
        : `${HISTORY_URL}?resource=articles`;
      const res = await fetch(url, {
        method: form.id ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) {
        toast({ title: json.error || 'Не удалось сохранить статью' });
        return;
      }
      toast({
        title: status === 'published' ? 'Статья опубликована в блоге' : 'Черновик сохранён',
      });
      setForm(null);
      load();
    } catch {
      toast({ title: 'Ошибка сети, попробуйте ещё раз' });
    } finally {
      setSaving(false);
    }
  };

  const unpublish = async (a: AdminArticle) => {
    try {
      const res = await fetch(`${HISTORY_URL}?resource=articles&id=${a.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({
          title: a.title,
          slug: a.slug,
          excerpt: a.excerpt,
          body: a.body,
          author: a.author,
          cover: a.cover || '',
          seoTitle: a.seoTitle || '',
          seoDescription: a.seoDescription || '',
          status: 'draft',
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast({ title: json.error || 'Не удалось снять с публикации' });
        return;
      }
      toast({ title: 'Статья скрыта из блога' });
      load();
    } catch {
      toast({ title: 'Ошибка сети, попробуйте ещё раз' });
    }
  };

  const remove = async (a: AdminArticle) => {
    if (!window.confirm(`Удалить статью «${a.title}» навсегда?`)) return;
    try {
      const res = await fetch(`${HISTORY_URL}?resource=articles&id=${a.id}`, {
        method: 'DELETE',
        headers: authHeaders(),
      });
      const json = await res.json();
      if (!res.ok) {
        toast({ title: json.error || 'Не удалось удалить статью' });
        return;
      }
      setItems((prev) => prev.filter((it) => it.id !== a.id));
    } catch {
      toast({ title: 'Ошибка сети, попробуйте ещё раз' });
    }
  };

  if (!authorized) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-5 font-body">
        <div className="w-full max-w-sm space-y-4 rounded-2xl border border-border bg-card p-6">
          <h1 className="font-head text-xl font-bold">Статьи блога</h1>
          <Input
            type="password"
            placeholder="Пароль администратора"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && load(password)}
          />
          <Button className="w-full" disabled={checking} onClick={() => { setChecking(true); load(password); }}>
            {checking ? 'Проверяем…' : 'Войти'}
          </Button>
        </div>
      </div>
    );
  }

  if (form) {
    const set = (patch: Partial<Form>) => setForm((f) => (f ? { ...f, ...patch } : f));
    return (
      <div className="min-h-screen bg-background px-5 py-10 font-body text-foreground md:px-8">
        <div className="mx-auto max-w-3xl">
          <AdminNav />
          <button
            onClick={() => setForm(null)}
            className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            <Icon name="ArrowLeft" size={16} />
            К списку статей
          </button>
          <h1 className="font-head text-2xl font-extrabold tracking-[-0.03em]">
            {form.id ? 'Редактирование статьи' : 'Новая статья'}
          </h1>

          <div className="mt-8 space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Заголовок</Label>
              <Input
                id="title"
                value={form.title}
                maxLength={300}
                onChange={(e) =>
                  set({ title: e.target.value, ...(form.slugTouched ? {} : { slug: makeSlug(e.target.value) }) })
                }
              />
            </div>

            <div className="space-y-2">
              <Label>Обложка</Label>
              {form.cover ? (
                <div className="space-y-3">
                  <img src={form.cover} alt="Обложка" className="aspect-[16/9] w-full rounded-2xl object-cover" />
                  <div className="flex gap-3">
                    <Button type="button" variant="outline" disabled={uploading} onClick={() => fileRef.current?.click()}>
                      <Icon name={uploading ? 'Loader2' : 'ImagePlus'} size={16} className={uploading ? 'animate-spin' : ''} />
                      Заменить
                    </Button>
                    <Button type="button" variant="ghost" onClick={() => set({ cover: '' })}>
                      Убрать
                    </Button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  disabled={uploading}
                  onClick={() => fileRef.current?.click()}
                  className="flex aspect-[16/9] w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border bg-card text-muted-foreground transition-colors hover:border-accent hover:text-accent"
                >
                  <Icon name={uploading ? 'Loader2' : 'ImagePlus'} size={28} className={uploading ? 'animate-spin' : ''} />
                  <span className="text-sm font-medium">{uploading ? 'Загружаем…' : 'Загрузить обложку'}</span>
                  <span className="text-xs">JPG, PNG или WebP, до 5 МБ. Лучше горизонтальная, 16:9</span>
                </button>
              )}
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => upload(e.target.files?.[0])}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="excerpt">Короткое описание для карточки</Label>
              <Textarea
                id="excerpt"
                rows={3}
                value={form.excerpt}
                onChange={(e) => set({ excerpt: e.target.value })}
                placeholder="2–3 предложения: о чём статья и почему её стоит прочитать"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="body">Текст статьи</Label>
              <Textarea
                id="body"
                rows={18}
                value={form.body}
                onChange={(e) => set({ body: e.target.value })}
                placeholder="Пишите обычным текстом. Абзацы разделяйте пустой строкой."
              />
              <p className="text-xs leading-relaxed text-muted-foreground">
                Абзацы разделяйте пустой строкой. Подзаголовок: начните строку с «## » (две решётки и пробел),
                мелкий подзаголовок — с «### ». Ссылки вставляйте целиком, они станут кликабельными.
              </p>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="author">Автор</Label>
                <Input id="author" value={form.author} maxLength={120} onChange={(e) => set({ author: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="slug">Адрес статьи</Label>
                <Input
                  id="slug"
                  value={form.slug}
                  maxLength={160}
                  onChange={(e) => set({ slug: e.target.value.toLowerCase(), slugTouched: true })}
                />
                <p className="text-xs text-muted-foreground break-all">/articles/{form.slug || '…'}</p>
              </div>
            </div>

            <details className="rounded-2xl border border-border bg-card p-5">
              <summary className="cursor-pointer text-sm font-semibold">Для поисковиков (необязательно)</summary>
              <div className="mt-4 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="seoTitle">Заголовок в поиске</Label>
                  <Input id="seoTitle" value={form.seoTitle} onChange={(e) => set({ seoTitle: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="seoDescription">Описание в поиске</Label>
                  <Textarea
                    id="seoDescription"
                    rows={2}
                    value={form.seoDescription}
                    onChange={(e) => set({ seoDescription: e.target.value })}
                  />
                </div>
              </div>
            </details>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button size="lg" disabled={saving || uploading} onClick={() => save('published')}>
                <Icon name={saving ? 'Loader2' : 'Send'} size={16} className={saving ? 'animate-spin' : ''} />
                Опубликовать в блоге
              </Button>
              <Button size="lg" variant="outline" disabled={saving || uploading} onClick={() => save('draft')}>
                Сохранить как черновик
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background px-5 py-10 font-body text-foreground md:px-8">
      <div className="mx-auto max-w-5xl">
        <AdminNav />
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-head text-2xl font-extrabold tracking-[-0.03em]">Статьи блога</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Пишите и публикуйте статьи сами — они сразу появятся в блоге
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => load()}>
              <Icon name="RefreshCw" size={16} />
              Обновить
            </Button>
            <Button onClick={() => setForm({ ...EMPTY })}>
              <Icon name="Plus" size={16} />
              Новая статья
            </Button>
          </div>
        </div>

        {loading && items.length === 0 ? (
          <p className="text-muted-foreground">Загружаем…</p>
        ) : items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center">
            <p className="text-ink-soft">Своих статей пока нет. Три первые статьи блога уже опубликованы на сайте.</p>
            <Button className="mt-5" onClick={() => setForm({ ...EMPTY })}>
              <Icon name="Plus" size={16} />
              Написать первую статью
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((a) => (
              <div key={a.id} className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-4 sm:flex-row sm:items-center">
                {a.cover ? (
                  <img src={a.cover} alt="" className="h-20 w-32 flex-none rounded-xl object-cover" />
                ) : (
                  <span className="grid h-20 w-32 flex-none place-items-center rounded-xl bg-muted text-muted-foreground">
                    <Icon name="Image" size={22} />
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-head text-base font-bold">{a.title}</h3>
                    <Badge variant={a.status === 'published' ? 'default' : 'outline'}>
                      {a.status === 'published' ? 'Опубликована' : 'Черновик'}
                    </Badge>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {a.status === 'published' ? `Опубликована ${formatDate(a.publishedAt)}` : `Изменена ${formatDate(a.updatedAt)}`}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {a.status === 'published' && (
                    <Button asChild variant="ghost" size="sm">
                      <Link to={`/articles/${a.slug}`} target="_blank">
                        <Icon name="ExternalLink" size={14} />
                        Открыть
                      </Link>
                    </Button>
                  )}
                  <Button variant="outline" size="sm" onClick={() => edit(a)}>
                    <Icon name="Pencil" size={14} />
                    Править
                  </Button>
                  {a.status === 'published' && (
                    <Button variant="outline" size="sm" onClick={() => unpublish(a)}>
                      Скрыть
                    </Button>
                  )}
                  <Button variant="ghost" size="sm" className="text-destructive" onClick={() => remove(a)}>
                    <Icon name="Trash2" size={14} />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminArticles;
