# TÚAquiler — Android 2.1 (prototipo corregido)

## Qué incluye

- Alta y edición de inmuebles con **número de departamento/unidad** y canon/día de referencia **opcionales**.
- **Registrar inquilino** por separado, con nombre, cédula/pasaporte opcional, contacto, garantía, fechas, estado y **canon y día de cobro individuales**. Historial por mes de vigencia.
- Cobros manuales con historial identificando **inquilino, departamento, inmueble, fecha, medio e importe**, incluso al cambiar de ocupante.
- Gastos por propiedad, abonos parciales y reporte **Excel real (.xlsx)** con hojas «Resumen», «Ingresos», «Gastos», «Saldos».
- Borrador Word (.docx) de contrato preajustable para **vivienda urbana**, **habitación** o **local comercial**, con datos de las partes, inmueble, plazo, canon, garantía, servicios, inventario, responsabilidades y firmas. No firma ni registra contratos.
- Pantalla de inicio de sesión. La autenticación **real** por Google y correo/contraseña exige configurar Firebase Authentication en tu proyecto.
- Respaldo y restauración manual en JSON, datos guardados localmente en el teléfono y separados por UID de Firebase si se configura.
- Ajuste de espacio seguro para las barras superior e inferior de Android.

## Pasar la actualización a GitHub

1. **Antes de instalar otra APK**: en tu app actual, Ajustes → Guardar copia JSON, si ya registraste datos reales. Guarda el archivo fuera del teléfono también. No desinstales la versión anterior sin respaldo.
2. Extrae este ZIP en tu computadora. **No subas el ZIP cerrado.**
3. En el repositorio `danielegal96-debug/T-Aquiler`, reemplaza o sube conservando las mismas rutas de carpetas: `app/`, `.github/workflows/compilar-android.yml`, los archivos `*.gradle` y demás archivos de la raíz. Elimina solo la antigua carpeta raíz `workflows/` si aún existe (estaba fuera de `.github`).
4. Abre Actions → «Compilar TÚAquiler Android» para compilar `:app:assembleDebug`.
5. Descarga **TUAquiler-APK-pruebas** desde «Artifacts» si la ejecución es verde.
6. La APK debug puede estar firmada con otra clave al recompilar en GitHub. En ese caso Android impedirá instalarla encima; **conserva primero la copia JSON**, desinstala solo después de respaldar y luego restaura el JSON en la app nueva.

**Esta entrega contiene código; no incluye APK compilado ni acceso a una cuenta Firebase configurada.**

## Activar login de verdad: Google + registro por correo

1. En https://console.firebase.google.com crea un proyecto para TÚAquiler.
2. Agrega una aplicación Android con paquete `ec.tuaquiler.app`.
3. Activa **Authentication → Sign-in method → Email/Password y Google**.
4. Obtén del registro de la app las credenciales de configuración: `API_KEY`, `GOOGLE_APP_ID`, `PROJECT_ID`, y `WEB_CLIENT_ID` OAuth 2.0 **de tipo web** para el token de Google.
5. Sustituye los marcadores `CONFIGURAR_...` en `app/src/main/res/values/firebase_config.xml`. Este proyecto inicializa `FirebaseApp` manualmente, por lo que no necesita aplicar el plugin google-services. **Nunca subas claves privadas de cuentas de servicio.** Protege la API key con restricciones apropiadas.
6. Para el login Google registra en Firebase la(s) huella(s) SHA-1 (y SHA-256 si corresponde) del certificado con que se firma la APK. En GitHub Actions las firmas debug pueden cambiar por ejecución: usa un **keystore estable y privado** para pruebas prolongadas y para publicación un keystore de producción que no subas al repositorio público.
7. Recompila en GitHub. Al reconocer los valores reales, la pantalla ofrecerá Google, «Ingresar» y «Crear cuenta». Las contraseñas son manejadas por Firebase, no se guardan en `localStorage`.

**Limitación importante:** Firebase Auth confirma identidad, pero esta versión **NO** incluye copia automática de ingresos, gastos, documentos ni datos de inquilinos en la nube. Esos datos solo se guardan en el dispositivo; las cuentas separan la base local mediante el UID, y los cambios entre dispositivos requieren respaldo/restauración. Esta versión tampoco es apta aún para datos sensibles a escala comercial sin cifrado local, consentimiento/información adecuada, control de acceso, políticas de retención, pruebas de seguridad y revisión jurídica.

## Excel y contrato

- Ve a Ajustes → **Exportar Excel**. El reporte se genera para el período seleccionado y se guarda con el selector de documentos de Android.
- Ve a Inmuebles → «Registrar inquilino» → «Contrato». Llena los campos, confirma el plazo y el importe y pulsa «Generar contrato Word». Abre el DOCX con Word/Google Docs, revísalo con un abogado, anexa inventario y gestiona firmas/registro externamente.
- El documento NO representa una factura electrónica, un contrato automáticamente válido, una firma electrónica certificada ni registro ante notario.

## Referencias jurídicas para revisión

- Ley de Inquilinato (codificación consultada): arts. 8–12 (registro municipal/canon), 17–18 (límites del canon según aplicación), 27–29 (forma, plazo, registro notarial), 30 (terminación). https://www.gob.ec/sites/default/files/regulations/2025-10/LEY_DE_INQUILINATO.pdf
- Ley Orgánica de Protección de Datos Personales: arts. 7–10. https://www.gob.ec/sites/default/files/regulations/2025-01/01%20Ley%20Org%C3%A1nica%20de%20Protecci%C3%B3n%20de%20Datos%20Personales.pdf
- La Asamblea divulgó en octubre de 2026 un **proyecto** de reforma a la Ley de Inquilinato. No se aplican sus propuestas como obligaciones vigentes hasta comprobar su promulgación: https://www.asambleanacional.gob.ec/es/node/120048
- Sign in with Google en Android: https://developers.google.com/identity/siwg/best-practices
- Firebase Authentication Android: https://firebase.google.com/docs/auth/android/google-signin

## Seguridad y publicación

- El almacenamiento actual es localStorage de WebView (sin cifrado de datos de negocio). Falta cifrado/keystore y pruebas de amenazas antes de publicar una app que maneje identidades y contratos reales.
- La app incluye permiso INTERNET exclusivamente para autenticación en Firebase; la vista WebView sigue bloqueando navegación externa salvo enlaces de WhatsApp mediante aplicación externa.
- Se requiere una política de privacidad final, aviso de tratamiento de datos, seguridad de respaldos, eliminación de cuenta/datos y verificación de las condiciones de Google Play antes de publicar.


## Correcciones 2.1 (noviembre 2026)

- El alquiler y el día de cobro **no son obligatorios al agregar una propiedad**. Son valores orientativos que pueden definirse por cada nuevo inquilino. Se permite día del mes 1–31, y para meses más cortos se visualiza el último día.
- Cada ocupación conserva su **canon acordado**, día de cobro y un historial de cambios por mes de aplicación; los valores históricos no se cambian al corregir un mes posterior.
- Cambiar de inquilino en la misma unidad no atribuye al nuevo ocupante los pagos del anterior. Cada pago conserva `tenantId`, nombre, unidad, inmueble, importe, fecha y mes de alquiler.
- El panel y la hoja «Ingresos» usan ahora la **fecha real de recepción** para mostrar flujo de caja. El «saldo por cobrar» se calcula según el mes de alquiler seleccionado y los pagos imputados al contrato correspondiente. No son métricas idénticas.
- El reporte Excel tiene **Resumen, Ingresos, Gastos y Saldos**, con `SIN DEFINIR` si un alquiler no tiene canon pactado. Los importes sin canon no se cuentan automáticamente como deudas de 0 USD.
- El borrador de contrato usa las condiciones del inquilino y permite indicar un día pactado, opcional. Tiene una casilla que explica cuándo se aplicarán esas condiciones al seguimiento de pagos.
- Corrección de almacenamiento: `save()` utiliza ahora `storageKey` por cuenta para que la información de un UID Firebase no se mezcle con el modo local. No hay sincronización en la nube.
- Importar JSON admite propiedades antiguas (con canon obligatorio) y nuevas (con canon opcional), y valida estructura básica.

**Limitaciones conocidas:** no existe prorrateo automático del primer/último mes, cobro bancario automático, notificaciones programadas, cifrado de datos de negocio, sincronización multi-dispositivo ni resolución de deudas cruzadas entre meses. El saldo mensual corresponde a una ocupación vigente y no reemplaza una contabilidad completa. No emplees el prototipo para tratar datos sensibles de terceros hasta completar seguridad y privacidad.

**Pruebas:** navegación y formularios ejecutados en Chromium (390×844); migración desde base v2, dos departamentos con cánones diferentes, abonos parciales, cambio de canon, cambio de inquilino dentro del mismo mes, exportación xlsx y respaldo JSON. **No se ha compilado un APK ni probado la interfaz con Firebase real en esta revisión.**
