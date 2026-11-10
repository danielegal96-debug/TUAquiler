# TÚAquiler 2.9.2 — Contratos por menos de dos años

## Corregido

- Los contratos pueden tener plazos de 1, 2, 3, 6, 9, 12, 18 o 24 meses, o fechas personalizadas (también menos de un mes).
- Seleccionar una duración actualiza automáticamente la fecha final y se guarda la fecha elegida en el documento Word.
- No existe validación técnica que obligue a un mínimo de 24 meses. Se impide solamente terminar el contrato antes de su inicio.
- Se mantiene una advertencia legal informativa, sin bloquear el guardado.
- Actualizados versionCode 14, BUILD_TAG 2.9.2, el archivo de GitHub Actions y la caché de WebView.
- Corrección del archivo build.gradle raíz y de los repositorios para resolver errores de búsqueda de com.android.application.

## IMPORTANTE: alcance legal

Registrar un plazo privado menor de dos años NO implica que en toda situación sea exigible la desocupación al terminarlo. El art. 28 de la Ley de Inquilinato de Ecuador reconoce por regla general un derecho del arrendatario a una duración mínima de dos años, con excepciones. La generación del Word no sustituye asesoría legal, registro u otras formalidades.

## Instalación

1. Respaldar datos de la app en JSON; no desinstalar sin respaldo.
2. Extraer este ZIP y subir todos los archivos manteniendo sus rutas a la raíz del repositorio GitHub, reemplazando las versiones anteriores.
3. Confirmar que la raíz `build.gradle` indique AGP 8.13.2, `settings.gradle` tenga google() y que `app/build.gradle` indique versionCode 14.
4. Ejecutar el workflow de GitHub Actions *Compilar TÚAquiler Android*.
5. Descargar el artefacto del commit más reciente `TUAquiler-v2.9.2-*` e instalar. Confirmar en la app `Datos locales · v2.9.2`.
6. Abrir un inquilino → Crear contrato → Duración pactada, elegir 6 o 12 meses, comprobar fecha fin y generar Word.

La compilación APK real y el envío a Google Play aún requieren ser verificados en GitHub y en Android.
