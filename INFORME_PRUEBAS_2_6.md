# Informe de pruebas — TÚAquiler 2.6

## Verificación completada en navegador Chromium

- Base vacía: primero se muestra el asistente de alta de inmuebles, sin botón para registrar inquilinos.
- Acceso a Inquilinos mediante menú lateral: no elude la obligación de crear inmueble y unidad.
- Tras registrar un inmueble, exige crear al menos una unidad.
- Se crearon dos departamentos (101 y 102) dentro de un mismo edificio, con cánones de referencia diferentes ($240 y $325) y días de cobro diferentes (5 y 12).
- Intento de crear dos unidades 101 bajo el mismo edificio: rechazado.
- Al registrar un inquilino en 101, esa unidad deja de aparecer entre las opciones disponibles para registrar otro inquilino.
- Campos de la unidad de un inquilino: solo lectura para evitar incoherencias con el identificador de la unidad.
- El contrato sigue siendo un formulario separado que precarga los datos de la persona.
- La información sigue disponible después de recargarla en otra sesión de prueba.
- **Migración de versiones previas:** dos registros antiguos con el mismo nombre y dirección fueron agrupados en un inmueble con dos unidades, preservando IDs de unidad, inquilino y pago.
- No se observaron excepciones JavaScript en estas pruebas.

## No confirmado aún

- Compilación del APK en GitHub Actions (no hay SDK/Gradle instalados en el entorno de verificación).
- Instalación y pruebas con Android real y diferentes resoluciones.
- Comportamiento de Firebase real entre varios dispositivos, facturación y correos automáticos.
- Auditoría de seguridad o pruebas exhaustivas con datos de producción.

**No introducir cédulas, contratos ni comprobantes bancarios reales en modo de prueba local sin medidas de privacidad y seguridad adicionales.**
