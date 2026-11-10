# Privacidad y seguridad de TÚAquiler — Borrador para desarrollo

**Estado: prototipo v2.0; no es una política de privacidad definitiva.**

TÚAquiler permite guardar en el teléfono datos de inmuebles, inquilinos, contratos, ingresos y gastos. La información puede incluir nombres, cédulas/pasaportes, teléfonos, correos, direcciones y datos económicos. Los registros de negocio se guardan en el almacenamiento local de WebView, sin cifrado adicional ni sincronización en la nube. Este almacenamiento requiere reforzarse antes de uso comercial con datos sensibles.

**Modo local:** no realiza autenticación remota. **Modo con cuenta:** cuando el desarrollador configura Firebase, Firebase Authentication recibe datos de correo, credenciales o tokens de Google para autenticar al usuario. Firebase opera según sus propias condiciones y tratamiento de datos; TÚAquiler no almacena contraseñas en el WebView. Iniciar sesión no sube ni recupera automáticamente los registros económicos y personales de los usuarios: esos datos permanecen solo en el dispositivo.

Los datos se pueden exportar manualmente a archivos JSON, Excel (.xlsx) y contratos Word (.docx); esos archivos contienen información personal y deben mantenerse en un lugar seguro. El usuario puede compartir manualmente recordatorios por WhatsApp; el tratamiento posterior por WhatsApp se rige por sus condiciones.

**Pendiente antes de publicación comercial:** responsable y contacto; información al titular (finalidades, bases legales, destinatarios, conservación); mecanismos de derechos, eliminación y gestión de cuenta; seguridad de información, almacenamiento cifrado y controles de acceso; consentimiento cuando corresponda, contratos con encargados, clasificación de datos, evaluación de riesgos, política de privacidad pública y declaración de Google Play. Ajustarse a Ley Orgánica de Protección de Datos Personales de Ecuador y demás normativa aplicable.
