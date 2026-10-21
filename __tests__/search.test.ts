import { filterProducts, normalizeText, productExists } from '../search';
import { describe, expect, it } from '@jest/globals';

describe('search', () => {
  const products = ['Caffè', 'Mozzarella', 'Mozzarella di bufala', "Camoscio d'Oro", 'Pane'];

  it('normalizza maiuscole, accenti e spazi', () => {
    expect(normalizeText('  CAFFÈ ')).toBe('caffe');
  });

  it('trova i prodotti che contengono il testo, con la posizione originale', () => {
    expect(filterProducts(products, 'moz')).toEqual([
      { item: 'Mozzarella', index: 1 },
      { item: 'Mozzarella di bufala', index: 2 },
    ]);
    expect(filterProducts(products, 'BUFALA').map(p => p.item)).toEqual(['Mozzarella di bufala']);
  });

  it('ignora gli accenti nella ricerca', () => {
    expect(filterProducts(products, 'caffe').map(p => p.item)).toEqual(['Caffè']);
    expect(filterProducts(products, 'caffè').map(p => p.item)).toEqual(['Caffè']);
  });

  it('con ricerca vuota restituisce tutto', () => {
    expect(filterProducts(products, '   ')).toHaveLength(products.length);
  });

  it('riconosce un prodotto già presente', () => {
    expect(productExists(products, ' mozzarella ')).toBe(true);
    expect(productExists(products, 'Caffe')).toBe(true);
    expect(productExists(products, 'Mozza')).toBe(false);
  });
});
