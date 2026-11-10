# TÚAquiler 2.1 — Correcciones y actualización en GitHub

## Cómo reemplazar los archivos de tu repositorio T-Aquiler

1. Antes de instalar otro APK, abre la app actual y guarda el **respaldo JSON** desde Ajustes. Guárdalo también en tu computadora o nube personal. No desinstales la versión actual hasta tenerlo.
2. En GitHub entra a **Code → Download ZIP** de tu repositorio y conserva una copia de la versión anterior.
3. Extrae el nuevo archivo TUAquiler_v21_Android_Corregido.zip en Windows.
4. Regresa a la **raíz** de `T-Aquiler` (no entres a `app`). Usa **Add file → Upload files** y sube todo el contenido extraído, conservando `app/src/...`, `.github/workflows/...`, `build.gradle`, etc. GitHub sobrescribirá rutas de igual nombre. Si la carga falla al reemplazar, edita los archivos individuales o utiliza GitHub Desktop; no dupliques carpetas.
5. Confirma el commit. En **Actions** comprueba la ejecución «Compilar TÚAquiler Android». Descarga el artefacto únicamente si termina en verde.
6. En Android, prueba primero una instalación **encima** de la anterior. Si la firma APK es distinta, Android no permitirá actualizarla. No desinstales hasta verificar que conservas un respaldo JSON válido; después podrás restaurarlo en la versión nueva.

## Qué cambió

- Canon mensual y día de cobro opcionales en «Nuevo inmueble».
- Canon y fecha individuales por cada inquilino; se guardan los cambios por período.
- Corrección de pendientes entre inquilinos y de separación por cuenta.
- Ingresos por fecha efectiva de recepción, saldo por mes imputado.
- Excel con Resumen, Ingresos, Gastos y Saldos.
- Contrato Word con canon/día del inquilino y opción explícita de aplicar condiciones a cobros.
- Validación mejorada de respaldos antiguos.

## Seguridad y cautelas

La app es aún **prototipo**. El modo local no cifra todos los datos de negocio. Firebase Google/Correo necesita configurarse con tus credenciales y probarse en Android; no incluye sincronización. Contratos son borradores legales editables, no documentos registrados. Revisar su legalidad y los anexos antes de firmar. No gestionar cédulas reales sin controles de seguridad adecuados.
