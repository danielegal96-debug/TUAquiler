# Informe de pruebas TÚAquiler 2.4

**Fecha:** 10/11/2026. **Entorno:** Chromium automatizado, WebView Android no verificado. Almacenamiento local simulado en el entorno de prueba; IndexedDB simulado porque la navegación `file://` y localhost está restringida en el navegador de pruebas. **No son pruebas contra Firebase real**.

## Casos verificados
- JS del prototipo: comprobación sintáctica con `node --check`.
- Menú lateral abre, sustituye la barra inferior, navega y cierra.
- Alta de inmueble y unidad de prueba.
- Registro de inquilino por $240 / día 8; cuadro posterior ofrece contrato separado.
- Registro de ocupante asociado, sin canon independiente.
- Apertura de módulo independiente Contratos.
- Portal de inquilino local DEMO con la unidad y saldo del mes.
- Subida de PDF falso de prueba con almacenamiento IndexedDB simulado; estado pendiente.
- Aprobación consciente del comprobante y reflejo de $120 como pago del inquilino.
- Entrada a Informes con acción Exportar Excel.
- Sin excepciones de JavaScript en esta secuencia de prueba.

## No verificado
- Persistencia real de archivos por IndexedDB en WebView Samsung/Android.
- Envío de correo y recepción en cuentas diferentes.
- Firebase Storage, reglas Firestore/Storage, App Check y Cloud Functions.
- Compilación real de APK en GitHub Actions, firma, instalación y migración en un teléfono.
- Seguridad frente a usuarios maliciosos, funcionamiento offline en modo equipo, límites de cobro comercial.

**Veredicto:** apto para revisión funcional con datos ficticios, no apto todavía para producción.
