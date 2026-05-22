import express from 'express';
import fetch from 'node-fetch';
import Investment from '../models/Investment.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Middleware de autenticación para todas las rutas
router.use(authenticateToken);

// Configuración de APIs externas
const ALPHA_VANTAGE_API_KEY = process.env.ALPHA_VANTAGE_API_KEY;
const COINGECKO_API_BASE = 'https://api.coingecko.com/api/v3';
const YAHOO_FINANCE_API_BASE = 'https://query1.finance.yahoo.com/v8/finance/chart';

// GET /api/market/search - Buscar activos de mercado
router.get('/search', async (req, res) => {
  try {
    const { query, type = 'all', limit = 10 } = req.query;

    if (!query) {
      return res.status(400).json({
        success: false,
        message: 'Query de búsqueda requerido'
      });
    }

    const results = await Promise.all([
      searchStocks(query, limit),
      searchCrypto(query, limit),
      searchETFs(query, limit)
    ]);

    const allResults = [...results[0], ...results[1], ...results[2]]
      .slice(0, parseInt(limit));

    res.json({
      success: true,
      data: allResults
    });
  } catch (error) {
    console.error('Error searching market assets:', error);
    res.status(500).json({
      success: false,
      message: 'Error al buscar activos de mercado'
    });
  }
});

// GET /api/market/quote/:symbol - Obtener cotización en tiempo real
router.get('/quote/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const { type = 'stock' } = req.query;

    let quoteData;

    switch (type) {
      case 'stock':
        quoteData = await getStockQuote(symbol);
        break;
      case 'crypto':
        quoteData = await getCryptoQuote(symbol);
        break;
      case 'etf':
        quoteData = await getETFQuote(symbol);
        break;
      default:
        quoteData = await getStockQuote(symbol);
    }

    res.json({
      success: true,
      data: quoteData
    });
  } catch (error) {
    console.error('Error fetching quote:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener cotización'
    });
  }
});

// GET /api/market/historical/:symbol - Obtener datos históricos
router.get('/historical/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const { period = '1M', type = 'daily' } = req.query;

    const historicalData = await getHistoricalData(symbol, period, type);

    res.json({
      success: true,
      data: historicalData
    });
  } catch (error) {
    console.error('Error fetching historical data:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener datos históricos'
    });
  }
});

// GET /api/market/portfolio/update - Actualizar precios del portafolio
router.post('/portfolio/update', async (req, res) => {
  try {
    const userId = req.user._id;

    // Obtener todas las inversiones activas
    const investments = await Investment.getActiveInvestments(userId);

    const updatePromises = investments.map(async (investment) => {
      try {
        let quoteData;
        
        switch (investment.type) {
          case 'stock':
          case 'etf':
            quoteData = await getStockQuote(investment.symbol);
            break;
          case 'crypto':
            quoteData = await getCryptoQuote(investment.symbol);
            break;
          default:
            quoteData = await getStockQuote(investment.symbol);
        }

        if (quoteData && quoteData.price) {
          await investment.updateCurrentPrice(
            quoteData.price,
            quoteData.currency || 'USD',
            quoteData.source || 'market-api'
          );
        }

        return {
          symbol: investment.symbol,
          type: investment.type,
          success: true,
          price: quoteData?.price || 0,
          previousPrice: investment.currentData.price
        };
      } catch (error) {
        console.error(`Error updating ${investment.symbol}:`, error);
        return {
          symbol: investment.symbol,
          type: investment.type,
          success: false,
          error: error.message
        };
      }
    });

    const results = await Promise.all(updatePromises);
    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);

    res.json({
      success: true,
      data: {
        updated: successful.length,
        failed: failed.length,
        results: results,
        summary: {
          totalValue: successful.reduce((sum, r) => sum + (r.price * 100), 0),
          totalChange: successful.reduce((sum, r) => sum + (r.price - r.previousPrice), 0)
        }
      }
    });
  } catch (error) {
    console.error('Error updating portfolio:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar portafolio'
    });
  }
});

// GET /api/market/market-overview - Visión general del mercado
router.get('/market-overview', async (req, res) => {
  try {
    const { market = 'us' } = req.query;

    const [indices, cryptoOverview, marketNews] = await Promise.all([
      getMarketIndices(market),
      getCryptoOverview(),
      getMarketNews()
    ]);

    res.json({
      success: true,
      data: {
        indices,
        crypto: cryptoOverview,
        news: marketNews,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error fetching market overview:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener visión general del mercado'
    });
  }
});

// GET /api/market/sector-performance - Rendimiento por sector
router.get('/sector-performance', async (req, res) => {
  try {
    const { market = 'us' } = req.query;

    const sectorData = await getSectorPerformance(market);

    res.json({
      success: true,
      data: sectorData
    });
  } catch (error) {
    console.error('Error fetching sector performance:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener rendimiento por sector'
    });
  }
});

// GET /api/market/crypto/overview - Visión general de criptomonedas
router.get('/crypto/overview', async (req, res) => {
  try {
    const [topCryptos, cryptoStats, marketData] = await Promise.all([
      getTopCryptos(),
      getCryptoStats(),
      getCryptoMarketData()
    ]);

    res.json({
      success: true,
      data: {
        topCryptos,
        stats: cryptoStats,
        market: marketData
      }
    });
  } catch (error) {
    console.error('Error fetching crypto overview:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener visión general de criptomonedas'
    });
  }
});

// GET /api/market/forex/rates - Tasas de cambio
router.get('/forex/rates', async (req, res) => {
  try {
    const { base = 'USD', symbols = 'EUR,GBP,JPY,COP' } = req.query;

    const forexRates = await getForexRates(base, symbols);

    res.json({
      success: true,
      data: forexRates
    });
  } catch (error) {
    console.error('Error fetching forex rates:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener tasas de cambio'
    });
  }
});

// GET /api/market/dividends/:symbol - Información de dividendos
router.get('/dividends/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;

    const dividendData = await getDividendData(symbol);

    res.json({
      success: true,
      data: dividendData
    });
  } catch (error) {
    console.error('Error fetching dividend data:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener información de dividendos'
    });
  }
});

// GET /api/market/technical/:symbol - Análisis técnico
router.get('/technical/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const { indicators = 'RSI,MACD,SMA' } = req.query;

    const technicalData = await getTechnicalAnalysis(symbol, indicators);

    res.json({
      success: true,
      data: technicalData
    });
  } catch (error) {
    console.error('Error fetching technical analysis:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener análisis técnico'
    });
  }
});

// GET /api/market/screener - Screener de mercado
router.get('/screener', async (req, res) => {
  try {
    const {
      market = 'us',
      sector = 'all',
      minMarketCap = 0,
      maxMarketCap = null,
      minPE = 0,
      maxPE = null,
      minDividend = 0,
      sort = 'marketCap',
      order = 'desc',
      limit = 50
    } = req.query;

    const screenerResults = await runScreener({
      market,
      sector,
      minMarketCap: parseFloat(minMarketCap),
      maxMarketCap: maxMarketCap ? parseFloat(maxMarketCap) : null,
      minPE: parseFloat(minPE),
      maxPE: maxPE ? parseFloat(maxPE) : null,
      minDividend: parseFloat(minDividend),
      sort,
      order,
      limit: parseInt(limit)
    });

    res.json({
      success: true,
      data: screenerResults
    });
  } catch (error) {
    console.error('Error running screener:', error);
    res.status(500).json({
      success: false,
      message: 'Error al ejecutar screener'
    });
  }
});

// Funciones auxiliares para APIs externas
async function searchStocks(query, limit = 10) {
  try {
    if (!ALPHA_VANTAGE_API_KEY) {
      return [];
    }

    const response = await fetch(
      `https://www.alphavantage.co/query?function=SYMBOL_SEARCH&keywords=${query}&apikey=${ALPHA_VANTAGE_API_KEY}`
    );

    const data = await response.json();
    
    if (data.bestMatches) {
      return data.bestMatches
        .filter(match => match['3. type'] === 'Equity')
        .slice(0, limit)
        .map(match => ({
          symbol: match['1. symbol'],
          name: match['2. name'],
          type: 'stock',
          exchange: match['4. region'],
          currency: 'USD',
          marketCap: null,
          price: null
        }));
    }

    return [];
  } catch (error) {
    console.error('Error searching stocks:', error);
    return [];
  }
}

async function searchCrypto(query, limit = 10) {
  try {
    const response = await fetch(
      `${COINGECKO_API_BASE}/search?query=${query}`
    );

    const data = await response.json();

    if (data.coins) {
      return data.coins
        .slice(0, limit)
        .map(coin => ({
          symbol: coin.symbol.toUpperCase(),
          name: coin.name,
          type: 'crypto',
          exchange: 'CRYPTO',
          currency: 'USD',
          marketCap: coin.market_cap_rank ? `Rank #${coin.market_cap_rank}` : null,
          price: null
        }));
    }

    return [];
  } catch (error) {
    console.error('Error searching crypto:', error);
    return [];
  }
}

async function searchETFs(query, limit = 10) {
  try {
    // Usar Alpha Vantage para ETFs
    if (!ALPHA_VANTAGE_API_KEY) {
      return [];
    }

    const response = await fetch(
      `https://www.alphavantage.co/query?function=SYMBOL_SEARCH&keywords=${query} ETF&apikey=${ALPHA_VANTAGE_API_KEY}`
    );

    const data = await response.json();

    if (data.bestMatches) {
      return data.bestMatches
        .filter(match => match['2. name'].toLowerCase().includes('etf'))
        .slice(0, limit)
        .map(match => ({
          symbol: match['1. symbol'],
          name: match['2. name'],
          type: 'etf',
          exchange: match['4. region'],
          currency: 'USD',
          marketCap: null,
          price: null
        }));
    }

    return [];
  } catch (error) {
    console.error('Error searching ETFs:', error);
    return [];
  }
}

async function getStockQuote(symbol) {
  try {
    if (ALPHA_VANTAGE_API_KEY) {
      const response = await fetch(
        `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${ALPHA_VANTAGE_API_KEY}`
      );

      const data = await response.json();

      if (data['Global Quote']) {
        const quote = data['Global Quote'];
        return {
          symbol: symbol,
          price: parseFloat(quote['05. price']),
          change: parseFloat(quote['09. change']),
          changePercent: parseFloat(quote['10. change percent'].replace('%', '')),
          volume: parseInt(quote['06. volume']),
          currency: 'USD',
          source: 'alpha-vantage',
          timestamp: quote['07. latest trading day']
        };
      }
    }

    // Fallback a Yahoo Finance
    const yahooResponse = await fetch(
      `${YAHOO_FINANCE_API_BASE}/${symbol}?interval=1d&range=1d`
    );

    const yahooData = await yahooResponse.json();

    if (yahooData.chart && yahooData.chart.result && yahooData.chart.result[0]) {
      const result = yahooData.chart.result[0];
      const meta = result.meta;
      const quote = result.indicators.quote[0];

      return {
        symbol: symbol,
        price: quote.close[0],
        change: quote.close[0] - meta.previousClose,
        changePercent: ((quote.close[0] - meta.previousClose) / meta.previousClose) * 100,
        volume: meta.regularMarketVolume,
        currency: meta.currency,
        source: 'yahoo-finance',
        timestamp: new Date(meta.regularMarketTime * 1000).toISOString()
      };
    }

    return null;
  } catch (error) {
    console.error('Error fetching stock quote:', error);
    return null;
  }
}

async function getCryptoQuote(symbol) {
  try {
    const response = await fetch(
      `${COINGECKO_API_BASE}/simple/price?ids=${symbol.toLowerCase()}&vs_currencies=usd&include_24hr_change=true`
    );

    const data = await response.json();

    if (data[symbol.toLowerCase()]) {
      const cryptoData = data[symbol.toLowerCase()];
      return {
        symbol: symbol.toUpperCase(),
        price: cryptoData.usd,
        change: cryptoData.usd_24h_change ? cryptoData.usd_24h_change * cryptoData.usd / 100 : 0,
        changePercent: cryptoData.usd_24h_change || 0,
        volume: null,
        currency: 'USD',
        source: 'coingecko',
        timestamp: new Date().toISOString()
      };
    }

    return null;
  } catch (error) {
    console.error('Error fetching crypto quote:', error);
    return null;
  }
}

async function getETFQuote(symbol) {
  // ETFs usan el mismo método que las acciones
  return getStockQuote(symbol);
}

async function getHistoricalData(symbol, period, type) {
  try {
    // Mapeo de períodos a días
    const periodMap = {
      '1D': 1,
      '1W': 7,
      '1M': 30,
      '3M': 90,
      '6M': 180,
      '1Y': 365,
      '2Y': 730,
      '5Y': 1825
    };

    const days = periodMap[period] || 30;

    if (ALPHA_VANTAGE_API_KEY) {
      const response = await fetch(
        `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${symbol}&outputsize=compact&apikey=${ALPHA_VANTAGE_API_KEY}`
      );

      const data = await response.json();

      if (data['Time Series (Daily)']) {
        const timeSeries = data['Time Series (Daily)'];
        const entries = Object.entries(timeSeries)
          .slice(0, days)
          .map(([date, values]) => ({
            date,
            open: parseFloat(values['1. open']),
            high: parseFloat(values['2. high']),
            low: parseFloat(values['3. low']),
            close: parseFloat(values['4. close']),
            volume: parseInt(values['5. volume'])
          }))
          .reverse();

        return {
          symbol,
          period,
          type,
          data: entries
        };
      }
    }

    // Fallback a Yahoo Finance
    const response = await fetch(
      `${YAHOO_FINANCE_API_BASE}/${symbol}?interval=1d&range=${period.toLowerCase()}`
    );

    const data = await response.json();

    if (data.chart && data.chart.result && data.chart.result[0]) {
      const result = data.chart.result[0];
      const timestamps = result.timestamp;
      const quotes = result.indicators.quote[0];

      const entries = timestamps.map((timestamp, index) => ({
        date: new Date(timestamp * 1000).toISOString().split('T')[0],
        open: quotes.open[index],
        high: quotes.high[index],
        low: quotes.low[index],
        close: quotes.close[index],
        volume: quotes.volume[index]
      }));

      return {
        symbol,
        period,
        type,
        data: entries
      };
    }

    return null;
  } catch (error) {
    console.error('Error fetching historical data:', error);
    return null;
  }
}

async function getMarketIndices(market = 'us') {
  try {
    const indices = [
      { symbol: '^GSPC', name: 'S&P 500' },
      { symbol: '^DJI', name: 'Dow Jones' },
      { symbol: '^IXIC', name: 'NASDAQ' },
      { symbol: '^VIX', name: 'VIX' }
    ];

    const quotes = await Promise.all(
      indices.map(async (index) => {
        const quote = await getStockQuote(index.symbol);
        return {
          ...index,
          ...quote
        };
      })
    );

    return quotes;
  } catch (error) {
    console.error('Error fetching market indices:', error);
    return [];
  }
}

async function getCryptoOverview() {
  try {
    const response = await fetch(
      `${COINGECKO_API_BASE}/global`
    );

    const data = await response.json();

    return {
      totalMarketCap: data.data.total_market_cap.usd,
      totalVolume24h: data.data.total_volume.usd,
      bitcoinDominance: data.data.market_cap_percentage.btc,
      activeCryptocurrencies: data.data.active_cryptocurrencies,
      marketCapChange24h: data.data.market_cap_change_percentage_24h_usd
    };
  } catch (error) {
    console.error('Error fetching crypto overview:', error);
    return null;
  }
}

async function getTopCryptos(limit = 10) {
  try {
    const response = await fetch(
      `${COINGECKO_API_BASE}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=${limit}&page=1&sparkline=false&price_change_percentage=24h`
    );

    const data = await response.json();

    return data.map(crypto => ({
      id: crypto.id,
      symbol: crypto.symbol.toUpperCase(),
      name: crypto.name,
      price: crypto.current_price,
      change24h: crypto.price_change_percentage_24h,
      marketCap: crypto.market_cap,
      volume24h: crypto.total_volume,
      rank: crypto.market_cap_rank
    }));
  } catch (error) {
    console.error('Error fetching top cryptos:', error);
    return [];
  }
}

async function getMarketNews() {
  try {
    if (!ALPHA_VANTAGE_API_KEY) {
      return [];
    }

    const response = await fetch(
      `https://www.alphavantage.co/query?function=NEWS_SENTIMENT&apikey=${ALPHA_VANTAGE_API_KEY}`
    );

    const data = await response.json();

    if (data.feed) {
      return data.feed.slice(0, 10).map(article => ({
        title: article.title,
        url: article.url,
        summary: article.summary,
        source: article.source,
        timestamp: article.time_published,
        sentiment: article.overall_sentiment_score
      }));
    }

    return [];
  } catch (error) {
    console.error('Error fetching market news:', error);
    return [];
  }
}

async function getSectorPerformance(market = 'us') {
  try {
    if (!ALPHA_VANTAGE_API_KEY) {
      return [];
    }

    const response = await fetch(
      `https://www.alphavantage.co/query?function=SECTOR&apikey=${ALPHA_VANTAGE_API_KEY}`
    );

    const data = await response.json();

    if (data['Rank A: Real-Time Performance']) {
      const sectors = Object.entries(data['Rank A: Real-Time Performance']);
      return sectors.map(([name, performance]) => ({
        name: name.replace('Rank ', ''),
        performance: parseFloat(performance),
        change: parseFloat(performance)
      }));
    }

    return [];
  } catch (error) {
    console.error('Error fetching sector performance:', error);
    return [];
  }
}

async function getCryptoStats() {
  try {
    const response = await fetch(
      `${COINGECKO_API_BASE}/global`
    );

    const data = await response.json();

    return {
      totalMarketCap: data.data.total_market_cap.usd,
      totalVolume24h: data.data.total_volume.usd,
      bitcoinDominance: data.data.market_cap_percentage.btc,
      ethereumDominance: data.data.market_cap_percentage.eth,
      activeCryptocurrencies: data.data.active_cryptocurrencies,
      marketCapChange24h: data.data.market_cap_change_percentage_24h_usd
    };
  } catch (error) {
    console.error('Error fetching crypto stats:', error);
    return null;
  }
}

async function getCryptoMarketData() {
  try {
    const response = await fetch(
      `${COINGECKO_API_BASE}/global/market_cap_chart?vs_currency=usd&days=30`
    );

    const data = await response.json();

    return data.map(([timestamp, marketCap]) => ({
      date: new Date(timestamp).toISOString(),
      marketCap
    }));
  } catch (error) {
    console.error('Error fetching crypto market data:', error);
    return [];
  }
}

async function getForexRates(base = 'USD', symbols = 'EUR,GBP,JPY,COP') {
  try {
    const response = await fetch(
      `https://api.exchangerate-api.com/v4/latest/${base}`
    );

    const data = await response.json();

    const rates = {};
    const symbolArray = symbols.split(',');

    symbolArray.forEach(symbol => {
      if (data.rates[symbol]) {
        rates[symbol] = data.rates[symbol];
      }
    });

    return {
      base,
      rates,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error fetching forex rates:', error);
    return null;
  }
}

async function getDividendData(symbol) {
  try {
    if (!ALPHA_VANTAGE_API_KEY) {
      return null;
    }

    const response = await fetch(
      `https://www.alphavantage.co/query?function=DIVIDENDS&symbol=${symbol}&apikey=${ALPHA_VANTAGE_API_KEY}`
    );

    const data = await response.json();

    if (data.data) {
      return {
        symbol,
        dividends: data.data.map(dividend => ({
          date: dividend.ex_dividend_date,
          amount: parseFloat(dividend.amount),
          currency: dividend.currency,
          frequency: dividend.frequency,
            paymentDate: dividend.payment_date
        }))
      };
    }

    return null;
  } catch (error) {
    console.error('Error fetching dividend data:', error);
    return null;
  }
}

async function getTechnicalAnalysis(symbol, indicators) {
  try {
    if (!ALPHA_VANTAGE_API_KEY) {
      return null;
    }

    const indicatorList = indicators.split(',');
    const results = {};

    for (const indicator of indicatorList) {
      const response = await fetch(
        `https://www.alphavantage.co/query?function=${indicator}&symbol=${symbol}&interval=daily&time_period=14&apikey=${ALPHA_VANTAGE_API_KEY}`
      );

      const data = await response.json();

      if (data[`Technical Analysis: ${indicator}`]) {
        const latest = Object.entries(data[`Technical Analysis: ${indicator}`])[0];
        results[indicator] = latest[1];
      }
    }

    return {
      symbol,
      indicators: results
    };
  } catch (error) {
    console.error('Error fetching technical analysis:', error);
    return null;
  }
}

async function runScreener(params) {
  try {
    // Implementación básica de screener
    // En un entorno real, esto usaría datos de APIs externas
    const mockResults = [
      {
        symbol: 'AAPL',
        name: 'Apple Inc.',
        sector: 'Technology',
        marketCap: 3000000000000,
        pe: 25.5,
        dividend: 0.5,
        price: 175.50,
        change: 2.3
      },
      {
        symbol: 'MSFT',
        name: 'Microsoft Corporation',
        sector: 'Technology',
        marketCap: 2800000000000,
        pe: 28.2,
        dividend: 0.8,
        price: 380.25,
        change: 1.8
      }
    ];

    // Aplicar filtros
    let filtered = mockResults;

    if (params.minMarketCap > 0) {
      filtered = filtered.filter(stock => stock.marketCap >= params.minMarketCap);
    }

    if (params.maxMarketCap) {
      filtered = filtered.filter(stock => stock.marketCap <= params.maxMarketCap);
    }

    if (params.minPE > 0) {
      filtered = filtered.filter(stock => stock.pe >= params.minPE);
    }

    if (params.maxPE) {
      filtered = filtered.filter(stock => stock.pe <= params.maxPE);
    }

    if (params.minDividend > 0) {
      filtered = filtered.filter(stock => stock.dividend >= params.minDividend);
    }

    // Ordenar
    filtered.sort((a, b) => {
      const aValue = a[params.sort];
      const bValue = b[params.sort];
      
      if (params.order === 'desc') {
        return bValue - aValue;
      }
      return aValue - bValue;
    });

    return filtered.slice(0, params.limit);
  } catch (error) {
    console.error('Error running screener:', error);
    return [];
  }
}

export default router;
