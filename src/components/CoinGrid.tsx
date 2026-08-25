import React from 'react';
import CoinCard from './CoinCard';
import { Coin } from '../types/coin';

interface CoinGridProps {
  coins: Coin[];
}

/**
 * 1 column on mobile, 2 from the `sm` breakpoint (covers tablets), 3 at `lg`
 * and 4 at `xl`, matching the responsive brief.
 */
export const GRID_CLASSES = 'grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4';

function CoinGrid({ coins }: CoinGridProps) {
  return (
    <div data-testid="coin-grid" className={GRID_CLASSES}>
      {coins.map((coin) => (
        <CoinCard key={coin.id} coin={coin} />
      ))}
    </div>
  );
}

export default CoinGrid;
