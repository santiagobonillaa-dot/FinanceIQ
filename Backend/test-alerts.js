import fetch from 'node-fetch';

const API_BASE = 'http://localhost:4000/api';

// Token real obtenido del login
const TEST_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OWZmOGVhNjlkOWQ2NjhiMzNkOTZhYjIiLCJlbWFpbCI6Im1vbmdvZGJAZmluYW5jZWlxLmNvbSIsImlhdCI6MTc3OTEzNzY3NiwiZXhwIjoxNzc5NzQyNDc2fQ.KZZfuLZNiVmQYxLILgwlN1Qj71wZYf1obBmcTOOuS5g';

const headers = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${TEST_TOKEN}`
};

async function testAlertsAPI() {
  console.log('🔔 Probando Alerts API...\n');

  try {
    // 1. Obtener alertas existentes
    console.log('📋 1. Obteniendo alertas existentes...');
    const getAlertsResponse = await fetch(`${API_BASE}/alerts`, {
      headers
    });

    if (getAlertsResponse.ok) {
      const existingAlerts = await getAlertsResponse.json();
      console.log('✅ Alertas existentes:');
      console.log(JSON.stringify(existingAlerts.data, null, 2));
    } else {
      console.log('❌ Error al obtener alertas:', await getAlertsResponse.text());
    }

    // 2. Obtener resumen de alertas
    console.log('\n📊 2. Obteniendo resumen de alertas...');
    const summaryResponse = await fetch(`${API_BASE}/alerts/summary`, {
      headers
    });

    if (summaryResponse.ok) {
      const summary = await summaryResponse.json();
      console.log('✅ Resumen de alertas:');
      console.log(JSON.stringify(summary.data, null, 2));
    } else {
      console.log('❌ Error al obtener resumen:', await summaryResponse.text());
    }

    // 3. Generar alertas automáticas
    console.log('\n🤖 3. Generando alertas automáticas...');
    const autoGenerateResponse = await fetch(`${API_BASE}/alerts/auto-generate`, {
      method: 'POST',
      headers
    });

    if (autoGenerateResponse.ok) {
      const generatedAlerts = await autoGenerateResponse.json();
      console.log('✅ Alertas generadas automáticamente:');
      console.log(JSON.stringify(generatedAlerts.data, null, 2));
    } else {
      console.log('❌ Error al generar alertas automáticas:', await autoGenerateResponse.text());
    }

    // 4. Obtener alertas activas
    console.log('\n🟢 4. Obteniendo alertas activas...');
    const activeResponse = await fetch(`${API_BASE}/alerts/active`, {
      headers
    });

    if (activeResponse.ok) {
      const activeAlerts = await activeResponse.json();
      console.log('✅ Alertas activas:');
      console.log(JSON.stringify(activeAlerts.data, null, 2));
    } else {
      console.log('❌ Error al obtener alertas activas:', await activeResponse.text());
    }

    // 5. Obtener alertas críticas
    console.log('\n🔴 5. Obteniendo alertas críticas...');
    const criticalResponse = await fetch(`${API_BASE}/alerts/critical`, {
      headers
    });

    if (criticalResponse.ok) {
      const criticalAlerts = await criticalResponse.json();
      console.log('✅ Alertas críticas:');
      console.log(JSON.stringify(criticalAlerts.data, null, 2));
    } else {
      console.log('❌ Error al obtener alertas críticas:', await criticalResponse.text());
    }

    // 6. Crear una alerta manual
    console.log('\n➕ 6. Creando una alerta manual...');
    const manualAlert = {
      title: 'Alerta de Prueba',
      message: 'Esta es una alerta de prueba para verificar el funcionamiento del sistema',
      type: 'test',
      category: 'system',
      priority: 'medium',
      details: {
        test: true,
        createdBy: 'test-script'
      },
      source: {
        type: 'manual',
        moduleId: 'test-module',
        entityId: 'test-entity',
        entityType: 'test'
      }
    };

    const createAlertResponse = await fetch(`${API_BASE}/alerts`, {
      method: 'POST',
      headers,
      body: JSON.stringify(manualAlert)
    });

    if (createAlertResponse.ok) {
      const createdAlert = await createAlertResponse.json();
      console.log('✅ Alerta creada exitosamente:');
      console.log(JSON.stringify(createdAlert.data, null, 2));
      const alertId = createdAlert.data._id;

      // 7. Marcar alerta como leída
      console.log('\n👁️ 7. Marcando alerta como leída...');
      const markAsReadResponse = await fetch(`${API_BASE}/alerts/${alertId}/mark-as-read`, {
        method: 'POST',
        headers
      });

      if (markAsReadResponse.ok) {
        const readAlert = await markAsReadResponse.json();
        console.log('✅ Alerta marcada como leída:');
        console.log(JSON.stringify(readAlert.data, null, 2));
      } else {
        console.log('❌ Error al marcar alerta como leída:', await markAsReadResponse.text());
      }

      // 8. Reconocer alerta
      console.log('\n✅ 8. Reconociendo alerta...');
      const acknowledgeResponse = await fetch(`${API_BASE}/alerts/${alertId}/acknowledge`, {
        method: 'POST',
        headers
      });

      if (acknowledgeResponse.ok) {
        const acknowledgedAlert = await acknowledgeResponse.json();
        console.log('✅ Alerta reconocida:');
        console.log(JSON.stringify(acknowledgedAlert.data, null, 2));
      } else {
        console.log('❌ Error al reconocer alerta:', await acknowledgeResponse.text());
      }

      // 9. Resolver alerta
      console.log('\n🎯 9. Resolviendo alerta...');
      const resolveResponse = await fetch(`${API_BASE}/alerts/${alertId}/resolve`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          resolution: {
            action: 'test-completed',
            notes: 'Alerta de prueba resuelta exitosamente'
          }
        })
      });

      if (resolveResponse.ok) {
        const resolvedAlert = await resolveResponse.json();
        console.log('✅ Alerta resuelta:');
        console.log(JSON.stringify(resolvedAlert.data, null, 2));
      } else {
        console.log('❌ Error al resolver alerta:', await resolveResponse.text());
      }

      // 10. Buscar alertas
      console.log('\n🔍 10. Buscando alertas con "prueba"...');
      const searchResponse = await fetch(`${API_BASE}/alerts/search?q=prueba`, {
        headers
      });

      if (searchResponse.ok) {
        const searchResults = await searchResponse.json();
        console.log('✅ Resultados de búsqueda:');
        console.log(JSON.stringify(searchResults.data, null, 2));
      } else {
        console.log('❌ Error en búsqueda:', await searchResponse.text());
      }

      // 11. Obtener estadísticas de alertas
      console.log('\n📈 11. Obteniendo estadísticas de alertas...');
      const statsResponse = await fetch(`${API_BASE}/alerts/statistics?period=30d`, {
        headers
      });

      if (statsResponse.ok) {
        const stats = await statsResponse.json();
        console.log('✅ Estadísticas de alertas:');
        console.log(JSON.stringify(stats.data, null, 2));
      } else {
        console.log('❌ Error al obtener estadísticas:', await statsResponse.text());
      }

    } else {
      console.log('❌ Error al crear alerta manual:', await createAlertResponse.text());
    }

  } catch (error) {
    console.error('❌ Error en las pruebas:', error.message);
  }
}

// Ejecutar pruebas
testAlertsAPI().then(() => {
  console.log('\n🎉 ¡Pruebas de Alerts API completadas!');
}).catch(error => {
  console.error('❌ Error en las pruebas:', error);
});
