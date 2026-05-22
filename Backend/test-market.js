import fetch from 'node-fetch';

const API_BASE = 'http://localhost:4000/api';

// Token real obtenido del login
const TEST_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OWZmOGVhNjlkOWQ2NjhiMzNkOTZhYjIiLCJlbWFpbCI6Im1vbmdvZGJAZmluYW5jZWlxLmNvbSIsImlhdCI6MTc3OTEzNzY3NiwiZXhwIjoxNzc5NzQyNDc2fQ.KZZfuLZNiVmQYxLILgwlN1Qj71wZYf1obBmcTOOuS5g';

const headers = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${TEST_TOKEN}`
};

async function testMarketAPI() {
  console.log('🌐 Probando Market API...\n');

  try {
    // 1. Buscar activos de mercado
    console.log('🔍 1. Buscando activos de mercado con "Apple"...');
    const searchResponse = await fetch(`${API_BASE}/market/search?query=Apple&limit=5`, {
      headers
    });

    if (searchResponse.ok) {
      const searchResults = await searchResponse.json();
      console.log('✅ Resultados de búsqueda:');
      console.log(JSON.stringify(searchResults.data, null, 2));
    } else {
      console.log('❌ Error en búsqueda:', await searchResponse.text());
    }

    // 2. Obtener cotización de Apple
    console.log('\n💰 2. Obteniendo cotización de Apple (AAPL)...');
    const quoteResponse = await fetch(`${API_BASE}/market/quote/AAPL?type=stock`, {
      headers
    });

    if (quoteResponse.ok) {
      const quote = await quoteResponse.json();
      console.log('✅ Cotización de Apple:');
      console.log(JSON.stringify(quote.data, null, 2));
    } else {
      console.log('❌ Error al obtener cotización:', await quoteResponse.text());
    }

    // 3. Obtener cotización de Bitcoin
    console.log('\n₿ 3. Obteniendo cotización de Bitcoin (BTC)...');
    const cryptoQuoteResponse = await fetch(`${API_BASE}/market/quote/BTC?type=crypto`, {
      headers
    });

    if (cryptoQuoteResponse.ok) {
      const cryptoQuote = await cryptoQuoteResponse.json();
      console.log('✅ Cotización de Bitcoin:');
      console.log(JSON.stringify(cryptoQuote.data, null, 2));
    } else {
      console.log('❌ Error al obtener cotización de Bitcoin:', await cryptoQuoteResponse.text());
    }

    // 4. Obtener datos históricos de Apple
    console.log('\n📈 4. Obteniendo datos históricos de Apple (1 mes)...');
    const historicalResponse = await fetch(`${API_BASE}/market/historical/AAPL?period=1M`, {
      headers
    });

    if (historicalResponse.ok) {
      const historical = await historicalResponse.json();
      console.log('✅ Datos históricos de Apple:');
      console.log(JSON.stringify(historical.data, null, 2));
    } else {
      console.log('❌ Error al obtener datos históricos:', await historicalResponse.text());
    }

    // 5. Obtener visión general del mercado
    console.log('\n📊 5. Obteniendo visión general del mercado...');
    const marketOverviewResponse = await fetch(`${API_BASE}/market/market-overview`, {
      headers
    });

    if (marketOverviewResponse.ok) {
      const marketOverview = await marketOverviewResponse.json();
      console.log('✅ Visión general del mercado:');
      console.log(JSON.stringify(marketOverview.data, null, 2));
    } else {
      console.log('❌ Error al obtener visión general:', await marketOverviewResponse.text());
    }

    // 6. Obtener rendimiento por sector
    console.log('\n🏢 6. Obteniendo rendimiento por sector...');
    const sectorResponse = await fetch(`${API_BASE}/market/sector-performance`, {
      headers
    });

    if (sectorResponse.ok) {
      const sectorData = await sectorResponse.json();
      console.log('✅ Rendimiento por sector:');
      console.log(JSON.stringify(sectorData.data, null, 2));
    } else {
      console.log('❌ Error al obtener rendimiento por sector:', await sectorResponse.text());
    }

    // 7. Obtener visión general de criptomonedas
    console.log('\n💎 7. Obteniendo visión general de criptomonedas...');
    const cryptoOverviewResponse = await fetch(`${API_BASE}/market/crypto/overview`, {
      headers
    });

    if (cryptoOverviewResponse.ok) {
      const cryptoOverview = await cryptoOverviewResponse.json();
      console.log('✅ Visión general de criptomonedas:');
      console.log(JSON.stringify(cryptoOverview.data, null, 2));
    } else {
      console.log('❌ Error al obtener visión general de criptomonedas:', await cryptoOverviewResponse.text());
    }

    // 8. Obtener tasas de cambio
    console.log('\n💱 8. Obteniendo tasas de cambio...');
    const forexResponse = await fetch(`${API_BASE}/market/forex/rates?base=USD&symbols=EUR,GBP,JPY,COP`, {
      headers
    });

    if (forexResponse.ok) {
      const forexData = await forexResponse.json();
      console.log('✅ Tasas de cambio:');
      console.log(JSON.stringify(forexData.data, null, 2));
    } else {
      console.log('❌ Error al obtener tasas de cambio:', await forexResponse.text());
    }

    // 9. Actualizar precios del portafolio
    console.log('\n🔄 9. Actualizando precios del portafolio...');
    const portfolioUpdateResponse = await fetch(`${API_BASE}/market/portfolio/update`, {
      method: 'POST',
      headers
    });

    if (portfolioUpdateResponse.ok) {
      const portfolioUpdate = await portfolioUpdateResponse.json();
      console.log('✅ Actualización del portafolio:');
      console.log(JSON.stringify(portfolioUpdate.data, null, 2));
    } else {
      console.log('❌ Error al actualizar portafolio:', await portfolioUpdateResponse.text());
    }

    // 10. Ejecutar screener de mercado
    console.log('\n🔍 10. Ejecutando screener de mercado...');
    const screenerResponse = await fetch(`${API_BASE}/market/screener?minMarketCap=1000000000&sort=marketCap&order=desc&limit=5`, {
      headers
    });

    if (screenerResponse.ok) {
      const screenerResults = await screenerResponse.json();
      console.log('✅ Resultados del screener:');
      console.log(JSON.stringify(screenerResults.data, null, 2));
    } else {
      console.log('❌ Error al ejecutar screener:', await screenerResponse.text());
    }

    // 11. Buscar activos de mercado con "Bitcoin"
    console.log('\n🔍 11. Buscando activos de mercado con "Bitcoin"...');
    const cryptoSearchResponse = await fetch(`${API_BASE}/market/search?query=Bitcoin&limit=3`, {
      headers
    });

    if (cryptoSearchResponse.ok) {
      const cryptoSearchResults = await cryptoSearchResponse.json();
      console.log('✅ Resultados de búsqueda de Bitcoin:');
      console.log(JSON.stringify(cryptoSearchResults.data, null, 2));
    } else {
      console.log('❌ Error en búsqueda de Bitcoin:', await cryptoSearchResponse.text());
    }

    // 12. Obtener información de dividendos de Apple
    console.log('\n💰 12. Obteniendo información de dividendos de Apple...');
    const dividendResponse = await fetch(`${API_BASE}/market/dividends/AAPL`, {
      headers
    });

    if (dividendResponse.ok) {
      const dividendData = await dividendResponse.json();
      console.log('✅ Información de dividendos:');
      console.log(JSON.stringify(dividendData.data, null, 2));
    } else {
      console.log('❌ Error al obtener dividendos:', await dividendResponse.text());
    }

    // 13. Obtener análisis técnico de Apple
    console.log('\n📊 13. Obteniendo análisis técnico de Apple...');
    const technicalResponse = await fetch(`${API_BASE}/market/technical/AAPL?indicators=RSI,MACD`, {
      headers
    });

    if (technicalResponse.ok) {
      const technicalData = await technicalResponse.json();
      console.log('✅ Análisis técnico:');
      console.log(JSON.stringify(technicalData.data, null, 2));
    } else {
      console.log('❌ Error al obtener análisis técnico:', await technicalResponse.text());
    }

  } catch (error) {
    console.error('❌ Error en las pruebas:', error.message);
  }
}

// Ejecutar pruebas
testMarketAPI().then(() => {
  console.log('\n🎉 ¡Pruebas de Market API completadas!');
}).catch(error => {
  console.error('❌ Error en las pruebas:', error);
});
