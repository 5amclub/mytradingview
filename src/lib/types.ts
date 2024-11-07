import { Trade } from "@prisma/client"

export interface ITradeView extends Trade {
    averageProfitPerDay: number
    maximumProfit: number
    maximumRisk: number
    maxReturn: number
    maxAnnualizedReturn: number
    actualProfit: number
    actualAnnualizedReturn: number
    actualProfitPerDay: number
    remainingProfitPerDay: number
    buyCost: number,
    sellCost: number,
    isClosed: boolean,
    contractCurrentPrice?: number
}

export type StockPriceData = {
    item: SearchTickerItem,
    quoteSummary: {
        marketState: 'POST' | 'REGULAR' | 'POSTPOST' | 'PRE',
        hasPrePostMarketData: boolean,
        regularMarketPrice: number,
        regularMarketChange: number,
        regularMarketChangePercent: number,
        postMarketPrice: number,
        postMarketChange: number,
        postMarketChangePercent: number,
        preMarketPrice: number,
        preMarketChange: number,
        preMarketChangePercent: number
    }
}

export type TradierOptionData = {
    options: {
      option: {
        strike: number,
        open_interest: number,
        bid: number,
        ask: number,
        last: number,
        volume: number,
        expiration_date: string,
        option_type: 'put' | 'call',
        greeks: {
          delta: number,
          gamma: number
        }
      }[]
    }
  }

export type IOptionsGrid = {
    id: string
}

export type NumberRange = { start: number, end: number }


export type OptionsInnerData = {
    c: Record<string, {
        a: number,
        b: number,
        l: number,
        oi: number,
        v: number
    }>,
    p: Record<string, {
        a: number,
        b: number,
        l: number,
        oi: number,
        v: number
    }>
}

export type SearchTickerResult = { items: SearchTickerItem[] };
export type SearchTickerItem = { symbol: string, name: string }
export type AddTickerToMyListResult = { success: boolean }


type HistoricalDataItem = {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

type HistoricalData = {
  day: HistoricalDataItem[];
};

export type HistoricalDataResponse = {
  history: HistoricalData;
};

export type EarningsSeason = {
  open: number,
  close: number,
  closePercentage: number;
  openPercentage: number;
  nextClosePercentage?: number;
  nextOpenPercentage?: number;
  nextClose?: number;
  nextOpen?: number;
  date: string; 
}

export type ABCType = { ask: number, bid: number, last: number, volume: number, open_interest: number, strike: number, greeks: { delta: number, gamma: number } };
export type minimap = { a: number, b: number, l: number, v: number, oi: number, s: number, g: { d: number, g: number } };
export type XYZType = {date: string, dte: number, c: minimap[],  p: minimap[]};