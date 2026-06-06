import { describe, it, expect } from 'vitest';
import { formatPrice, clampQty } from '../lib/helpers';

// ---------------------------------------------------------------------------
// formatPrice
// ---------------------------------------------------------------------------
describe('formatPrice', () => {
  it('formats whole pounds correctly', () => {
    expect(formatPrice(1000)).toBe('£10.00');
  });

  it('formats pence-only amounts', () => {
    expect(formatPrice(99)).toBe('£0.99');
  });

  it('formats zero as £0.00', () => {
    expect(formatPrice(0)).toBe('£0.00');
  });

  it('formats large amounts with comma separator', () => {
    expect(formatPrice(100000)).toBe('£1,000.00');
  });

  it('handles a typical product price', () => {
    expect(formatPrice(1250)).toBe('£12.50');
  });

  it('handles 1 pence', () => {
    expect(formatPrice(1)).toBe('£0.01');
  });
});

// ---------------------------------------------------------------------------
// clampQty - cart quantity clamping logic
// clampQty(requested, stock) must never exceed stock or go below 1
// ---------------------------------------------------------------------------
describe('clampQty', () => {
  it('returns the requested qty when within stock', () => {
    expect(clampQty(3, 10)).toBe(3);
  });

  it('clamps to stock when requested exceeds stock', () => {
    expect(clampQty(15, 5)).toBe(5);
  });

  it('clamps to 1 when requested is 0', () => {
    expect(clampQty(0, 10)).toBe(1);
  });

  it('clamps to 1 when requested is negative', () => {
    expect(clampQty(-5, 10)).toBe(1);
  });

  it('returns stock when stock is exactly 1', () => {
    expect(clampQty(3, 1)).toBe(1);
  });

  it('returns 1 when stock is 0 (edge case)', () => {
    expect(clampQty(2, 0)).toBe(1);
  });

  it('returns exact stock when requested equals stock', () => {
    expect(clampQty(7, 7)).toBe(7);
  });
});
