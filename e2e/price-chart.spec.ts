/**
 * Journey 15
 * As a crypto watcher, I want to see a coin's price over a range I choose, so
 * that I can tell whether today's move is noise or a trend.
 *
 * The chart is inline SVG rather than a canvas library, chosen because this
 * project tests only through Playwright: an SVG path, its point count and its
 * labels are all assertable, whereas a canvas would need pixel snapshots.
 */
import { test, expect } from '@playwright/test';
import { mockCoinChart, mockCoinDetail } from './helpers/mockApi';
import { emptySeries, makeFlatSeries, makeSeries } from './fixtures/chart';

/** Every test needs the detail request satisfied too; the page renders both. */
async function open(page: import('@playwright/test').Page) {
  await mockCoinDetail(page);
  await page.goto('/coins/bitcoin');
  await expect(page.getByTestId('coin-detail-name')).toBeVisible();
}

test.describe('rendering', () => {
  test('draws a chart for the default range', async ({ page }) => {
    await mockCoinChart(page, { series: makeSeries(169) });
    await open(page);

    await expect(page.getByTestId('price-chart')).toBeVisible();
    await expect(page.getByTestId('chart-line')).toBeVisible();
  });

  test('plots every point in the series', async ({ page }) => {
    await mockCoinChart(page, { series: makeSeries(169) });
    await open(page);

    await expect(page.getByTestId('price-chart')).toHaveAttribute('data-point-count', '169');
  });

  test('labels the highest and lowest price in the range', async ({ page }) => {
    // Plant a known min and max rather than relying on the drift.
    await mockCoinChart(page, {
      series: makeSeries(50, { startPrice: 100, drift: 1, spikes: { 10: 12.5, 40: 987.5 } }),
    });
    await open(page);

    await expect(page.getByTestId('chart-max')).toContainText('$987.50');
    await expect(page.getByTestId('chart-min')).toContainText('$12.50');
  });

  test('rounds a full-precision price to cents', async ({ page }) => {
    // Chart series carry unrounded floats, unlike /coins/markets. Eight decimal
    // places is right for a sub-cent coin and absurd for a four-figure price.
    await mockCoinChart(page, {
      series: makeSeries(20, { startPrice: 2000, drift: 1, spikes: { 15: 2524.34151352 } }),
    });
    await open(page);

    // Exact text, not substring: "$2,524.34" is a prefix of "$2,524.34151352".
    await expect(page.getByTestId('chart-max')).toHaveText('High $2,524.34');
  });

  test('still keeps precision on a sub-cent series', async ({ page }) => {
    await mockCoinChart(page, {
      series: makeSeries(20, { startPrice: 0.00001, drift: 0, spikes: { 5: 0.00002341 } }),
    });
    await open(page);

    await expect(page.getByTestId('chart-max')).toHaveText('High $0.00002341');
  });

  test('draws the line green when the range closed higher', async ({ page }) => {
    await mockCoinChart(page, { series: makeSeries(60, { startPrice: 100, drift: 2 }) });
    await open(page);

    await expect(page.getByTestId('price-chart')).toHaveAttribute('data-trend', 'up');
  });

  test('draws the line red when the range closed lower', async ({ page }) => {
    await mockCoinChart(page, { series: makeSeries(60, { startPrice: 500, drift: -2 }) });
    await open(page);

    await expect(page.getByTestId('price-chart')).toHaveAttribute('data-trend', 'down');
  });
});

test.describe('ranges', () => {
  test('requests 7 days by default', async ({ page }) => {
    const state = await mockCoinChart(page);
    await open(page);
    await expect(page.getByTestId('price-chart')).toBeVisible();

    expect(state.requestedDays).toEqual(['7']);
  });

  const ranges = ['1', '30', '90', '365'];

  for (const days of ranges) {
    test(`the ${days}D control requests days=${days}`, async ({ page }) => {
      const state = await mockCoinChart(page);
      await open(page);
      await expect(page.getByTestId('price-chart')).toBeVisible();

      await page.getByTestId(`chart-range-${days}`).click();

      await expect.poll(() => state.requestedDays).toContain(days);
    });
  }

  test('does not offer a range the API rejects', async ({ page }) => {
    await mockCoinChart(page);
    await open(page);

    // days=max returns error 10012 on the free tier.
    await expect(page.getByTestId('chart-range-max')).toHaveCount(0);
  });

  test('marks the active range', async ({ page }) => {
    await mockCoinChart(page);
    await open(page);
    await expect(page.getByTestId('price-chart')).toBeVisible();

    await expect(page.getByTestId('chart-range-7')).toHaveAttribute('aria-pressed', 'true');

    await page.getByTestId('chart-range-30').click();

    await expect(page.getByTestId('chart-range-30')).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByTestId('chart-range-7')).toHaveAttribute('aria-pressed', 'false');
  });

  test('renders the series for the newly chosen range', async ({ page }) => {
    // Both series stay under the downsampling limit, so this test is about the
    // range switch alone; downsampling has its own test below.
    await mockCoinChart(page, {
      byDays: { '7': makeSeries(169), '30': makeSeries(400) },
    });
    await open(page);
    await expect(page.getByTestId('price-chart')).toHaveAttribute('data-point-count', '169');

    await page.getByTestId('chart-range-30').click();

    await expect(page.getByTestId('price-chart')).toHaveAttribute('data-point-count', '400');
  });

  test('caches each range, so going back costs no request', async ({ page }) => {
    const state = await mockCoinChart(page);
    await open(page);
    await expect(page.getByTestId('price-chart')).toBeVisible();

    await page.getByTestId('chart-range-30').click();
    await expect(page.getByTestId('chart-range-30')).toHaveAttribute('aria-pressed', 'true');

    await page.getByTestId('chart-range-7').click();
    await expect(page.getByTestId('chart-range-7')).toHaveAttribute('aria-pressed', 'true');

    await page.waitForTimeout(400);
    expect(state.requestedDays).toEqual(['7', '30']);
  });

  test('changing range does not refetch the coin detail', async ({ page }) => {
    const detail = await mockCoinDetail(page);
    await mockCoinChart(page);
    await page.goto('/coins/bitcoin');
    await expect(page.getByTestId('price-chart')).toBeVisible();
    const before = detail.requestedIds.length;

    await page.getByTestId('chart-range-90').click();
    await expect(page.getByTestId('chart-range-90')).toHaveAttribute('aria-pressed', 'true');

    expect(detail.requestedIds.length).toBe(before);
  });
});

test.describe('hovering', () => {
  // A mouse hover cannot be produced on a touch-only device; the equivalent
  // touch interaction is covered by its own test below.
  test.skip(({ isMobile }) => Boolean(isMobile), 'pointer hover; touch covered separately');

  test('shows the price at the hovered point', async ({ page }) => {
    await mockCoinChart(page, { series: makeSeries(100, { startPrice: 100, drift: 1 }) });
    await open(page);
    const chart = page.getByTestId('price-chart');
    await expect(chart).toBeVisible();

    const box = await chart.boundingBox();
    if (box === null) throw new Error('chart has no bounding box');

    // Far right edge is the last point: 100 + 99 * 1 = 199.
    await page.mouse.move(box.x + box.width - 2, box.y + box.height / 2);

    await expect(page.getByTestId('chart-tooltip')).toBeVisible();
    await expect(page.getByTestId('chart-tooltip')).toContainText('$199.00');
  });

  test('hides the tooltip when the pointer leaves', async ({ page }) => {
    await mockCoinChart(page, { series: makeSeries(100) });
    await open(page);
    const chart = page.getByTestId('price-chart');
    const box = await chart.boundingBox();
    if (box === null) throw new Error('chart has no bounding box');

    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await expect(page.getByTestId('chart-tooltip')).toBeVisible();

    await page.mouse.move(box.x - 40, box.y - 40);

    await expect(page.getByTestId('chart-tooltip')).toBeHidden();
  });
});

test.describe('awkward series', () => {
  test('an empty series shows an empty state, not a broken chart', async ({ page }) => {
    await mockCoinChart(page, { series: emptySeries });
    await open(page);

    await expect(page.getByTestId('chart-empty')).toBeVisible();
    await expect(page.getByTestId('chart-line')).toHaveCount(0);
  });

  test('a single point renders without crashing', async ({ page }) => {
    await mockCoinChart(page, { series: makeSeries(1, { startPrice: 55 }) });
    await open(page);

    await expect(page.getByTestId('price-chart')).toBeVisible();
    await expect(page.getByTestId('chart-max')).toContainText('$55.00');
  });

  test('a flat series produces a valid path, with no NaN coordinates', async ({ page }) => {
    await mockCoinChart(page, { series: makeFlatSeries(50) });
    await open(page);

    const path = await page.getByTestId('chart-line').getAttribute('d');
    expect(path).not.toBeNull();
    expect(path).not.toContain('NaN');
    expect(path).not.toContain('Infinity');
    await expect(page.getByTestId('price-chart')).toHaveAttribute('data-trend', 'flat');
  });

  test('a long series is downsampled but keeps its true high and low', async ({ page }) => {
    await mockCoinChart(page, {
      series: makeSeries(2500, { startPrice: 100, drift: 1, spikes: { 7: 3.25, 1900: 9999.75 } }),
    });
    await open(page);

    const rendered = Number(
      await page.getByTestId('price-chart').getAttribute('data-point-count')
    );

    // 2500 points over ~800px is wasted detail; the extremes must survive it.
    expect(rendered).toBeLessThan(2500);
    expect(rendered).toBeGreaterThan(100);
    await expect(page.getByTestId('chart-max')).toContainText('$9,999.75');
    await expect(page.getByTestId('chart-min')).toContainText('$3.25');
  });
});

test.describe('failure', () => {
  test('a chart error does not blank the statistics', async ({ page }) => {
    await mockCoinChart(page, { status: 500 });
    await open(page);

    await expect(page.getByTestId('chart-error')).toBeVisible();
    // The stats came from a different request and must survive.
    await expect(page.getByTestId('stat-market-cap')).toBeVisible();
    await expect(page.getByTestId('coin-detail-price')).toBeVisible();
  });

  test('the chart retry recovers on its own', async ({ page }) => {
    const state = await mockCoinChart(page, { failUntilRecovered: true });
    await open(page);
    await expect(page.getByTestId('chart-error')).toBeVisible();

    state.recover();
    await page.getByTestId('chart-retry').click();

    await expect(page.getByTestId('price-chart')).toBeVisible();
    await expect(page.getByTestId('chart-error')).toHaveCount(0);
  });

  test('shows a skeleton while the series loads', async ({ page }) => {
    await mockCoinChart(page, { delayMs: 1500 });
    await open(page);

    await expect(page.getByTestId('chart-skeleton')).toBeVisible();
    await expect(page.getByTestId('price-chart')).toBeVisible();
    await expect(page.getByTestId('chart-skeleton')).toBeHidden();
  });
});

test.describe('touch', () => {
  test.skip(({ isMobile }) => !isMobile, 'touch interaction; runs on the mobile project only');

  test('tapping the chart reveals the price at that point', async ({ page }) => {
    await mockCoinChart(page, { series: makeSeries(100, { startPrice: 100, drift: 1 }) });
    await open(page);
    const chart = page.getByTestId('price-chart');
    await expect(chart).toBeVisible();

    const box = await chart.boundingBox();
    if (box === null) throw new Error('chart has no bounding box');

    await page.touchscreen.tap(box.x + box.width - 2, box.y + box.height / 2);

    await expect(page.getByTestId('chart-tooltip')).toBeVisible();
    // The series runs $100 to $199. Which of the last points a tap two pixels
    // from the edge maps to depends on the device width, so this asserts the
    // tap read a point near where it landed rather than pinning one index.
    await expect(page.getByTestId('chart-tooltip')).toHaveText(/\$19[5-9]\.00/);
  });
});
