// Deterministic pale accent chip per business, so multiple companies
// stay visually distinguishable inside switchers and lists.
const ACCENT_COUNT = 8;

export const businessAccent = (name = '') => {
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) {
    hash = (hash * 31 + name.charCodeAt(i)) | 0;
  }
  return `biz-accent-${Math.abs(hash) % ACCENT_COUNT}`;
};

export default businessAccent;
