import fetch from 'node-fetch';

const API_BASE = 'http://localhost:4000/api';

// Token real obtenido del login
const TEST_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OWZmOGVhNjlkOWQ2NjhiMzNkOTZhYjIiLCJlbWFpbCI6Im1vbmdvZGJAZmluYW5jZWlxLmNvbSIsImlhdCI6MTc3OTEzNzY3NiwiZXhwIjoxNzc5NzQyNDc2fQ.KZZfuLZNiVmQYxLILgwlN1Qj71wZYf1obBmcTOOuS5g';

const headers = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${TEST_TOKEN}`
};

async function testSavingsAPI() {
  console.log('💰 Probando Savings API...\n');

  try {
    // 1. Crear una meta de ahorro de emergencia
    console.log('🆘 1. Creando meta de ahorro de emergencia...');
    const emergencyGoal = {
      name: 'Fondo de Emergencia',
      targetAmount: 10000000,
      currency: 'COP',
      type: 'emergency-fund',
      priority: 'critical',
      timeline: {
        startDate: new Date(),
        targetDate: new Date(Date.now() + 6 * 30 * 24 * 60 * 60 * 1000) // 6 meses
      },
      contribution: {
        frequency: 'monthly',
        amount: 1500000,
        dayOfMonth: 1
      },
      description: 'Fondo para emergencias (6 meses de gastos)'
    };

    const createEmergencyResponse = await fetch(`${API_BASE}/savings`, {
      method: 'POST',
      headers,
      body: JSON.stringify(emergencyGoal)
    });

    if (createEmergencyResponse.ok) {
      const createdEmergency = await createEmergencyResponse.json();
      console.log('✅ Meta de emergencia creada exitosamente:');
      console.log(JSON.stringify(createdEmergency.data, null, 2));
      const emergencyId = createdEmergency.data._id;
      console.log(`\n📋 ID de la meta de emergencia: ${emergencyId}\n`);

      // 2. Crear una meta de jubilación
      console.log('🏖️ 2. Creando meta de jubilación...');
      const retirementGoal = {
        name: 'Jubilación',
        targetAmount: 500000000,
        currency: 'COP',
        type: 'retirement',
        priority: 'high',
        timeline: {
          startDate: new Date(),
          targetDate: new Date(Date.now() + 30 * 365 * 24 * 60 * 60 * 1000) // 30 años
        },
        contribution: {
          frequency: 'monthly',
          amount: 500000,
          dayOfMonth: 15
        },
        description: 'Ahorro para jubilación a largo plazo'
      };

      const createRetirementResponse = await fetch(`${API_BASE}/savings`, {
        method: 'POST',
        headers,
        body: JSON.stringify(retirementGoal)
      });

      if (createRetirementResponse.ok) {
        const createdRetirement = await createRetirementResponse.json();
        console.log('✅ Meta de jubilación creada exitosamente:');
        console.log(JSON.stringify(createdRetirement.data, null, 2));
        const retirementId = createdRetirement.data._id;

        // 3. Crear una meta de vacaciones
        console.log('🏖️ 3. Creando meta de vacaciones...');
        const vacationGoal = {
          name: 'Vacaciones en la playa',
          targetAmount: 5000000,
          currency: 'COP',
          type: 'vacation',
          priority: 'medium',
          timeline: {
            startDate: new Date(),
            targetDate: new Date(Date.now() + 12 * 30 * 24 * 60 * 60 * 1000) // 12 meses
          },
          contribution: {
            frequency: 'monthly',
            amount: 400000,
            dayOfMonth: 5
          },
          description: 'Ahorro para vacaciones familiares'
        };

        const createVacationResponse = await fetch(`${API_BASE}/savings`, {
          method: 'POST',
          headers,
          body: JSON.stringify(vacationGoal)
        });

        if (createVacationResponse.ok) {
          const createdVacation = await createVacationResponse.json();
          console.log('✅ Meta de vacaciones creada exitosamente:');
          console.log(JSON.stringify(createdVacation.data, null, 2));
          const vacationId = createdVacation.data._id;

          // 4. Obtener todas las metas de ahorro
          console.log('\n📊 4. Obteniendo todas las metas de ahorro...');
          const getAllResponse = await fetch(`${API_BASE}/savings`, {
            headers
          });

          if (getAllResponse.ok) {
            const allGoals = await getAllResponse.json();
            console.log('✅ Todas las metas de ahorro:');
            console.log(JSON.stringify(allGoals.data, null, 2));
          }

          // 5. Obtener metas activas
          console.log('\n🟢 5. Obteniendo metas activas...');
          const activeResponse = await fetch(`${API_BASE}/savings/active`, {
            headers
          });

          if (activeResponse.ok) {
            const activeGoals = await activeResponse.json();
            console.log('✅ Metas activas:');
            console.log(JSON.stringify(activeGoals.data, null, 2));
          }

          // 6. Obtener resumen de ahorro
          console.log('\n📈 6. Obteniendo resumen de ahorro...');
          const summaryResponse = await fetch(`${API_BASE}/savings/summary`, {
            headers
          });

          if (summaryResponse.ok) {
            const summary = await summaryResponse.json();
            console.log('✅ Resumen de ahorro:');
            console.log(JSON.stringify(summary.data, null, 2));
          }

          // 7. Realizar una contribución a la meta de emergencia
          console.log('\n💰 7. Realizando contribución a la meta de emergencia...');
          const contributionResponse = await fetch(`${API_BASE}/savings/${emergencyId}/contribute`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
              amount: 200000,
              source: 'salary',
              notes: 'Contribución mensual regular'
            })
          });

          if (contributionResponse.ok) {
            const contribution = await contributionResponse.json();
            console.log('✅ Contribución realizada:');
            console.log(JSON.stringify(contribution.data, null, 2));
          }

          // 8. Realizar un retiro de la meta de vacaciones
          console.log('\n💸 8. Realizando retiro de la meta de vacaciones...');
          const withdrawalResponse = await fetch(`${API_BASE}/savings/${vacationId}/withdraw`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
              amount: 50000,
              reason: 'expense',
              notes: 'Gasto inesperado en vacaciones'
            })
          });

          if (withdrawalResponse.ok) {
            const withdrawal = await withdrawalResponse.json();
            console.log('✅ Retiro realizado:');
            console.log(JSON.stringify(withdrawal.data, null, 2));
          }

          // 9. Calcular próxima contribución
          console.log('\n📅 9. Calculando próxima contribución...');
          const nextContributionResponse = await fetch(`${API_BASE}/savings/${emergencyId}/calculate-next-contribution`, {
            method: 'POST',
            headers
          });

          if (nextContributionResponse.ok) {
            const nextContribution = await nextContributionResponse.json();
            console.log('✅ Próxima contribución:');
            console.log(JSON.stringify(nextContribution.data, null, 2));
          }

          // 10. Obtener proyección de ahorro
          console.log('\n🔮 10. Obteniendo proyección de ahorro...');
          const forecastResponse = await fetch(`${API_BASE}/savings/forecast?months=6`, {
            headers
          });

          if (forecastResponse.ok) {
            const forecast = await forecastResponse.json();
            console.log('✅ Proyección de ahorro (6 meses):');
            console.log(JSON.stringify(forecast.data.slice(0, 3), null, 2));
          }

          // 11. Obtener análisis de progreso
          console.log('\n📊 11. Obteniendo análisis de progreso...');
          const progressResponse = await fetch(`${API_BASE}/savings/progress`, {
            headers
          });

          if (progressResponse.ok) {
            const progress = await progressResponse.json();
            console.log('✅ Análisis de progreso:');
            console.log(JSON.stringify(progress.data, null, 2));
          }

          // 12. Obtener recomendaciones
          console.log('\n💡 12. Obteniendo recomendaciones...');
          const recommendationsResponse = await fetch(`${API_BASE}/savings/recommendations`, {
            headers
          });

          if (recommendationsResponse.ok) {
            const recommendations = await recommendationsResponse.json();
            console.log('✅ Recomendaciones:');
            console.log(JSON.stringify(recommendations.data, null, 2));
          }

          // 13. Actualizar la meta de emergencia
          console.log('\n✏️ 13. Actualizando la meta de emergencia...');
          const updateData = {
            contribution: {
              amount: 2000000,
              dayOfMonth: 1
            },
            description: 'Fondo de emergencia actualizado con mayor contribución'
          };

          const updateResponse = await fetch(`${API_BASE}/savings/${emergencyId}`, {
            method: 'PUT',
            headers,
            body: JSON.stringify(updateData)
          });

          if (updateResponse.ok) {
            const updatedGoal = await updateResponse.json();
            console.log('✅ Meta actualizada:');
            console.log(JSON.stringify(updatedGoal.data, null, 2));
          }

          // 14. Cambiar estado de la meta de vacaciones
          console.log('\n⏸️ 14. Pausando la meta de vacaciones...');
          const statusResponse = await fetch(`${API_BASE}/savings/${vacationId}/status`, {
            method: 'PATCH',
            headers,
            body: JSON.stringify({ status: 'paused' })
          });

          if (statusResponse.ok) {
            const statusChange = await statusResponse.json();
            console.log('✅ Estado cambiado:');
            console.log(JSON.stringify(statusChange.data, null, 2));
          }

          // 15. Marcar la meta de jubilación como completada
          console.log('\n🎉 15. Marcando la meta de jubilación como completada...');
          const completeResponse = await fetch(`${API_BASE}/savings/${retirementId}/status`, {
            method: 'PATCH',
            headers,
            body: JSON.stringify({ status: 'completed' })
          });

          if (completeResponse.ok) {
            const completedGoal = await completeResponse.json();
            console.log('✅ Meta completada:');
            console.log(JSON.stringify(completedGoal.data, null, 2));
          }

        } else {
          console.log('❌ Error al crear meta de vacaciones:', await createVacationResponse.text());
        }

      } else {
        console.log('❌ Error al crear meta de jubilación:', await createRetirementResponse.text());
      }

    } else {
      console.log('❌ Error al crear meta de emergencia:', await createEmergencyResponse.text());
    }

  } catch (error) {
    console.error('❌ Error en las pruebas:', error.message);
  }
}

// Ejecutar pruebas
testSavingsAPI().then(() => {
  console.log('\n🎉 ¡Pruebas de Savings API completadas!');
}).catch(error => {
  console.error('❌ Error en las pruebas:', error);
});
