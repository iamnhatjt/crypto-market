import { PricePoint } from '../types/coin';

/**
 * Upper bound on plotted points.
 *
 * The 90-day range returns ~2161 hourly points for a chart around 800px wide —
 * roughly 2.7 points per pixel, so most of them cannot be seen. Downsampling
 * keeps the path small without changing the shape.
 */
const MAX_PLOTTED_POINTS = 600;

interface SeriesBounds {
  minPrice: number;
  maxPrice: number;
  firstTime: number;
  lastTime: number;
}

export function seriesBounds(points: PricePoint[]): SeriesBounds | null {
  if (points.length === 0) {
    return null;
  }

  let minPrice = points[0].price;
  let maxPrice = points[0].price;

  for (const point of points) {
    if (point.price < minPrice) {
      minPrice = point.price;
    }
    if (point.price > maxPrice) {
      maxPrice = point.price;
    }
  }

  return {
    minPrice,
    maxPrice,
    firstTime: points[0].time,
    lastTime: points[points.length - 1].time,
  };
}

/**
 * Reduce a long series to at most `limit` points.
 *
 * Plain stride sampling would be enough for the shape but could drop the actual
 * high or low, which are the two values a reader looks for. The extremes are
 * therefore always retained, along with the first and last point.
 */
export function downsample(points: PricePoint[], limit: number = MAX_PLOTTED_POINTS): PricePoint[] {
  if (points.length <= limit) {
    return points;
  }

  const bounds = seriesBounds(points);
  const stride = Math.ceil(points.length / limit);
  const keep = new Set<number>([0, points.length - 1]);

  for (let index = 0; index < points.length; index += stride) {
    keep.add(index);
  }

  // Guarantee the extremes survive, whichever buckets they fall in.
  points.forEach((point, index) => {
    if (bounds !== null && (point.price === bounds.minPrice || point.price === bounds.maxPrice)) {
      keep.add(index);
    }
  });

  // Array.from rather than spread: CRA's tsconfig targets ES5.
  return Array.from(keep)
    .sort((a, b) => a - b)
    .map((index) => points[index]);
}

interface Projection {
  x: (time: number) => number;
  y: (price: number) => number;
}

/**
 * Map data space onto the viewBox.
 *
 * Both axes guard against a zero span: a single point, or a series where every
 * price is identical, would otherwise divide by zero and emit NaN coordinates.
 * A degenerate axis is drawn down the middle instead.
 */
export function projection(bounds: SeriesBounds, width: number, height: number): Projection {
  const timeSpan = bounds.lastTime - bounds.firstTime;
  const priceSpan = bounds.maxPrice - bounds.minPrice;

  return {
    x: (time) =>
      timeSpan === 0 ? width / 2 : ((time - bounds.firstTime) / timeSpan) * width,
    y: (price) =>
      priceSpan === 0 ? height / 2 : height - ((price - bounds.minPrice) / priceSpan) * height,
  };
}

/** SVG path for the line itself. */
export function toLinePath(points: PricePoint[], project: Projection): string {
  return points
    .map(
      (point, index) =>
        `${index === 0 ? 'M' : 'L'}${project.x(point.time).toFixed(2)} ${project
          .y(point.price)
          .toFixed(2)}`
    )
    .join(' ');
}

/** The same line closed along the baseline, for the gradient fill. */
export function toAreaPath(points: PricePoint[], project: Projection, height: number): string {
  if (points.length === 0) {
    return '';
  }

  const line = toLinePath(points, project);
  const lastX = project.x(points[points.length - 1].time).toFixed(2);
  const firstX = project.x(points[0].time).toFixed(2);

  return `${line} L${lastX} ${height} L${firstX} ${height} Z`;
}

/** Direction of the range as a whole: first point compared with the last. */
export function seriesTrend(points: PricePoint[]): 'up' | 'down' | 'flat' {
  if (points.length < 2) {
    return 'flat';
  }

  const first = points[0].price;
  const last = points[points.length - 1].price;

  if (last > first) {
    return 'up';
  }

  return last < first ? 'down' : 'flat';
}

/** Index of the point nearest a fractional position across the chart width. */
export function nearestIndex(points: PricePoint[], ratio: number): number {
  if (points.length === 0) {
    return -1;
  }

  const clamped = Math.min(Math.max(ratio, 0), 1);

  return Math.round(clamped * (points.length - 1));
}
