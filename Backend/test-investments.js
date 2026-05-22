import fetch from 'node-fetch';

const API_BASE = 'http://localhost:4000/api';

// Token real obtenido del login
const TEST_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OWZmOGVhNjlkOWQ2NjhiMzNkOTZhYjIiLCJlbWFpbCI6Im1vbmdvZGJAZmluYW5jZWlxLmNvbSIsImlhdCI6MTc3OTEzNzY3NiwiZXhwIjoxNzc5NzQyNDc2fQ.KZZfuLZNiVmQYxLILgwlN1Qj71wZYf1obBmcTOOuS5g';

const headers = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${TEST_TOKEN}`
};

async function testInvestmentsAPI() {
  console.log('🚀 Probando Investments API...\n');

  try {
    // 1. Crear una inversión en acciones
    console.log('📈 1. Creando inversión en acciones...');
    const stockInvestment = {
      name: 'Apple Inc.',
      type: 'stock',
      category: 'equity',
      symbol: 'AAPL',
      exchange: 'NASDAQ',
      currency: 'USD',
      risk: {
        level: 'medium',
        beta: 1.2,
        alpha: 0.1
      },
      allocation: {
        targetPercentage: 40,
        rebalanceThreshold: 5
      },
      tags: ['technology', 'large-cap', 'blue-chip'],
      notes: 'Inversión a largo plazo en Apple'
    };

    const createStockResponse = await fetch(`${API_BASE}/investments`, {
      method: 'POST',
      headers,
      body: JSON.stringify(stockInvestment)
    });

    if (createStockResponse.ok) {
      const createdStock = await createStockResponse.json();
      console.log('✅ Inversión en acciones creada exitosamente:');
      console.log(JSON.stringify(createdStock.data, null, 2));
      const stockId = createdStock.data._id;
      console.log(`\n📋 ID de la inversión en acciones: ${stockId}\n`);

      // 2. Agregar tenencias a la inversión en acciones
      console.log('📦 2. Agregando tenencias a la inversión en acciones...');
      const stockHolding = {
        quantity: 100,
        price: 175.50,
        currency: 'USD',
        transactionType: 'buy',
        exchangeRate: 4100,
        notes: 'Compra inicial de 100 acciones'
      };

      const addHoldingResponse = await fetch(`${API_BASE}/investments/${stockId}/add-holding`, {
        method: 'POST',
        headers,
        body: JSON.stringify(stockHolding)
      });

      if (addHoldingResponse.ok) {
        const holdingResult = await addHoldingResponse.json();
        console.log('✅ Tenencia agregada exitosamente:');
        console.log(JSON.stringify(holdingResult.data, null, 2));

        // 3. Actualizar precio de mercado
        console.log('\n💰 3. Actualizando precio de mercado de Apple...');
        const priceUpdateResponse = await fetch(`${API_BASE}/investments/${stockId}/update-price`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ 
            price: 178.25, 
            currency: 'USD',
            source: 'market-data'
          })
        });

        if (priceUpdateResponse.ok) {
          const priceUpdate = await priceUpdateResponse.json();
          console.log('✅ Precio actualizado:');
          console.log(JSON.stringify(priceUpdate.data, null, 2));
        }

        // 4. Crear una inversión en criptomonedas
        console.log('\n₿ 4. Creando inversión en criptomonedas...');
        const cryptoInvestment = {
          name: 'Bitcoin',
          type: 'crypto',
          category: 'alternative',
          symbol: 'BTC',
          exchange: 'CRYPTO',
          currency: 'USD',
          risk: {
            level: 'very-high',
            beta: 2.5,
            alpha: 0.5
          },
          allocation: {
            targetPercentage: 20,
            rebalanceThreshold: 10
          },
          tags: ['cryptocurrency', 'digital-gold', 'store-of-value'],
          notes: 'Inversión especulativa en Bitcoin'
        };

        const createCryptoResponse = await fetch(`${API_BASE}/investments`, {
          method: 'POST',
          headers,
          body: JSON.stringify(cryptoInvestment)
        });

        if (createCryptoResponse.ok) {
          const createdCrypto = await createCryptoResponse.json();
          console.log('✅ Inversión en criptomonedas creada exitosamente:');
          console.log(JSON.stringify(createdCrypto.data, null, 2));
          const cryptoId = createdCrypto.data._id;

          // 5. Agregar tenencias a la inversión en criptomonedas
          console.log('\n💎 5. Agregando tenencias a la inversión en Bitcoin...');
          const cryptoHolding = {
            quantity: 0.5,
            price: 65000,
            currency: 'USD',
            transactionType: 'buy',
            exchangeRate: 4100,
            notes: 'Compra de 0.5 BTC'
          };

          const addCryptoHoldingResponse = await fetch(`${API_BASE}/investments/${cryptoId}/add-holding`, {
            method: 'POST',
            headers,
            body: JSON.stringify(cryptoHolding)
          });

          if (addCryptoHoldingResponse.ok) {
            const cryptoHoldingResult = await addCryptoHoldingResponse.json();
            console.log('✅ Tenencia de Bitcoin agregada:');
            console.log(JSON.stringify(cryptoHoldingResult.data, null, 2));

            // 6. Actualizar precio de Bitcoin
            console.log('\n📈 6. Actualizando precio de Bitcoin...');
            const cryptoPriceUpdateResponse = await fetch(`${API_BASE}/investments/${cryptoId}/update-price`, {
              method: 'POST',
              headers,
              body: JSON.stringify({ 
                price: 67500, 
                currency: 'USD',
                source: 'coingecko'
              })
            });

            if (cryptoPriceUpdateResponse.ok) {
              const cryptoPriceUpdate = await cryptoPriceUpdateResponse.json();
              console.log('✅ Precio de Bitcoin actualizado:');
              console.log(JSON.stringify(cryptoPriceUpdate.data, null, 2));
            }

            // 7. Crear una inversión en ETF
            console.log('\n📊 7. Creando inversión en ETF...');
            const etfInvestment = {
              name: 'Vanguard S&P 500 ETF',
              type: 'etf',
              category: 'equity',
              symbol: 'VOO',
              exchange: 'NYSE',
              currency: 'USD',
              risk: {
                level: 'medium',
                beta: 1.0,
                alpha: 0
              },
              allocation: {
                targetPercentage: 30,
                rebalanceThreshold: 5
              },
              tags: ['etf', 'index-fund', 's&p-500', 'diversified'],
              notes: 'ETF que sigue el S&P 500'
            };

            const createEtfResponse = await fetch(`${API_BASE}/investments`, {
              method: 'POST',
              headers,
              body: JSON.stringify(etfInvestment)
            });

            if (createEtfResponse.ok) {
              const createdEtf = await createEtfResponse.json();
              console.log('✅ Inversión en ETF creada exitosamente:');
              console.log(JSON.stringify(createdEtf.data, null, 2));
              const etfId = createdEtf.data._id;

              // 8. Agregar tenencias al ETF
              console.log('\n📋 8. Agregando tenencias al ETF...');
              const etfHolding = {
                quantity: 50,
                price: 480.75,
                currency: 'USD',
                transactionType: 'buy',
                exchangeRate: 4100,
                notes: 'Compra de 50 acciones del ETF'
              };

              const addEtfHoldingResponse = await fetch(`${API_BASE}/investments/${etfId}/add-holding`, {
                method: 'POST',
                headers,
                body: JSON.stringify(etfHolding)
              });

              if (addEtfHoldingResponse.ok) {
                const etfHoldingResult = await addEtfHoldingResponse.json();
                console.log('✅ Tenencia de ETF agregada:');
                console.log(JSON.stringify(etfHoldingResult.data, null, 2));

                // 9. Obtener todas las inversiones
                console.log('\n📊 9. Obteniendo todas las inversiones...');
                const getAllResponse = await fetch(`${API_BASE}/investments`, {
                  headers
                });

                if (getAllResponse.ok) {
                  const allInvestments = await getAllResponse.json();
                  console.log('✅ Todas las inversiones:');
                  console.log(JSON.stringify(allInvestments, null, 2));
                }

                // 10. Obtener inversiones activas
                console.log('\n🟢 10. Obteniendo inversiones activas...');
                const activeResponse = await fetch(`${API_BASE}/investments/active`, {
                  headers
                });

                if (activeResponse.ok) {
                  const activeInvestments = await activeResponse.json();
                  console.log('✅ Inversiones activas:');
                  console.log(JSON.stringify(activeInvestments, null, 2));
                }

                // 11. Obtener resumen del portafolio
                console.log('\n📈 11. Obteniendo resumen del portafolio...');
                const summaryResponse = await fetch(`${API_BASE}/investments/summary`, {
                  headers
                });

                if (summaryResponse.ok) {
                  const summary = await summaryResponse.json();
                  console.log('✅ Resumen del portafolio:');
                  console.log(JSON.stringify(summary, null, 2));
                }

                // 12. Obtener rendimiento por tipo
                console.log('\n📊 12. Obteniendo rendimiento por tipo...');
                const performanceTypeResponse = await fetch(`${API_BASE}/investments/performance-by-type`, {
                  headers
                });

                if (performanceTypeResponse.ok) {
                  const performanceType = await performanceTypeResponse.json();
                  console.log('✅ Rendimiento por tipo:');
                  console.log(JSON.stringify(performanceType, null, 2));
                }

                // 13. Obtener mejores inversiones
                console.log('\n🏆 13. Obteniendo mejores inversiones...');
                const topPerformersResponse = await fetch(`${API_BASE}/investments/top-performers`, {
                  headers
                });

                if (topPerformersResponse.ok) {
                  const topPerformers = await topPerformersResponse.json();
                  console.log('✅ Mejores inversiones:');
                  console.log(JSON.stringify(topPerformers, null, 2));
                }

                // 14. Obtener asignación del portafolio
                console.log('\n📊 14. Obteniendo asignación del portafolio...');
                const allocationResponse = await fetch(`${API_BASE}/investments/allocation`, {
                  headers
                });

                if (allocationResponse.ok) {
                  const allocation = await allocationResponse.json();
                  console.log('✅ Asignación del portafolio:');
                  console.log(JSON.stringify(allocation, null, 2));
                }

                // 15. Verificar rebalanceo de Apple
                console.log('\n⚖️ 15. Verificando si Apple necesita rebalanceo...');
                const rebalanceCheckResponse = await fetch(`${API_BASE}/investments/${stockId}/rebalance-check`, {
                  method: 'POST',
                  headers
                });

                if (rebalanceCheckResponse.ok) {
                  const rebalanceCheck = await rebalanceCheckResponse.json();
                  console.log('✅ Verificación de rebalanceo:');
                  console.log(JSON.stringify(rebalanceCheck.data, null, 2));
                }

                // 16. Buscar inversiones
                console.log('\n🔍 16. Buscando inversiones con "Apple"...');
                const searchResponse = await fetch(`${API_BASE}/investments/search?q=Apple`, {
                  headers
                });

                if (searchResponse.ok) {
                  const searchResults = await searchResponse.json();
                  console.log('✅ Resultados de búsqueda:');
                  console.log(JSON.stringify(searchResults.data, null, 2));
                }

                // 17. Obtener resumen de rendimiento
                console.log('\n📊 17. Obteniendo resumen de rendimiento...');
                const performanceSummaryResponse = await fetch(`${API_BASE}/investments/performance-summary`, {
                  headers
                });

                if (performanceSummaryResponse.ok) {
                  const performanceSummary = await performanceSummaryResponse.json();
                  console.log('✅ Resumen de rendimiento:');
                  console.log(JSON.stringify(performanceSummary.data, null, 2));
                }

                // 18. Actualizar la inversión en acciones
                console.log('\n✏️ 18. Actualizando la inversión en acciones...');
                const updateData = {
                  name: 'Apple Inc. (AAPL)',
                  notes: 'Actualizado con nueva información',
                  risk: {
                    level: 'medium',
                    beta: 1.25,
                    alpha: 0.15
                  }
                };

                const updateResponse = await fetch(`${API_BASE}/investments/${stockId}`, {
                  method: 'PUT',
                  headers,
                  body: JSON.stringify(updateData)
                });

                if (updateResponse.ok) {
                  const updatedInvestment = await updateResponse.json();
                  console.log('✅ Inversión actualizada:');
                  console.log(JSON.stringify(updatedInvestment.data, null, 2));
                }

              } else {
                console.log('❌ Error al agregar tenencia del ETF:', await addEtfHoldingResponse.text());
              }

            } else {
              console.log('❌ Error al crear ETF:', await createEtfResponse.text());
            }

          } else {
            console.log('❌ Error al agregar tenencia de Bitcoin:', await addCryptoHoldingResponse.text());
          }

        } else {
          console.log('❌ Error al crear inversión en criptomonedas:', await createCryptoResponse.text());
        }

      } else {
        console.log('❌ Error al agregar tenencia de acciones:', await addHoldingResponse.text());
      }

    } else {
      console.log('❌ Error al crear inversión en acciones:', await createStockResponse.text());
    }

  } catch (error) {
    console.error('❌ Error en las pruebas:', error.message);
  }
}

// Ejecutar pruebas
testInvestmentsAPI().then(() => {
  console.log('\n🎉 ¡Pruebas de Investments API completadas!');
}).catch(error => {
  console.error('❌ Error en las pruebas:', error);
});
