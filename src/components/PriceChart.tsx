import React, { useMemo, useRef, useState } from 'react';
import {
  downsample,
  nearestIndex,
  projection,
  seriesBounds,
  seriesTrend,
  toAreaPath,
  toLinePath,
} from '../lib/chart';
import { formatPrice } from '../lib/format';
import { PricePoint } from '../types/coin';

/**
 * viewBox units, not pixels. The SVG scales to its container, so the geometry
 * is computed once in a fixed space instead of being tied to a measured width.
 */
const VIEW_WIDTH = 800;
const VIEW_HEIGHT = 260;

const TREND_STROKE: Record<string, string> = {
  up: 'stroke-emerald-500',
  down: 'stroke-rose-500',
  flat: 'stroke-slate-400',
};

const TREND_FILL: Record<string, string> = {
  up: 'fill-emerald-500/10',
  down: 'fill-rose-500/10',
  flat: 'fill-slate-400/10',
};

function formatPointTime(time: number, range: number): string {
  const date = new Date(time);

  // Intraday ranges want a clock; longer ones want a date.
  return range <= 1
    ? new Intl.DateTimeFormat('en-GB', {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'UTC',
      }).format(date)
    : new Intl.DateTimeFormat('en-GB', {
        day: 'numeric',
        month: 'short',
        timeZone: 'UTC',
      }).format(date);
}

interface PriceChartProps {
  points: PricePoint[];
  /** Range in days, used only to decide time-label formatting. */
  range: number;
}

function PriceChart({ points, range }: PriceChartProps) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const plotted = useMemo(() => downsample(points), [points]);
  // Bounds come from the FULL series: downsampling must not change the reported
  // high and low even though it changes what is drawn.
  const bounds = useMemo(() => seriesBounds(points), [points]);
  const trend = useMemo(() => seriesTrend(points), [points]);

  const geometry = useMemo(() => {
    if (bounds === null) {
      return null;
    }

    const project = projection(bounds, VIEW_WIDTH, VIEW_HEIGHT);

    return {
      project,
      line: toLinePath(plotted, project),
      area: toAreaPath(plotted, project, VIEW_HEIGHT),
    };
  }, [bounds, plotted]);

  if (bounds === null || geometry === null) {
    return (
      <div
        data-testid="chart-empty"
        className="flex h-64 items-center justify-center rounded-xl border border-slate-200 bg-white text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400"
      >
        No price history available for this range.
      </div>
    );
  }

  const hovered = hoverIndex === null ? null : (plotted[hoverIndex] ?? null);

  /**
   * Pointer events rather than mouse events, so a tap on a touch screen can
   * inspect a point too — a hover-only tooltip is unusable on a phone.
   */
  const handleMove = (event: React.PointerEvent<SVGSVGElement>) => {
    const svg = svgRef.current;

    if (svg === null) {
      return;
    }

    const box = svg.getBoundingClientRect();
    const ratio = box.width === 0 ? 0 : (event.clientX - box.left) / box.width;

    setHoverIndex(nearestIndex(plotted, ratio));
  };

  return (
    <figure className="relative rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
      <div className="mb-2 flex items-baseline justify-between text-xs text-slate-500 dark:text-slate-400">
        <span data-testid="chart-max">High {formatPrice(bounds.maxPrice)}</span>
        <span data-testid="chart-min">Low {formatPrice(bounds.minPrice)}</span>
      </div>

      <svg
        ref={svgRef}
        data-testid="price-chart"
        data-point-count={plotted.length}
        data-trend={trend}
        viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
        preserveAspectRatio="none"
        role="img"
        aria-label={`Price history, high ${formatPrice(bounds.maxPrice)}, low ${formatPrice(
          bounds.minPrice
        )}`}
        className="h-56 w-full touch-none"
        onPointerMove={handleMove}
        onPointerDown={handleMove}
        // A tap fires pointerleave the moment it ends, so clearing on leave for
        // every pointer type would make the tooltip flash and vanish on touch.
        // Mouse hover is continuous and should clear; a tap is a discrete
        // selection that stays until the next one.
        onPointerLeave={(event) => {
          if (event.pointerType === 'mouse') {
            setHoverIndex(null);
          }
        }}
        onPointerCancel={() => setHoverIndex(null)}
      >
        <path data-testid="chart-area" d={geometry.area} className={TREND_FILL[trend]} />

        <path
          data-testid="chart-line"
          d={geometry.line}
          fill="none"
          strokeWidth={2}
          vectorEffect="non-scaling-stroke"
          strokeLinejoin="round"
          strokeLinecap="round"
          className={TREND_STROKE[trend]}
        />

        {hovered !== null && (
          <line
            x1={geometry.project.x(hovered.time)}
            x2={geometry.project.x(hovered.time)}
            y1={0}
            y2={VIEW_HEIGHT}
            strokeWidth={1}
            vectorEffect="non-scaling-stroke"
            className="stroke-slate-400/60"
          />
        )}
      </svg>

      <figcaption className="mt-2 flex justify-between text-xs text-slate-400 dark:text-slate-500">
        <span>{formatPointTime(bounds.firstTime, range)}</span>
        <span>{formatPointTime(bounds.lastTime, range)}</span>
      </figcaption>

      {hovered !== null && (
        <div
          data-testid="chart-tooltip"
          className="pointer-events-none absolute right-4 top-4 rounded-lg bg-slate-900/90 px-3 py-2 text-right text-xs font-medium text-white shadow-lg dark:bg-slate-100/90 dark:text-slate-900"
        >
          <div className="text-sm font-semibold tabular-nums">{formatPrice(hovered.price)}</div>
          <div className="opacity-70">{formatPointTime(hovered.time, range)}</div>
        </div>
      )}
    </figure>
  );
}

export default PriceChart;
