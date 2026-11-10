# TÚAquiler 2.8.1 — actualización identificable

Este paquete está diseñado para crear un repositorio nuevo, sin arrastrar archivos viejos, o reemplazar por completo los archivos de un repositorio conservado. Es código fuente, NO un APK.

## Sin eliminar el anterior
1. Conserva el repositorio anterior como copia de seguridad. En GitHub: Code > Download ZIP.
2. Crea un repositorio **nuevo** vacío (por ejemplo `TUAquiler-limpio`), sin README, licencia ni .gitignore inicial.
3. Descarga este ZIP, extráelo en Windows y carga **el contenido** desde la raíz del nuevo repositorio: `app`, `.github`, los archivos Gradle, etc. No cargues solo el ZIP.
4. Asegúrate de que se vea `.github/workflows/compilar-android.yml` y `app/src/main/assets/app.js`.
5. En Actions, ejecuta `Compilar TÚAquiler Android`. La consola debe mostrar `versionCode 10`, `versionName 2.8.1-actualizacion-verificable-beta` y `BUILD_TAG='2.8.1'`.
6. Desde ESA ejecución, descarga el artefacto `TUAquiler-v2.8.1-<hash-commit>` con `TUAquiler-v2.8.1-<hash-corto>-debug.apk`.
7. Antes de reemplazar instalaciones antiguas, exporta tus registros a JSON y guarda el archivo fuera de la app. **Los APK debug compilados en ejecuciones distintas de GitHub pueden estar firmados con claves diferentes**; Android puede impedir la actualización directa. Si debes desinstalar, los datos locales se eliminan: realiza y comprueba el respaldo primero, luego instala la nueva versión y restaura el JSON.
8. En la app debe leerse `Datos locales · v2.8.1` (o `Equipo · v2.8.1` según el modo). Si no aparece, sigues abriendo otra compilación.

## Qué corrige
- Archivo de instalación claramente identificable por versión y commit.
- El WebView carga HTML y JS sin reutilizar cachés anteriores. **No se elimina localStorage al abrir.**
- Comprueba versión de la fuente antes de compilar.
- Mantiene el flujo inmueble → unidad → inquilino → contrato y los formularios por páginas de 2.8.

## Límites
No hemos compilado ni instalado este APK dentro de un Android real en esta sesión. La autenticación y los colaboradores entre teléfonos necesitan una configuración Firebase de producción; no introducir datos sensibles en el modo local de pruebas.
