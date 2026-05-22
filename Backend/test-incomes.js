import fetch from 'node-fetch';

const API_BASE = 'http://localhost:4000/api';

// Token real obtenido del login
const TEST_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OWZmOGVhNjlkOWQ2NjhiMzNkOTZhYjIiLCJlbWFpbCI6Im1vbmdvZGJAZmluYW5jZWlxLmNvbSIsImlhdCI6MTc3OTEzNzY3NiwiZXhwIjoxNzc5NzQyNDc2fQ.KZZfuLZNiVmQYxLILgwlN1Qj71wZYf1obBmcTOOuS5g';

const headers = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${TEST_TOKEN}`
};

async function testIncomesAPI() {
  console.log('🚀 Probando Incomes API...\n');

  try {
    // 1. Crear un nuevo ingreso
    console.log('📝 1. Creando nuevo ingreso...');
    const newIncome = {
      name: 'Salario Mensual',
      amount: 5000000,
      currency: 'COP',
      type: 'fixed',
      frequency: 'monthly',
      category: 'salary',
      description: 'Salario principal mensual'
    };

    const createResponse = await fetch(`${API_BASE}/incomes`, {
      method: 'POST',
      headers,
      body: JSON.stringify(newIncome)
    });

    if (createResponse.ok) {
      const createdIncome = await createResponse.json();
      console.log('✅ Ingreso creado exitosamente:');
      console.log(JSON.stringify(createdIncome.data, null, 2));
      const incomeId = createdIncome.data._id;
      console.log(`\n📋 ID del ingreso: ${incomeId}\n`);

      // 2. Obtener todos los ingresos
      console.log('📊 2. Obteniendo todos los ingresos...');
      const getAllResponse = await fetch(`${API_BASE}/incomes`, {
        headers
      });

      if (getAllResponse.ok) {
        const allIncomes = await getAllResponse.json();
        console.log('✅ Todos los ingresos:');
        console.log(JSON.stringify(allIncomes, null, 2));
      } else {
        console.log('❌ Error al obtener ingresos:', await getAllResponse.text());
      }

      // 3. Obtener ingresos activos
      console.log('\n🟢 3. Obteniendo ingresos activos...');
      const activeResponse = await fetch(`${API_BASE}/incomes/active`, {
        headers
      });

      if (activeResponse.ok) {
        const activeIncomes = await activeResponse.json();
        console.log('✅ Ingresos activos:');
        console.log(JSON.stringify(activeIncomes, null, 2));
      } else {
        console.log('❌ Error al obtener ingresos activos:', await activeResponse.text());
      }

      // 4. Obtener resumen de ingresos
      console.log('\n📈 4. Obteniendo resumen de ingresos...');
      const summaryResponse = await fetch(`${API_BASE}/incomes/summary`, {
        headers
      });

      if (summaryResponse.ok) {
        const summary = await summaryResponse.json();
        console.log('✅ Resumen de ingresos:');
        console.log(JSON.stringify(summary, null, 2));
      } else {
        console.log('❌ Error al obtener resumen:', await summaryResponse.text());
      }

      // 5. Obtener análisis por tipo
      console.log('\n📊 5. Obteniendo análisis por tipo...');
      const analyticsTypeResponse = await fetch(`${API_BASE}/incomes/analytics/by-type`, {
        headers
      });

      if (analyticsTypeResponse.ok) {
        const analyticsType = await analyticsTypeResponse.json();
        console.log('✅ Análisis por tipo:');
        console.log(JSON.stringify(analyticsType, null, 2));
      } else {
        console.log('❌ Error al obtener análisis por tipo:', await analyticsTypeResponse.text());
      }

      // 6. Obtener análisis por categoría
      console.log('\n📂 6. Obteniendo análisis por categoría...');
      const analyticsCategoryResponse = await fetch(`${API_BASE}/incomes/analytics/by-category`, {
        headers
      });

      if (analyticsCategoryResponse.ok) {
        const analyticsCategory = await analyticsCategoryResponse.json();
        console.log('✅ Análisis por categoría:');
        console.log(JSON.stringify(analyticsCategory, null, 2));
      } else {
        console.log('❌ Error al obtener análisis por categoría:', await analyticsCategoryResponse.text());
      }

      // 7. Obtener proyección de ingresos
      console.log('\n🔮 7. Obteniendo proyección de ingresos...');
      const forecastResponse = await fetch(`${API_BASE}/incomes/forecast?months=6`, {
        headers
      });

      if (forecastResponse.ok) {
        const forecast = await forecastResponse.json();
        console.log('✅ Proyección de ingresos (6 meses):');
        console.log(JSON.stringify(forecast, null, 2));
      } else {
        console.log('❌ Error al obtener proyección:', await forecastResponse.text());
      }

      // 8. Actualizar el ingreso
      console.log('\n✏️ 8. Actualizando el ingreso...');
      const updateData = {
        amount: 5500000,
        description: 'Salario actualizado con aumento'
      };

      const updateResponse = await fetch(`${API_BASE}/incomes/${incomeId}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(updateData)
      });

      if (updateResponse.ok) {
        const updatedIncome = await updateResponse.json();
        console.log('✅ Ingreso actualizado:');
        console.log(JSON.stringify(updatedIncome.data, null, 2));
      } else {
        console.log('❌ Error al actualizar ingreso:', await updateResponse.text());
      }

      // 9. Calcular próxima fecha de pago
      console.log('\n📅 9. Calculando próxima fecha de pago...');
      const nextPaymentResponse = await fetch(`${API_BASE}/incomes/${incomeId}/calculate-next-payment`, {
        method: 'POST',
        headers
      });

      if (nextPaymentResponse.ok) {
        const nextPayment = await nextPaymentResponse.json();
        console.log('✅ Próxima fecha de pago:');
        console.log(JSON.stringify(nextPayment, null, 2));
      } else {
        console.log('❌ Error al calcular próxima fecha:', await nextPaymentResponse.text());
      }

      // 10. Crear segundo ingreso para pruebas
      console.log('\n💼 10. Creando ingreso variable (freelance)...');
      const freelanceIncome = {
        name: 'Proyecto Freelance',
        amount: 2000000,
        currency: 'COP',
        type: 'variable',
        frequency: 'one-time',
        category: 'freelance',
        description: 'Ingreso por proyecto de diseño web'
      };

      const freelanceResponse = await fetch(`${API_BASE}/incomes`, {
        method: 'POST',
        headers,
        body: JSON.stringify(freelanceIncome)
      });

      if (freelanceResponse.ok) {
        const createdFreelance = await freelanceResponse.json();
        console.log('✅ Ingreso freelance creado:');
        console.log(JSON.stringify(createdFreelance.data, null, 2));
      } else {
        console.log('❌ Error al crear ingreso freelance:', await freelanceResponse.text());
      }

      // 11. Obtener tendencia mensual
      console.log('\n📈 11. Obteniendo tendencia mensual...');
      const trendResponse = await fetch(`${API_BASE}/incomes/analytics/monthly-trend?months=6`, {
        headers
      });

      if (trendResponse.ok) {
        const trend = await trendResponse.json();
        console.log('✅ Tendencia mensual:');
        console.log(JSON.stringify(trend, null, 2));
      } else {
        console.log('❌ Error al obtener tendencia:', await trendResponse.text());
      }

    } else {
      console.log('❌ Error al crear ingreso:', await createResponse.text());
    }

  } catch (error) {
    console.error('❌ Error en las pruebas:', error.message);
  }
}

// Ejecutar pruebas
testIncomesAPI().then(() => {
  console.log('\n🎉 ¡Pruebas de Incomes API completadas!');
}).catch(error => {
  console.error('❌ Error en las pruebas:', error);
});
