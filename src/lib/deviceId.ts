const DEVICE_ID_KEY = 'medgid_device_id';

const randomId = () => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID().replace(/-/g, '');
  }
  return Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
};

export const getDeviceId = (): string => {
  try {
    const existing = localStorage.getItem(DEVICE_ID_KEY);
    if (existing) return existing;
    const id = `guest_${randomId()}`;
    localStorage.setItem(DEVICE_ID_KEY, id);
    return id;
  } catch {
    return `guest_${randomId()}`;
  }
};
