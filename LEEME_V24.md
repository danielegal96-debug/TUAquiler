# TÚAquiler 2.4 — Navegación lateral y nuevas pantallas (BETA)

## Lo que SÍ puedes probar ahora
- Menú lateral sin barra inferior, con acceso a Inmuebles, Unidades, Inquilinos, Contratos, Cobros, Gastos, Comprobantes, Informes, Colaboradores, Suscripción y Ajustes.
- Registro de inquilino seguido de **Crear contrato ahora / Hacerlo después**, en pantallas separadas.
- Ocupantes vinculados a un inquilino principal, sin crear otro canon ni consumir un cupo.
- Portal de inquilino **solo demostrativo y local** en el menú, sin iniciar una cuenta real de inquilino.
- Comprobante local (JPG/PNG/PDF hasta 5 MB) con archivo en IndexedDB; revisión manual, aprobación y creación de pago ligada al recibo. Los archivos **NO van incluidos** en el respaldo JSON.
- Informes Excel existentes, planes sin cobro real y administración por colaboradores en beta.

## Lo que NO funciona todavía entre teléfonos
- Registro e inicio de sesión separado de inquilinos/ocupantes con acceso limitado a su propio contrato.
- Subida a Firebase Storage, recepción en otros teléfonos y correos automáticos al dueño/administrador/colaboradores.
- Aprobación mediante operación transaccional de servidor. Lo actual es un circuito de prueba local que NO garantiza seguridad comercial.
- Suscripciones de pago de Google Play.

**No uses datos personales o comprobantes bancarios reales en esta beta.** Para producción se requiere Firebase Auth, Firestore, Storage, Cloud Functions, correo SMTP, reglas de seguridad, pruebas de ataques y política de privacidad.

## Cómo actualizar tu repositorio GitHub
1. Haz copia del respaldo JSON en la app anterior y descarga **Code → Download ZIP** del repositorio.
2. Extrae este ZIP. Abre tu repositorio en la carpeta principal, **Add file → Upload files** y sube las carpetas y archivos extraídos, conservando la jerarquía `.github/workflows`, `app/src/main/assets` y los Gradle.
3. No subas solo el ZIP ni crees carpetas `app/app`. Evita eliminar manualmente otros archivos; la carga con misma ruta reemplaza el contenido correspondiente.
4. Comprueba **Actions → Compilar TÚAquiler Android**. Descarga el APK de **Artifacts** solo si sale verde.
5. Instala como actualización sin borrar los datos previos. Si Android pide desinstalar, haz respaldo primero: puede deberse a firmas de compilación diferentes.
6. Prueba con datos ficticios y verifica los flujos. El paquete está preparado pero el APK no está compilado ni instalado por este asistente.

## Notas técnicas
- Se conserva la clave `tuaquiler.mvp.v1` para migrar registros de 2.3.
- `occupants` y `receipts` son arreglos nuevos en el modelo local. La separación real `properties` → `units` queda pendiente y está en el documento técnico.
- Los adjuntos en IndexedDB son locales y pueden perderse al borrar caché, desinstalar o cambiar de dispositivo; antes de cualquier uso real sustituirlos por Storage con reglas adecuadas y exportación/retención segura.
- El archivo existente `firestore.rules` es beta 2.3 para colaboradores. **NO autoriza el nuevo portal de inquilinos ni documentos Storage.** No se debe interpretar como sistema cloud completo.
- La barra de navegación inferior se oculta; los contenidos antiguos permanecen para facilitar compatibilidad.
