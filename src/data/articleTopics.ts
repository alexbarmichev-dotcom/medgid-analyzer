export const ARTICLE_TOPICS = [
  { id: 'blood', label: 'Анализы крови' },
  { id: 'ai', label: 'ИИ и здоровье' },
  { id: 'doctor', label: 'Врач и приём' },
] as const;

export type TopicId = (typeof ARTICLE_TOPICS)[number]['id'];

const TOPICS_BY_SLUG: Record<string, TopicId[]> = {
  'biohimicheskij-analiz-krovi-istoriya-normy-rasshifrovka': ['blood'],
  'biokhimicheskiy-analiz-krovi-rasshifrovka': ['blood'],
  'rasshifrovka-obshchego-analiza-krovi': ['blood'],
  'skolko-parametrov-v-krovi-pochemu-issleduyut-ne-vse': ['blood'],
  'preddiabet-kak-uznat-po-analizam': ['blood'],
  'istoriya-rasshifrovki-analizov': ['blood'],
  'ai-konsultanty-po-zdorovyu-v-mire': ['ai'],
  'mozhno-li-doveryat-ii-rasshifrovke-analizov': ['ai'],
  'personalnaya-medicina-i-ii-nablyudenie-za-zdorovem': ['ai', 'blood'],
  'ii-pisar-vracha-kak-rabotaet': ['ai', 'doctor'],
  'nehvatka-vrachej-prichiny-prognoz': ['doctor'],
  'podgotovka-k-priemu-vracha': ['doctor'],
  'vrach-ne-vrag': ['doctor'],
};

export const topicsOf = (slug: string): TopicId[] => TOPICS_BY_SLUG[slug] ?? [];
