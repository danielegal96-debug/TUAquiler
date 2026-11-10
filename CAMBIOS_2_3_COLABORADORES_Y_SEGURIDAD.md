# TÚAquiler 2.3 — Colaboradores y seguridad (BETA)

## Funciones nuevas

- Apartado **Ajustes → Colaboradores**.
- Un propietario puede activar su administración compartida, invitar colaboradores a un correo concreto y revocarles el acceso.
- Invitaciones con código aleatorio, restringido al correo electrónico verificado del destinatario.
- Roles: **Propietario**, **Administrador**, **Cobrador** y **Lector**.
- Administradores pueden gestionar inmuebles, inquilinos, contratos, gastos y cobros.
- Cobradores consultan inmuebles y registran pagos, sin modificar contratos ni gastos.
- Lectores consultan información sin modificar registros.
- Se identifica qué cuenta registró cada cobro; los cobros que existían antes de habilitar un equipo se marcan como «Importado por…», pues se desconoce el registrador original.
- Cada cobro se almacena como documento independiente para reducir conflictos al cobrar desde teléfonos diferentes.
- Las reglas de Firebase restringen el acceso según el rol, además de los botones ocultos en la interfaz.
- El modo equipo no guarda deliberadamente una copia de la base de datos compartida en el almacenamiento web sin cifrar, y se deshabilita la caché persistente de Cloud Firestore. **Necesita conexión a internet**. El modo local independiente conserva sus operaciones sin conexión.

## IMPORTANTE: preparación del servicio

**No hay colaboración real sin Firebase configurado y reglas publicadas.** Nunca publiques una base de datos Firestore con las reglas de prueba que permiten acceso a cualquiera.

1. Crea un proyecto de Firebase a nombre del titular de TÚAquiler.
2. Registra la aplicación Android con ID de paquete `ec.tuaquiler.app`.
3. En Firebase Authentication activa proveedores **Correo/contraseña** y **Google**. Para inicio con Google configura SHA-1 y, cuando corresponda, SHA-256 del certificado con el que firmas la aplicación y el ID de cliente web OAuth.
4. En Cloud Firestore crea una base de datos con reglas restrictivas. Publica el archivo `firestore.rules` incluido (desde Firebase Console o Firebase CLI). El `firebase.json` señala ese archivo, pero **subirlo a GitHub NO publica las reglas**.
5. Copia la API key, App ID, Project ID y el ID del cliente web OAuth en `app/src/main/res/values/firebase_config.xml`, sin poner nunca credenciales de servicio, contraseñas o llaves privadas en el repositorio. Estos datos de configuración de cliente NO sustituyen las reglas de seguridad.
6. Genera un APK de prueba y comprueba usando **dos cuentas y dos teléfonos**: crear invitación, entrar con el correo de destino, registrar un cobro como cobrador, impedir editar contrato, revocar acceso y comprobar que dejó de poder consultar.
7. Guarda antes una copia JSON y usa datos ficticios en las pruebas. La importación inicial a Firebase se debe hacer una sola vez; no se recomienda sincronizar datos personales reales hasta pasar las pruebas de reglas.

## Restricciones conocidas

- **BETA sin pruebas de extremo a extremo con un proyecto Firebase real.** Se revisó el código, la sintaxis JS y se probaron los flujos de interfaz con simulación de Firebase. No afirmar que está listo para producción.
- Los cambios concurrentes de inmuebles y contratos usan «última escritura gana». Dos administradores editando el mismo inmueble podrían pisarse los cambios; requiere control de versiones/transacciones para producción.
- En equipo, la interfaz muestra cambios inmediatamente, pero un fallo de red puede impedir confirmarlos. Antes del uso real hacen falta indicadores explícitos de confirmación y reintentos.
- No se activan cobros de suscripción: la versión comercial de $3/mes o $20/año requiere integrar Google Play Billing y un servidor que valide los pagos y los límites. Los 3 inquilinos activos del modo gratuito siguen siendo un control **local**, no una protección comercial a prueba de manipulación.
- Un administrador con acceso a datos tiene capacidad de compartirlos externamente. Antes de usarlo con datos reales deben definirse consentimiento, política de retención, respaldo, seguridad y protección de datos de Ecuador.
- El estado de acceso puede tardar en cambiar si se pierde conectividad; con caché persistente deshabilitada se reduce el acceso a información previamente almacenada.

## Cómo subirlo a GitHub

1. Respalda los datos en la app antigua en **Ajustes → Exportar respaldo JSON**.
2. Descarga este ZIP y extráelo. En tu repositorio **T-Aquiler**, estando en la **raíz**, usa **Add file → Upload files** y sube el contenido extraído con sus carpetas.
3. Mantén `.github/workflows/compilar-android.yml` y **reemplaza** los archivos existentes con los nuevos. No subas una carpeta adicional que contenga todo el proyecto ni solo el ZIP.
4. En GitHub Actions revisa que `assembleDebug` sea exitoso. Sin configuración Firebase, la app sigue permitiendo modo local y **no** invita colaboradores reales.
5. Antes de activar el equipo, publica `firestore.rules` en Firebase y prueba con datos ficticios.
