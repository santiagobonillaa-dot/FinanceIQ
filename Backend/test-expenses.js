import fetch from 'node-fetch';

const API_BASE = 'http://localhost:4000/api';

// Token real obtenido del login
const TEST_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OWZmOGVhNjlkOWQ2NjhiMzNkOTZhYjIiLCJlbWFpbCI6Im1vbmdvZGJAZmluYW5jZWlxLmNvbSIsImlhdCI6MTc3OTEzNzY3NiwiZXhwIjoxNzc5NzQyNDc2fQ.KZZfuLZNiVmQYxLILgwlN1Qj71wZYf1obBmcTOOuS5g';

const headers = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${TEST_TOKEN}`
};

async function testExpensesAPI() {
  console.log('🚀 Probando Expenses API...\n');

  try {
    // 1. Crear un nuevo egreso fijo
    console.log('💳 1. Creando egreso fijo (arrienda)...');
    const fixedExpense = {
      name: 'Arrienda Apartamento',
      amount: 1500000,
      currency: 'COP',
      type: 'fixed',
      frequency: 'monthly',
      category: 'housing',
      priority: 'high',
      budgetLimit: 1600000,
      description: 'Arrienda mensual del apartamento'
    };

    const createFixedResponse = await fetch(`${API_BASE}/expenses`, {
      method: 'POST',
      headers,
      body: JSON.stringify(fixedExpense)
    });

    if (createFixedResponse.ok) {
      const createdFixed = await createFixedResponse.json();
      console.log('✅ Egreso fijo creado exitosamente:');
      console.log(JSON.stringify(createdFixed.data, null, 2));
      const fixedExpenseId = createdFixed.data._id;
      console.log(`\n📋 ID del egreso fijo: ${fixedExpenseId}\n`);

      // 2. Crear un egreso variable
      console.log('🛒 2. Creando egreso variable (supermercado)...');
      const variableExpense = {
        name: 'Supermercado Mensual',
        amount: 800000,
        currency: 'COP',
        type: 'variable',
        frequency: 'monthly',
        category: 'food',
        priority: 'medium',
        budgetLimit: 1000000,
        description: 'Compras mensuales de supermercado'
      };

      const createVariableResponse = await fetch(`${API_BASE}/expenses`, {
        method: 'POST',
        headers,
        body: JSON.stringify(variableExpense)
      });

      if (createVariableResponse.ok) {
        const createdVariable = await createVariableResponse.json();
        console.log('✅ Egreso variable creado exitosamente:');
        console.log(JSON.stringify(createdVariable.data, null, 2));
        const variableExpenseId = createdVariable.data._id;

        // 3. Obtener todos los egresos
        console.log('\n📊 3. Obteniendo todos los egresos...');
        const getAllResponse = await fetch(`${API_BASE}/expenses`, {
          headers
        });

        if (getAllResponse.ok) {
          const allExpenses = await getAllResponse.json();
          console.log('✅ Todos los egresos:');
          console.log(JSON.stringify(allExpenses, null, 2));
        }

        // 4. Obtener egresos activos
        console.log('\n🟢 4. Obteniendo egresos activos...');
        const activeResponse = await fetch(`${API_BASE}/expenses/active`, {
          headers
        });

        if (activeResponse.ok) {
          const activeExpenses = await activeResponse.json();
          console.log('✅ Egresos activos:');
          console.log(JSON.stringify(activeExpenses, null, 2));
        }

        // 5. Obtener resumen de egresos
        console.log('\n📈 5. Obteniendo resumen de egresos...');
        const summaryResponse = await fetch(`${API_BASE}/expenses/summary`, {
          headers
        });

        if (summaryResponse.ok) {
          const summary = await summaryResponse.json();
          console.log('✅ Resumen de egresos:');
          console.log(JSON.stringify(summary, null, 2));
        }

        // 6. Obtener análisis por tipo
        console.log('\n📊 6. Obteniendo análisis por tipo...');
        const analyticsTypeResponse = await fetch(`${API_BASE}/expenses/analytics/by-type`, {
          headers
        });

        if (analyticsTypeResponse.ok) {
          const analyticsType = await analyticsTypeResponse.json();
          console.log('✅ Análisis por tipo:');
          console.log(JSON.stringify(analyticsType, null, 2));
        }

        // 7. Obtener análisis por prioridad
        console.log('\n🔥 7. Obteniendo análisis por prioridad...');
        const analyticsPriorityResponse = await fetch(`${API_BASE}/expenses/analytics/by-priority`, {
          headers
        });

        if (analyticsPriorityResponse.ok) {
          const analyticsPriority = await analyticsPriorityResponse.json();
          console.log('✅ Análisis por prioridad:');
          console.log(JSON.stringify(analyticsPriority, null, 2));
        }

        // 8. Obtener análisis por categoría
        console.log('\n📂 8. Obteniendo análisis por categoría...');
        const categoryAnalysisResponse = await fetch(`${API_BASE}/expenses/category-analysis`, {
          headers
        });

        if (categoryAnalysisResponse.ok) {
          const categoryAnalysis = await categoryAnalysisResponse.json();
          console.log('✅ Análisis por categoría:');
          console.log(JSON.stringify(categoryAnalysis, null, 2));
        }

        // 9. Actualizar gasto real del egreso variable
        console.log('\n💰 9. Actualizando gasto real del supermercado...');
        const updateSpendingResponse = await fetch(`${API_BASE}/expenses/${variableExpenseId}/update-spending`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ amount: 950000 })
        });

        if (updateSpendingResponse.ok) {
          const updatedSpending = await updateSpendingResponse.json();
          console.log('✅ Gasto actualizado:');
          console.log(JSON.stringify(updatedSpending.data, null, 2));
        }

        // 10. Obtener análisis de presupuestos
        console.log('\n📋 10. Obteniendo análisis de presupuestos...');
        const budgetAnalysisResponse = await fetch(`${API_BASE}/expenses/budget-analysis`, {
          headers
        });

        if (budgetAnalysisResponse.ok) {
          const budgetAnalysis = await budgetAnalysisResponse.json();
          console.log('✅ Análisis de presupuestos:');
          console.log(JSON.stringify(budgetAnalysis, null, 2));
        }

        // 11. Obtener alertas de presupuesto
        console.log('\n🚨 11. Obteniendo alertas de presupuesto...');
        const budgetAlertsResponse = await fetch(`${API_BASE}/expenses/budget-alerts`, {
          headers
        });

        if (budgetAlertsResponse.ok) {
          const budgetAlerts = await budgetAlertsResponse.json();
          console.log('✅ Alertas de presupuesto:');
          console.log(JSON.stringify(budgetAlerts, null, 2));
        }

        // 12. Calcular próxima fecha de pago
        console.log('\n📅 12. Calculando próxima fecha de pago...');
        const nextPaymentResponse = await fetch(`${API_BASE}/expenses/${fixedExpenseId}/calculate-next-payment`, {
          method: 'POST',
          headers
        });

        if (nextPaymentResponse.ok) {
          const nextPayment = await nextPaymentResponse.json();
          console.log('✅ Próxima fecha de pago:');
          console.log(JSON.stringify(nextPayment, null, 2));
        }

        // 13. Obtener proyección de egresos
        console.log('\n🔮 13. Obteniendo proyección de egresos...');
        const forecastResponse = await fetch(`${API_BASE}/expenses/forecast?months=6`, {
          headers
        });

        if (forecastResponse.ok) {
          const forecast = await forecastResponse.json();
          console.log('✅ Proyección de egresos (6 meses):');
          console.log(JSON.stringify(forecast, null, 2));
        }

        // 14. Crear egreso discrecional
        console.log('\n🎮 14. Creando egreso discrecional (entretenimiento)...');
        const discretionaryExpense = {
          name: 'Entretenimiento',
          amount: 200000,
          currency: 'COP',
          type: 'discretionary',
          frequency: 'monthly',
          category: 'entertainment',
          priority: 'low',
          budgetLimit: 300000,
          description: 'Salidas, cine, juegos, etc.'
        };

        const discretionaryResponse = await fetch(`${API_BASE}/expenses`, {
          method: 'POST',
          headers,
          body: JSON.stringify(discretionaryExpense)
        });

        if (discretionaryResponse.ok) {
          const createdDiscretionary = await discretionaryResponse.json();
          console.log('✅ Egreso discrecional creado:');
          console.log(JSON.stringify(createdDiscretionary.data, null, 2));
        }

        // 15. Obtener tendencia mensual
        console.log('\n📈 15. Obteniendo tendencia mensual...');
        const trendResponse = await fetch(`${API_BASE}/expenses/analytics/monthly-trend?months=6`, {
          headers
        });

        if (trendResponse.ok) {
          const trend = await trendResponse.json();
          console.log('✅ Tendencia mensual:');
          console.log(JSON.stringify(trend, null, 2));
        }

        // 16. Actualizar egreso fijo
        console.log('\n✏️ 16. Actualizando egreso fijo...');
        const updateData = {
          amount: 1600000,
          description: 'Arrienda actualizado con aumento'
        };

        const updateResponse = await fetch(`${API_BASE}/expenses/${fixedExpenseId}`, {
          method: 'PUT',
          headers,
          body: JSON.stringify(updateData)
        });

        if (updateResponse.ok) {
          const updatedExpense = await updateResponse.json();
          console.log('✅ Egreso actualizado:');
          console.log(JSON.stringify(updatedExpense.data, null, 2));
        }

      } else {
        console.log('❌ Error al crear egreso variable:', await createVariableResponse.text());
      }

    } else {
      console.log('❌ Error al crear egreso fijo:', await createFixedResponse.text());
    }

  } catch (error) {
    console.error('❌ Error en las pruebas:', error.message);
  }
}

// Ejecutar pruebas
testExpensesAPI().then(() => {
  console.log('\n🎉 ¡Pruebas de Expenses API completadas!');
}).catch(error => {
  console.error('❌ Error en las pruebas:', error);
});
