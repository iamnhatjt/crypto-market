import { expect, Locator, Page } from '@playwright/test';

/** Card locators are keyed by coin id, which is stable across sorting/filtering. */
export function card(page: Page, coinId: string): Locator {
  return page.locator(`[data-coin-id="${coinId}"]`);
}

export function cards(page: Page): Locator {
  return page.getByTestId('coin-card');
}

/** Coin ids in the order they currently appear in the grid. */
export async function visibleCoinIds(page: Page): Promise<string[]> {
  await expect(cards(page).first()).toBeVisible();
  return cards(page).evaluateAll((nodes) =>
    nodes.map((node) => node.getAttribute('data-coin-id') ?? '')
  );
}

/** Wait for the grid to settle on a given number of cards. */
export async function expectCardCount(page: Page, count: number): Promise<void> {
  await expect(cards(page)).toHaveCount(count);
}

interface Rgb {
  r: number;
  g: number;
  b: number;
}

/** Resolve an element's rendered text colour so we can assert "green" vs "red". */
export async function textColor(locator: Locator): Promise<Rgb> {
  const raw = await locator.evaluate((el) => getComputedStyle(el).color);
  const match = raw.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);

  if (!match) {
    throw new Error(`Could not parse computed colour "${raw}"`);
  }

  return { r: Number(match[1]), g: Number(match[2]), b: Number(match[3]) };
}

/** How many cards sit on the same top edge as the first card — i.e. the column count. */
export async function firstRowColumnCount(page: Page): Promise<number> {
  await expect(cards(page).first()).toBeVisible();

  const tops = await cards(page).evaluateAll((nodes) =>
    nodes.map((node) => Math.round(node.getBoundingClientRect().top))
  );

  if (tops.length === 0) {
    return 0;
  }

  // Allow a 2px tolerance for sub-pixel layout rounding.
  const firstTop = tops[0];
  return tops.filter((top) => Math.abs(top - firstTop) <= 2).length;
}
