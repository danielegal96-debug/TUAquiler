# TÚAquiler 2.6 — Registro guiado y edificios independientes

## Cambios implementados
- Nuevas cuentas y bases vacías inician con el asistente: 1) Inmueble, 2) Unidad/departamento, 3) Arrendatario, 4) Contrato opcional.
- El inmueble (edificio, conjunto, casa) tiene su registro propio en `db.buildings`; cada unidad se vincula mediante `buildingId` y conserva sus propios valores de referencia opcionales.
- Se puede añadir más de una unidad al mismo edificio. El registro de inquilinos está bloqueado hasta tener unidades disponibles.
- Si una unidad está ocupada, se impide registrar sobre ella otro inquilino activo; primero debe finalizarse el arrendamiento anterior.
- El contrato sigue en una pantalla independiente y precarga los datos del arrendatario.
- Versión de Android elevada a `versionCode 7`, `versionName 2.6.0-alta-guiada-beta`.

## Migración y respaldos
- Los registros `properties` de versiones 2.5 o anteriores se interpretan como **unidades** y reciben una referencia `buildingId`. Los inmuebles se deduplican por nombre y dirección, sin alterar `id` de las unidades.
- Los registros de pagos, gastos, contratos, inquilinos y comprobantes siguen apuntando a sus `propertyId` originales.
- Los respaldos JSON importados de versiones anteriores se migran automáticamente al abrirse. Guarda una copia JSON antes de actualizar.
- Si un inmueble anterior no tenía número de unidad, se lo identifica como `Principal`.
- En esta beta, iniciar sesión con Firebase no equivale a sincronización automática de datos en la nube. Debe validarse su configuración por separado.

## Verificaciones pendientes
- Aún debe compilarse el APK en GitHub Actions y probarse en un dispositivo real. En el modo demo no debe introducirse documentación personal o financiera sensible.
- La gestión de archivos adjuntos y correos automáticos del portal de inquilinos requiere Firebase Storage, reglas, funciones de servidor y pruebas de permisos entre cuentas.
