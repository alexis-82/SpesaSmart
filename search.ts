// Testo normalizzato per i confronti: minuscolo, senza accenti e spazi esterni
export const normalizeText = (text: string): string =>
  text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();

// Prodotti che contengono il testo cercato, con la loro posizione nell'elenco completo
export const filterProducts = (
  products: string[],
  query: string,
): { item: string; index: number }[] => {
  const normalizedQuery = normalizeText(query);
  return products
    .map((item, index) => ({ item, index }))
    .filter(({ item }) => normalizeText(item).includes(normalizedQuery));
};

// true se il prodotto è già presente (stesso nome a meno di maiuscole, accenti e spazi)
export const productExists = (products: string[], name: string): boolean => {
  const normalizedName = normalizeText(name);
  return products.some(item => normalizeText(item) === normalizedName);
};
