# TÚAquiler 2.3 — Informe de pruebas realizadas

Fecha: 10 de noviembre de 2026

| Prueba | Resultado | Método |
| --- | --- | --- |
| Interfaz de Colaboradores en modo local | OK | Playwright Chromium |
| No inventar invitaciones sin Firebase | OK | Playwright Chromium |
| Pantalla de propietario e invitación | OK | Simulación de eventos de Firebase |
| Administrador / Cobrador / Lector: diferencias visuales | OK | Simulación de eventos de Firebase |
| Cobrador sin acceso a crear inmuebles/inquilinos | OK | Playwright Chromium |
| Lector sin opción de registrar pagos ni sección Gastos | OK | Playwright Chromium |
| Registro de cobro compartido no contabilizado antes de confirmación | OK | Playwright + puente simulado |
| Registro compartido contabilizado al recibir confirmación | OK | Playwright + puente simulado |
| Revocación borra estado de equipo visible y vínculo guardado | OK | Playwright + puente simulado |
| Datos compartidos no se escriben en localStorage en los flujos probados | OK | Playwright |
| Sintaxis JavaScript | OK | node --check |
| Reglas Firestore reales y concurrencia multiteléfono | NO COMPROBADO | Requiere proyecto Firebase y emulador de reglas |
| Compilación Android y prueba en dispositivo | NO COMPROBADO | Requiere Android SDK y GitHub Actions |
| Cobros de suscripciones de Google Play | NO IMPLEMENTADO | Requiere Billing y validación de servidor |

**Limitación de seguridad:** los roles también están escritos en `firestore.rules` para permitir/denegar lecturas y escrituras del servidor, pero esta comprobación no sustituye a una prueba real de reglas. La caché persistente de Firestore en equipo está deshabilitada. Los cambios concurrentes de contratos/inmuebles requieren control de versiones antes de producción.
