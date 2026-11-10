# TÚAquiler 2.4 — Especificación funcional y técnica
**Estado:** prototipo beta + diseño de integración cloud. **Fecha:** 10 de noviembre de 2026. **Destino:** Android / Google Play, enfoque inicial Ecuador.

> **Alcance real:** menú lateral, pantalla independiente de inquilinos, creación de contratos en un paso posterior, ocupantes autorizados, informes, pantalla de comprobantes y flujo de envío/aprobación **local de demostración**. El login real entre cuentas, los archivos compartidos y la notificación por correo siguen pendientes de configurar y probar en Firebase. No usar datos personales reales en la beta.

## 1. Principios de producto
- Diferenciar **inmueble → unidad/departamento → arrendamiento → inquilino principal → ocupantes autorizados**. Los ocupantes no generan automáticamente otro canon.
- Conservar pagos y contratos asociados a un arrendamiento específico, aunque cambie de persona o importe.
- Cobros solo confirmados al verificarse la recepción efectiva del dinero. Un comprobante no prueba por sí solo que una transferencia fue acreditada.
- El menú lateral sustituye a la navegación inferior; mantener encabezado y áreas seguras del sistema Android.
- Inicio de sesión seguro y datos mínimos por rol. Ningún inquilino verá registros de otro.
- Plan Gratis: hasta 3 **inquilinos principales activos**; Pro propuesto: USD 3/mes o USD 20/año. Occupantes y registros históricos no ocupan cupos.

## 2. Mapa de pantallas y textos
### 2.1 Acceso
**Pantallas:** Splash → Bienvenida → Iniciar sesión / Crear cuenta / Recuperar contraseña → Confirmar correo → Selección del espacio / invitación.
**Campos de registro:** nombre, correo, contraseña, confirmación, aceptación de política. Google y correo/contraseña a través de Firebase Authentication. Validar correo para entrar a administración compartida. **Texto:** «Tu alquiler, todo bajo control»; «Usa tu correo o tu cuenta de Google para continuar».
**Importante:** la cuenta tipo inquilino/ocupante se vincula a un arrendamiento por una invitación verificada del propietario; nunca basta elegir un inquilino en una lista.

### 2.2 Menú lateral
Inicio; Inmuebles; Unidades; Inquilinos; Contratos; Cobros; Gastos; Comprobantes; Informes; Colaboradores; Suscripción; Ajustes; Cerrar sesión. En beta aparece «Vista inquilino — DEMO». El menú se cierra al navegar, tocar fuera, pulsar Esc o volver de Android. Las entradas se ocultan por permisos, pero el servidor también debe denegar las peticiones no autorizadas.

### 2.3 Inicio
**Tarjetas:** ingresos recibidos este mes, pendiente por cobrar, balance neto y alquileres al día. **Avisos futuros:** pagos vencidos, contratos que vencen, comprobantes por revisar. **Botones:** Registrar inquilino, Registrar pago, Añadir inmueble. Filtro de mes. **Texto:** «Todo en orden. Todo en un lugar.»

### 2.4 Inmuebles
**Lista:** nombre, dirección, ciudad/provincia, número de unidades, estado y acciones. **Nuevo inmueble:** nombre obligatorio; tipo; dirección, ciudad, provincia y observaciones. **No obligar** canon ni día de cobro: se definen en unidad o arrendamiento. **Texto:** «Primero registra el inmueble. Después podrás añadir sus unidades».

### 2.5 Unidades / departamentos
**Campos:** inmueble padre, código o número de unidad, piso, tipo, área y descripción opcional; canon y día sugeridos opcionales. Las unidades deben ser únicas dentro del mismo inmueble. Estados: libre, ocupada, reservada, inactiva. **Nota de migración:** en el prototipo 2.4 cada unidad sigue representada por un registro de inmueble de la versión anterior. La separación física inmueble/unidad queda definida para la refactorización cloud.

### 2.6 Inquilinos principales
**Lista:** nombre, unidad, teléfono, estado, canon acordado y próximo cobro. **Registrar inquilino:** nombres, identificación, correo, teléfono, unidad, fecha inicio/fin, canon y día de pago propios, garantía, observaciones. Validar fechas y evitar dos arrendamientos principales activos simultáneos en la misma unidad. **Después de guardar:** diálogo «Inquilino registrado» con acciones **Crear contrato ahora** / **Hacerlo después**. Ningún campo de cláusula contractual aparece en ese formulario.

### 2.7 Ocupantes autorizados
Un ocupante se vincula al arrendamiento principal; campos: nombre, correo opcional, teléfono, vínculo y autorización de envío de comprobantes. No se le crea una deuda ni un contrato independiente por defecto. El propietario/administrador controla el alta y retiro. **Texto:** «Ocupante registrado sin canon independiente».

### 2.8 Contratos
**Pantalla separada:** lista de contratos, filtros borrador/activo/finalizado/renovado, botón **Crear contrato** por inquilino. **Editor:** arrendador y arrendatario (identidad), inmueble/unidad/destino, fechas, plazo, canon, garantía, medios y día de pago, servicios, inventario y acta de entrega, cláusulas editables, firmas y anexos. Salidas: Word editable y, posteriormente, PDF. **Alerta:** «Documento borrador. No equivale a firma electrónica ni a inscripción notarial».

### 2.9 Cobros e historial
**Campos:** quién pagó, qué unidad, arrendamiento, período al que corresponde, fecha efectiva de recepción, monto, método y referencia, estado y quién lo aprobó. Soportar abonos parciales, cambios de canon e inquilinos sucesivos. Un comprobante pendiente NO aumenta ingresos. El cobro confirmado incluye `sourceReceiptId` para impedir duplicados.

### 2.10 Comprobantes
**Portal de inquilino:** escoger período, monto, método, archivo JPEG/PNG/PDF de máximo 5 MB y nota. **Estados:** pendiente, en revisión, aprobado, rechazado, requiere corrección. **Administración:** lista filtrable por inmueble, unidad, período y estado; visualizar y aprobar/rechazar con motivo. **Aprobación:** confirmar dinero recibido; ejecutar transacción atómica e idempotente para generar el pago y registrar autor/fecha de verificación. **Texto de carga:** «Tu comprobante se enviará a revisión. El saldo cambiará cuando el pago se confirme».

### 2.11 Portal de inquilino/ocupante
Acceso con cuenta propia y vínculo verificado. **Inquilino principal:** información de su unidad y contrato, canon, saldo, próximos vencimientos, pagos, comprobantes y notificaciones. **Ocupante:** vista limitada de datos de la ocupación, con opción de subir comprobante solo si el propietario la autorizó. Sin acceso a datos de otros departamentos, gastos, reportes globales ni cuentas de otros usuarios.
**Beta 2.4:** «Vista inquilino — DEMO» únicamente desde el dispositivo administrador, sin cuenta real y sin compartir información en la nube.

### 2.12 Gastos e informes
**Gastos:** inmueble, unidad opcional, categoría, descripción, fecha, monto, comprobante. **Informes:** filtro de mes/rango, inmueble y unidad. Excel con hojas «Resumen», «Ingresos», «Gastos» y «Saldos» (actual). Futuro: «Contratos» y «Comprobantes», teniendo cuidado de no exportar datos personales innecesarios. Exportación solo a roles permitidos.

### 2.13 Colaboradores y planes
**Colaboradores:** invitar, asignar administrador/cobrador/lector, revocar, historial de acciones. **Planes:** Gratis 3 inquilinos principales activos, Pro USD 3 mensuales o USD 20 anuales, sujetos a integración real de Google Play Billing. El vencimiento de Pro nunca elimina el historial.

## 3. Matriz de permisos esperada
| Acción | Dueño | Administrador | Cobrador | Lector | Inquilino principal | Ocupante autorizado |
|---|---|---|---|---|---|---|
| Ver inmuebles de la administración | Sí | Sí | Limitado | Limitado | Solo unidad | Solo unidad |
| Editar inmuebles e inquilinos | Sí | Sí | No | No | No | No |
| Crear y editar borradores de contrato | Sí | Sí | No | No | No | No |
| Registrar cobro confirmado | Sí | Sí | Sí | No | No | No |
| Aprobar comprobantes | Sí | Si está autorizado | Si está autorizado | No | No | No |
| Subir comprobantes de su unidad | No aplica | No aplica | No aplica | No aplica | Sí | Si está autorizado |
| Consultar sus propios pagos | Sí | Sí | Sí | Limitado | Sí | Limitado |
| Cambiar permisos y suscripciones | Sí | No | No | No | No | No |

## 4. Flujos exactos
1. **Alta de unidad:** Crear inmueble → crear unidad → asignar número único → guardar.
2. **Alta del inquilino:** Escoger unidad → completar ficha y canon individual → guardar → **Crear contrato ahora** o **Hacerlo después**.
3. **Contrato:** Abrir módulo Contratos (pantalla distinta) → precargar datos → completar condiciones/anexos → generar Word borrador → revisión legal y firmas externas.
4. **Alta de ocupante:** Abrir inquilino principal → Añadir ocupante → asociar identidad → activar o no permiso de subir comprobantes.
5. **Recepción de pago:** Inquilino inicia sesión → escoger período → adjuntar archivo → validar formato/tamaño → subir a Storage → crear recibo `submitted` en Firestore → función de servidor notifica correos autorizados.
6. **Aprobación:** Administrador abre recibo → comprueba en banco dinero realmente recibido → aprueba en función transaccional → crea pago una sola vez → cambia saldo → notifica inquilino y escribe auditoría. Rechazo con motivo sin alterar el saldo.
7. **Revocación:** Dueño revoca colaboración u ocupación → las reglas niegan las consultas futuras y se invalidan enlaces de archivos; considerar sesiones offline y expiración de URLs.

## 5. Arquitectura de referencia para Firebase
**Android:** WebView actual + puente nativo Java para autenticación existente; evolución deseable a capas ViewModel/Repository para permisos, red y archivos. **Firebase Authentication** (Google y correo/contraseña) → **Cloud Firestore** (datos normalizados) → **Cloud Storage** (adjuntos) → **Cloud Functions 2nd gen** (autorización de operaciones críticas, aprobación de pagos, correo, auditoría) → **servicio de correo transaccional** (SMTP/servicio compatible). No insertar claves privadas en Android ni secretos SMTP en GitHub.

Colecciones sugeridas:
```
users/{uid}                                   # perfil mínimo y espacios vinculados
workspaces/{workspaceId}                      # ownerUid, configuración, plan verificado
workspaces/{workspaceId}/members/{uid}        # rol, estado y permisos, administrados por servidor
workspaces/{workspaceId}/properties/{id}      # edificio/casa/propiedad principal
workspaces/{workspaceId}/units/{id}           # propertyId, número único, estado
workspaces/{workspaceId}/people/{id}          # datos personales minimizados y restringidos
workspaces/{workspaceId}/leases/{id}          # unitId, tenantPersonId, fechas, historial canon
workspaces/{workspaceId}/occupants/{id}       # leaseId, personId, uid verificado, permisos
workspaces/{workspaceId}/contracts/{id}       # leaseId, versión, borrador, archivo
workspaces/{workspaceId}/receipts/{id}        # leaseId, uploaderUid, período, status, storagePath
workspaces/{workspaceId}/payments/{id}        # leaseId, amount, receivedAt, sourceReceiptId
workspaces/{workspaceId}/expenses/{id}        # propertyId, fecha, monto, categoría
workspaces/{workspaceId}/auditLogs/{id}       # inmutable, solo servidor
mailJobs/{id}                                 # solo funciones de servidor
```
Archivos: `workspaces/{workspaceId}/receipts/{receiptId}/{safeName}`. Restringir tamaños y MIME, comprobar pertenencia en reglas Storage y revalidar contenido en servidor. Nunca permitir que el cliente indique libremente los destinatarios del correo.

**Reglas y permisos:** autorizaciones por UID real, membresía activa y relación de arrendamiento. Firestore Rules protegen documentos completos: separar los datos privados de la información que puede leer un cobrador o un inquilino. Las escrituras de aprobación y pagos, cambios de roles, vinculaciones de cuentas y limitaciones comerciales deben pasar por funciones de servidor. Aplicar App Check y pruebas automatizadas con Firebase Emulator Suite, incluyendo intentos maliciosos de acceso.

**Envío de correo:** crear evento servidor al recibir comprobante; cargar correos **verificados** del dueño/administradores/colaboradores autorizados y sus preferencias; enviar aviso mínimo con enlace autenticado dentro de TÚAquiler, sin copia abierta del comprobante en el correo. El sistema de envío puede usar la extensión oficial Trigger Email con un proveedor SMTP, siempre escribiendo en la colección de correo solo desde funciones de confianza. Implementar reintentos, idempotencia y auditoría.

**Sincronización:** escuchar estados de comprobantes y pagos por workspace; evitar escrituras de último en guardar para valores monetarios. Calcular importes y estado de plan en servidor. Restringir vistas offline de documentos personales y aplicar vencimiento y eliminación de retenciones según política.

## 6. Contratos y normativa ecuatoriana (revisión previa obligatoria)
- Ley de Inquilinato, arts. 27–29: contrato verbal o escrito, regla de duración mínima de dos años a favor del arrendatario con excepciones, y escrito/registro notarial cuando el canon exceda de un SBU mensual, según texto consultado. Confirmar normativa vigente y reglamentación local antes de generar textos finales.
- Requisitos municipales, canon y registro de inmuebles pueden variar con la ubicación y normativa aplicable. No prometer validez automática.
- Ley Orgánica de Protección de Datos Personales: informar finalidad, base de legitimación, tratamiento de cédulas, correos, contratos y comprobantes, acceso por roles, conservación, seguridad y derechos de los titulares. Evaluación jurídica y de seguridad antes del despliegue comercial.

## 7. Reglas de negocio esenciales
- **Cupo Gratis:** contar únicamente arrendamientos con inquilino principal activo, no ocupantes ni históricos; validación servidor antes de crear otro activo. No perder información al vencer Pro.
- **Pagos:** usar decimal de dos posiciones o enteros de centavos; evitar doble registro de un `receiptId`. Separar `receivedAt` del `period` al que corresponde.
- **Historial:** nunca reasignar un pago al nuevo ocupante de una unidad. Mantener instantánea de nombres, unidad y canon del período del pago, con trazabilidad jurídica.
- **Borrador de contrato:** versión y fecha; no sobrescribir un documento ya firmado. Registrar el consentimiento/firmas por sistema jurídicamente habilitado cuando exista.
- **Adjuntos:** limitar 5 MB y tipos PDF/JPG/PNG, no aceptar ejecutables; antivirus y controles adicionales en producción. En la beta los adjuntos locales se guardan en IndexedDB y NO se incluyen en el JSON de respaldo.

## 8. Pruebas de aceptación antes de publicación
1. Menú lateral sin barra inferior en Samsung y otros Android, con safe-area y botón Atrás.
2. Registrar dos unidades del mismo edificio con cánones y días de cobro distintos.
3. Registrar tres inquilinos principales + dos ocupantes; los ocupantes no consumen cupos adicionales.
4. Alta de inquilino ofrece crear contrato en pantalla aparte; la opción «después» conserva ficha.
5. Inquilino A paga; sale; entra inquilino B a misma unidad; el pago de A no reduce la deuda de B.
6. Subir archivo permitido, rechazar formatos y tamaños inválidos, comprobar permisos de inquilino asociado.
7. Comprobante pendiente no aumenta ingresos; aprobarlo una sola vez crea un pago; rechazar conserva deuda.
8. Email al destinatario autorizado y no a colaboradores revocados. Probar caídas de correo y reintentos.
9. Firestore + Storage niegan lectura ajena, lectura de otras unidades y escritura fuera del rol.
10. Excel distingue ingresos por fecha real, pagos aplicados al período y gastos; contratos no figuran como firmados si son borradores.
11. Probar el ciclo suscripción, cambio de plan, restauración de compra y retención del historial.
12. Pruebas de instalación, actualización sin borrar datos, exportación/recuperación, conexión intermitente y cargas concurrentes.

## 9. Estado real y entregas
**Implementado en el prototipo 2.4:** menú lateral, secciones, alta de ocupante asociado, invitación a crear contrato en paso separado, demostración de portal, comprobantes locales y aprobación local vinculada a un pago, Excel existente, roles del módulo de colaboradores beta. **No implementado en producción:** acceso verificado de inquilinos entre teléfonos, adjuntos compartidos Storage, correos automáticos, aprobación transaccional de servidor, facturación Google Play, auditoría legal final. **Pruebas:** navegación/formularios/simulación de almacenamiento en navegador. Faltan pruebas con Firebase real y APK en equipo físico.

## 10. Textos de interfaz y correos de ejemplo
**Confirmación de registro:** «Inquilino registrado correctamente. ¿Deseas crear su contrato ahora?» Botones: «Crear contrato ahora» y «Hacerlo después».

**Portal del inquilino:** «Consulta tu alquiler, historial de pagos y comprobantes». **Antes del envío:** «Sube tu comprobante para revisión. El pago no se considerará recibido hasta que la administración lo apruebe».

**Subida correcta:** «Comprobante enviado. Está pendiente de revisión». **Pago aprobado:** «Tu pago de [período] fue confirmado por la administración». **Rechazo:** «Tu comprobante necesita corrección. Motivo: [motivo]. Puedes enviar otro archivo».

**Correo a dueño y colaboradores autorizados** — Asunto: «TÚAquiler · Nuevo comprobante pendiente». Cuerpo: «Se recibió un comprobante del arrendamiento [unidad] para [período]. Ingresa a TÚAquiler con tu cuenta para revisarlo. Este mensaje no confirma que el dinero haya sido recibido». Usar un enlace autenticado, sin documentos adjuntos con datos sensibles.

**Correo al inquilino, aprobado** — Asunto: «TÚAquiler · Pago confirmado». Cuerpo: «La administración confirmó el pago correspondiente a [período]. Puedes consultar tu historial en la aplicación».

**Correo al inquilino, rechazado** — Asunto: «TÚAquiler · Revisa tu comprobante». Cuerpo: «La administración solicita corregir el comprobante de [período]. Motivo: [motivo]. Entra a TÚAquiler para enviar uno nuevo».

**Correo de invitación** — Asunto: «Invitación a colaborar en TÚAquiler». Cuerpo: «Has recibido una invitación para colaborar como [rol] en una administración. Inicia sesión con el correo destinatario verificado y acepta la invitación desde la aplicación». El código de invitación expira, es de un solo uso y no debe publicarse.

## 11. Fuentes de implementación y cumplimiento
- Firebase Security Rules: https://firebase.google.com/docs/rules/basics
- Firestore reglas por campos: https://firebase.google.com/docs/firestore/security/rules-fields
- Storage Security Rules: https://firebase.google.com/docs/storage/security
- Extensión Firebase Trigger Email: https://firebase.google.com/docs/extensions/official/firestore-send-email
- Ley de Inquilinato (PDF institucional): https://ambato-ema.gob.ec/wp-content/uploads/2024/02/LEY-DE-INQUILINATO.pdf
- Superintendencia de Protección de Datos Personales: https://www.spdp.gob.ec/docs/proteccion-de-datos-personales/general/normativa/
