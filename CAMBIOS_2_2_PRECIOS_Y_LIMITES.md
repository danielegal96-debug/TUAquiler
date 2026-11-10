# TÚAquiler 2.2 — Monetización propuesta (versión de pruebas)

## Estructura comercial
- Gratis sin tarjeta: hasta **3 inquilinos activos**. Los inquilinos antiguos/archivados no consumen cupo, ni las propiedades vacías.
- Pro mensual: **USD 3 cada mes**, inquilinos activos ilimitados.
- Pro anual: **USD 20 cada 12 meses**, inquilinos activos ilimitados. Ahorro USD 16 (44,4 %) frente a USD 36 por 12 pagos mensuales.
- Ambas versiones ofrecen pagos, gastos, exportación Excel, contratos Word y respaldos locales. No se venden funciones simuladas.
- No se aplican límites de acceso a pagos e historial al finalizar una suscripción, aunque se excedan los 3 cupos gratuitos. Solo se restringe incorporar más inquilinos activos.
- Cambiar un inquilino por otro en un mismo departamento no debe consumir un cupo adicional si el anterior se archiva.

## Lo que ya contiene el código
- Pantalla de planes, comparador mensual/anual y aviso de ahorro real sin urgencia ficticia.
- Contador de cupos en inmuebles y ajustes; aviso discreto desde 2 activos.
- Control de alta: evita superar 3 activos gratis, permite editar y sustituir; no borra registros antiguos.
- Demostración con 3 inquilinos activos, manteniendo compatibilidad de respaldos antiguos.

## Pendiente imprescindible para cobrar
El pago **NO está habilitado** en este APK. Los botones de compra están desactivados intencionadamente: no hay un pago real, ni una suscripción activada.

Para publicar y cobrar:
1. Crear cuenta de desarrollador Google Play y configurar productos de suscripción (un producto Pro con dos planes base, mensual y anual). Confirmar países/monedas/precios reales y renovación automática.
2. Integrar Google Play Billing Library 9 o una versión vigente, recuperación de compras y gestión de cambios de plan/cancelaciones.
3. Verificar los tokens de compra **en un backend confiable** con Google Play Developer API; tratar expiración, cancelación, gracia, reembolsos y renovaciones. Nunca confiar en un simple `isPro=true` guardado en el teléfono.
4. Sustituir `premiumVerified()` por consulta a derechos verificados. Habilitar la compra solo cuando todo esté probado en la pista interna de Play Console.
5. Publicar términos de suscripción claros, frecuencia de renovación, cancelación, política de privacidad y precio conforme al checkout; no usar promociones de tiempo limitado sin fechas reales.
6. Actualizar diseño y comunicar que Pro no incluye colaboradores multiusuario: esa es otra función que exigiría backend y permisos.

**Seguridad:** no subas `google-services.json`, tokens ni credenciales privadas a un repositorio público. Los datos actuales son locales; no hay sincronización en la nube.

## Actualizar GitHub
Extraer el ZIP en la raíz del repositorio existente, mantener las rutas de `app/` y `.github/workflows/`. No borrar archivos previos, realizar respaldo JSON antes de instalar. Verificar Actions. Un APK de prueba no es la versión de producción con facturación habilitada.
