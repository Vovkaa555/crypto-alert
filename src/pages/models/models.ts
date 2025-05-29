export interface MarketData {
  symbol: string;
  last: string;
  changeRate: string;
  vol: string;
  buy: string;
  sell: string;
  high: string;
  low: string;
  volValue: string;
  buyChangePercent?: number;
}

export type Order = 'asc' | 'desc';

export interface CryptoTableProps {
  data: MarketData[];
  alertsEnabled: boolean;
}
