# TÚAquiler 2.5 — Registro condicionado y datos del arrendatario

## Correcciones
- No aparece "Registrar inquilino" si aún no existe un inmueble o departamento disponible. En su lugar se muestra el paso obligatorio de alta del inmueble.
- Se evita también abrir el formulario de inquilinos desde accesos residuales sin un inmueble previo.
- La lista de inquilinos puede consultarse aunque no haya inmuebles, por ejemplo al revisar una copia de seguridad, pero la creación queda bloqueada hasta añadir el inmueble.
- La ficha del arrendatario ahora incluye tipo y número de documento, nacionalidad, estado civil, ocupación, domicilio para notificaciones, teléfono y correo. Los datos no esenciales son opcionales.
- El formulario de contrato, en pantalla independiente, recupera esos datos y permite editarlos específicamente para el borrador Word. El contrato incluye la identificación y datos de notificación disponibles.
- Se conserva la clave local de datos y la estructura de pagos para no borrar registros existentes.

## Limitaciones conocidas
- En esta beta, "inmueble" y "unidad" comparten todavía un registro del modelo anterior. La separación real de propiedad y múltiples unidades requiere una migración de datos adicional.
- La app actual sigue en modo de prueba local salvo que se configure Firebase; no se ha activado acceso de inquilinos reales ni correos automáticos.
- Los contratos generados son borradores editables, no documentos firmados ni inscritos.
- Antes de actualizar, exporta un JSON de respaldo en la app actual. Para instalar un APK es necesario compilar en GitHub Actions, sin garantizar que la compilación en Android esté aprobada hasta verificarla.
- El acceso local no es apto para almacenar cédulas reales sin medidas de seguridad y cifrado adicionales.

## Cómo actualizar
1. Descarga el ZIP y extrae su contenido.
2. Desde la raíz de tu repositorio GitHub sube el contenido de las carpetas `app` y `.github` y los archivos restantes, conservando sus rutas.
3. Ejecuta Actions > Compilar TÚAquiler Android, verifica que termine en verde y realiza pruebas con datos ficticios.
4. Conserva respaldo del APK anterior y del JSON de datos hasta confirmar que la nueva versión funciona.
