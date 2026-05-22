import fetch from 'node-fetch';

const API_BASE = 'http://localhost:4000/api';

// Token real obtenido del login
const TEST_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OWZmOGVhNjlkOWQ2NjhiMzNkOTZhYjIiLCJlbWFpbCI6Im1vbmdvZGJAZmluYW5jZWlxLmNvbSIsImlhdCI6MTc3OTEzNzY3NiwiZXhwIjoxNzc5NzQyNDc2fQ.KZZfuLZNiVmQYxLILgwlN1Qj71wZYf1obBmcTOOuS5g';

const headers = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${TEST_TOKEN}`
};

async function testDebtsAPI() {
  console.log('🚀 Probando Debts API...\n');

  try {
    // 1. Crear una nueva deuda (crédito hipotecario)
    console.log('🏦 1. Creando deuda hipotecaria...');
    const mortgageDebt = {
      name: 'Crédito Hipotecario Apartamento',
      creditor: {
        name: 'Banco Bancolombia',
        type: 'bank',
        contact: {
          phone: '1234567890',
          email: 'hipotecas@bancolombia.com'
        }
      },
      originalAmount: 200000000,
      currentBalance: 180000000,
      currency: 'COP',
      interestRate: {
        annual: 12.5,
        type: 'fixed',
        compoundingFrequency: 'monthly'
      },
      paymentSchedule: {
        frequency: 'monthly',
        dayOfMonth: 15,
        paymentAmount: 2500000,
        nextPaymentDate: new Date('2026-06-15')
      },
      loanDetails: {
        type: 'mortgage',
        term: 240, // 20 años en meses
        purpose: 'Compra de apartamento',
        collateral: 'Apartamento 120m2'
      },
      amortizationType: 'french',
      priority: 'high'
    };

    const createMortgageResponse = await fetch(`${API_BASE}/debts`, {
      method: 'POST',
      headers,
      body: JSON.stringify(mortgageDebt)
    });

    if (createMortgageResponse.ok) {
      const createdMortgage = await createMortgageResponse.json();
      console.log('✅ Deuda hipotecaria creada exitosamente:');
      console.log(JSON.stringify(createdMortgage.data, null, 2));
      const mortgageId = createdMortgage.data._id;
      console.log(`\n📋 ID de la deuda hipotecaria: ${mortgageId}\n`);

      // 2. Crear una deuda de vehículo
      console.log('🚗 2. Creando deuda de vehículo...');
      const vehicleDebt = {
        name: 'Crédito Vehículo',
        creditor: {
          name: 'Davivienda',
          type: 'financial-institution',
          contact: {
            phone: '0987654321',
            email: 'creditos@davivienda.com'
          }
        },
        originalAmount: 80000000,
        currentBalance: 65000000,
        currency: 'COP',
        interestRate: {
          annual: 18.5,
          type: 'fixed',
          compoundingFrequency: 'monthly'
        },
        paymentSchedule: {
          frequency: 'monthly',
          dayOfMonth: 5,
          paymentAmount: 1800000,
          nextPaymentDate: new Date('2026-06-05')
        },
        loanDetails: {
          type: 'auto',
          term: 48, // 4 años en meses
          purpose: 'Compra de vehículo',
          collateral: 'SUV 2024'
        },
        amortizationType: 'french',
        priority: 'medium'
      };

      const createVehicleResponse = await fetch(`${API_BASE}/debts`, {
        method: 'POST',
        headers,
        body: JSON.stringify(vehicleDebt)
      });

      if (createVehicleResponse.ok) {
        const createdVehicle = await createVehicleResponse.json();
        console.log('✅ Deuda de vehículo creada exitosamente:');
        console.log(JSON.stringify(createdVehicle.data, null, 2));
        const vehicleId = createdVehicle.data._id;

        // 3. Crear una deuda de tarjeta de crédito
        console.log('💳 3. Creando deuda de tarjeta de crédito...');
        const creditCardDebt = {
          name: 'Tarjeta de Crédito Visa',
          creditor: {
            name: 'Visa Bancolombia',
            type: 'credit-card',
            contact: {
              phone: '5555555555',
              email: 'tarjetas@bancolombia.com'
            }
          },
          originalAmount: 5000000,
          currentBalance: 3500000,
          currency: 'COP',
          interestRate: {
            annual: 28.5,
            type: 'fixed',
            compoundingFrequency: 'monthly'
          },
          paymentSchedule: {
            frequency: 'monthly',
            dayOfMonth: 20,
            paymentAmount: 500000,
            nextPaymentDate: new Date('2026-06-20')
          },
          loanDetails: {
            type: 'credit-card',
            term: 12,
            purpose: 'Gastos mensuales',
            collateral: 'N/A'
          },
          amortizationType: 'french',
          priority: 'medium'
        };

        const createCreditCardResponse = await fetch(`${API_BASE}/debts`, {
          method: 'POST',
          headers,
          body: JSON.stringify(creditCardDebt)
        });

        if (createCreditCardResponse.ok) {
          const createdCreditCard = await createCreditCardResponse.json();
          console.log('✅ Deuda de tarjeta de crédito creada exitosamente:');
          console.log(JSON.stringify(createdCreditCard.data, null, 2));
          const creditCardId = createdCreditCard.data._id;

          // 4. Obtener todas las deudas
          console.log('\n📊 4. Obteniendo todas las deudas...');
          const getAllResponse = await fetch(`${API_BASE}/debts`, {
            headers
          });

          if (getAllResponse.ok) {
            const allDebts = await getAllResponse.json();
            console.log('✅ Todas las deudas:');
            console.log(JSON.stringify(allDebts, null, 2));
          }

          // 5. Obtener deudas activas
          console.log('\n🟢 5. Obteniendo deudas activas...');
          const activeResponse = await fetch(`${API_BASE}/debts/active`, {
            headers
          });

          if (activeResponse.ok) {
            const activeDebts = await activeResponse.json();
            console.log('✅ Deudas activas:');
            console.log(JSON.stringify(activeDebts, null, 2));
          }

          // 6. Obtener resumen de deudas
          console.log('\n📈 6. Obteniendo resumen de deudas...');
          const summaryResponse = await fetch(`${API_BASE}/debts/summary`, {
            headers
          });

          if (summaryResponse.ok) {
            const summary = await summaryResponse.json();
            console.log('✅ Resumen de deudas:');
            console.log(JSON.stringify(summary, null, 2));
          }

          // 7. Obtener resumen por estado
          console.log('\n📋 7. Obteniendo resumen por estado...');
          const summaryByStatusResponse = await fetch(`${API_BASE}/debts/summary-by-status`, {
            headers
          });

          if (summaryByStatusResponse.ok) {
            const summaryByStatus = await summaryByStatusResponse.json();
            console.log('✅ Resumen por estado:');
            console.log(JSON.stringify(summaryByStatus, null, 2));
          }

          // 8. Obtener análisis por tipo
          console.log('\n📊 8. Obteniendo análisis por tipo...');
          const analyticsTypeResponse = await fetch(`${API_BASE}/debts/analytics/by-type`, {
            headers
          });

          if (analyticsTypeResponse.ok) {
            const analyticsType = await analyticsTypeResponse.json();
            console.log('✅ Análisis por tipo:');
            console.log(JSON.stringify(analyticsType, null, 2));
          }

          // 9. Obtener análisis por acreedor
          console.log('\n🏦 9. Obteniendo análisis por acreedor...');
          const analyticsCreditorResponse = await fetch(`${API_BASE}/debts/analytics/by-creditor`, {
            headers
          });

          if (analyticsCreditorResponse.ok) {
            const analyticsCreditor = await analyticsCreditorResponse.json();
            console.log('✅ Análisis por acreedor:');
            console.log(JSON.stringify(analyticsCreditor, null, 2));
          }

          // 10. Obtener análisis por prioridad
          console.log('\n🔥 10. Obteniendo análisis por prioridad...');
          const analyticsPriorityResponse = await fetch(`${API_BASE}/debts/analytics/by-priority`, {
            headers
          });

          if (analyticsPriorityResponse.ok) {
            const analyticsPriority = await analyticsPriorityResponse.json();
            console.log('✅ Análisis por prioridad:');
            console.log(JSON.stringify(analyticsPriority, null, 2));
          }

          // 11. Calcular tabla de amortización de la hipoteca
          console.log('\n📋 11. Calculando tabla de amortización de la hipoteca...');
          const amortizationResponse = await fetch(`${API_BASE}/debts/${mortgageId}/amortization-schedule`, {
            method: 'POST',
            headers
          });

          if (amortizationResponse.ok) {
            const amortization = await amortizationResponse.json();
            console.log('✅ Primeros 10 pagos de la amortización:');
            console.log(JSON.stringify(amortization.data.slice(0, 10), null, 2));
          }

          // 12. Calcular impacto de prepago
          console.log('\n💰 12. Calculando impacto de prepago en la hipoteca...');
          const prepaymentResponse = await fetch(`${API_BASE}/debts/${mortgageId}/prepayment-impact`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ extraAmount: 10000000 })
          });

          if (prepaymentResponse.ok) {
            const prepayment = await prepaymentResponse.json();
            console.log('✅ Impacto de prepago de $10,000,000:');
            console.log(JSON.stringify(prepayment.data, null, 2));
          }

          // 13. Realizar un pago en la tarjeta de crédito
          console.log('\n💳 13. Realizando pago en la tarjeta de crédito...');
          const paymentResponse = await fetch(`${API_BASE}/debts/${creditCardId}/payment`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ amount: 500000 })
          });

          if (paymentResponse.ok) {
            const payment = await paymentResponse.json();
            console.log('✅ Pago realizado:');
            console.log(JSON.stringify(payment.data, null, 2));
          }

          // 14. Calcular próxima fecha de pago
          console.log('\n📅 14. Calculando próxima fecha de pago...');
          const nextPaymentResponse = await fetch(`${API_BASE}/debts/${vehicleId}/calculate-next-payment`, {
            method: 'POST',
            headers
          });

          if (nextPaymentResponse.ok) {
            const nextPayment = await nextPaymentResponse.json();
            console.log('✅ Próxima fecha de pago del vehículo:');
            console.log(JSON.stringify(nextPayment, null, 2));
          }

          // 15. Obtener proyección de pagos futuros
          console.log('\n🔮 15. Obteniendo proyección de pagos futuros...');
          const forecastResponse = await fetch(`${API_BASE}/debts/forecast?months=6`, {
            headers
          });

          if (forecastResponse.ok) {
            const forecast = await forecastResponse.json();
            console.log('✅ Proyección de pagos (6 meses):');
            console.log(JSON.stringify(forecast.data.slice(0, 3), null, 2));
          }

          // 16. Actualizar la deuda hipotecaria
          console.log('\n✏️ 16. Actualizando la deuda hipotecaria...');
          const updateData = {
            currentBalance: 175000000,
            paymentSchedule: {
              paymentAmount: 2400000
            }
          };

          const updateResponse = await fetch(`${API_BASE}/debts/${mortgageId}`, {
            method: 'PUT',
            headers,
            body: JSON.stringify(updateData)
          });

          if (updateResponse.ok) {
            const updatedDebt = await updateResponse.json();
            console.log('✅ Deuda actualizada:');
            console.log(JSON.stringify(updatedDebt.data, null, 2));
          }

        } else {
          console.log('❌ Error al crear deuda de tarjeta de crédito:', await createCreditCardResponse.text());
        }

      } else {
        console.log('❌ Error al crear deuda de vehículo:', await createVehicleResponse.text());
      }

    } else {
      console.log('❌ Error al crear deuda hipotecaria:', await createMortgageResponse.text());
    }

  } catch (error) {
    console.error('❌ Error en las pruebas:', error.message);
  }
}

// Ejecutar pruebas
testDebtsAPI().then(() => {
  console.log('\n🎉 ¡Pruebas de Debts API completadas!');
}).catch(error => {
  console.error('❌ Error en las pruebas:', error);
});
