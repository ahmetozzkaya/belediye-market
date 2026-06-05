const CATEGORY_EMOJI = {
  'Pastane':          '🎂',
  'Tatlı':            '🍰',
  'Burger':           '🍔',
  'Fast Food':        '🍟',
  'Ev Yemeği':        '🍲',
  'Izgara':           '🥩',
  'Köfte':            '🍖',
  'Kebap':            '🍢',
  'Pizza':            '🍕',
  'Makarna':          '🍝',
  'Kafe':             '☕',
  'İçecek':           '🥤',
  'Döner':            '🌯',
  'Türk Mutfağı':     '🍽️',
  'Fırın Ürünleri':   '🫓',
  'Pide & Lahmacun':  '🫓',
  'Börek':            '🥐',
  'Kahvaltı':         '🥗',
  'Çorba':            '🥣',
  'Deniz Ürünleri':   '🦐',
  'Vejeteryan':       '🥗',
};

const GRADIENTS = [
  'from-red-400 to-orange-400',
  'from-orange-400 to-amber-400',
  'from-emerald-400 to-teal-400',
  'from-blue-400 to-indigo-400',
  'from-purple-400 to-pink-400',
  'from-rose-400 to-red-400',
  'from-amber-400 to-yellow-400',
  'from-teal-400 to-cyan-400',
  'from-indigo-400 to-purple-400',
];

// Restoran adına göre deterministik renk seç
export const getGradient = (name = '') => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash += name.charCodeAt(i);
  return GRADIENTS[hash % GRADIENTS.length];
};

// Kategoriler listesinden en iyi emoji seç
export const getCategoryEmoji = (categories = []) => {
  for (const cat of categories) {
    if (CATEGORY_EMOJI[cat]) return CATEGORY_EMOJI[cat];
  }
  return '🍴';
};

// Ürün adından emoji tahmin et
export const getItemEmoji = (name = '') => {
  const n = name.toLowerCase();
  if (n.includes('pizza'))             return '🍕';
  if (n.includes('burger'))            return '🍔';
  if (n.includes('döner') || n.includes('doner')) return '🌯';
  if (n.includes('dürüm') || n.includes('durum')) return '🌯';
  if (n.includes('pide'))              return '🫓';
  if (n.includes('lahmacun'))          return '🫓';
  if (n.includes('köfte') || n.includes('kofte')) return '🍖';
  if (n.includes('kebap'))             return '🍢';
  if (n.includes('pasta') || n.includes('kek'))   return '🎂';
  if (n.includes('tatlı') || n.includes('tatli')) return '🍰';
  if (n.includes('çorba') || n.includes('corba')) return '🥣';
  if (n.includes('salata'))            return '🥗';
  if (n.includes('patates'))           return '🍟';
  if (n.includes('makarna'))           return '🍝';
  if (n.includes('ayran'))             return '🥛';
  if (n.includes('çay') || n.includes('cay'))     return '🍵';
  if (n.includes('kahve'))             return '☕';
  if (n.includes('kola') || n.includes('meşrubat')) return '🥤';
  if (n.includes('su'))                return '💧';
  if (n.includes('dondurma'))          return '🍦';
  if (n.includes('börek') || n.includes('borek')) return '🥐';
  if (n.includes('izgara'))            return '🥩';
  return '🍴';
};
