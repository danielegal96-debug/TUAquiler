# TÚAquiler 2.7.0 — Corrección del inicio y control de versión

## Qué corrige
- Cuando no existe ningún inmueble, **no debe aparecer el panel financiero ni un botón para registrar inquilinos**: se abre el paso «Registrar primer inmueble».
- Con inmueble pero sin unidades, se muestra el paso «Agregar primera unidad».
- Se impiden las acciones de registrar inquilino, cobro o contrato si faltan los datos previos, incluso aunque se intenten ejecutar mediante accesos antiguos.
- El menú lateral oculta las secciones que requieren una propiedad o una unidad mientras no estén registradas.
- La pantalla principal muestra **v2.7.0** junto a «Datos locales», y el inicio de sesión también muestra la versión; esto permite detectar si el APK instalado es antiguo.
- Versión de Android: `versionCode 8`, `versionName 2.7.0-registro-verificado-beta`.

## Cómo confirmar que realmente instalaste la versión nueva
1. Guarda primero respaldo JSON desde Ajustes y copia del APK anterior si tienes datos valiosos.
2. Descomprime el ZIP y sustituye en GitHub *con la misma ruta exacta* `app/src/main/assets/app.js`, `app/src/main/assets/index.html` y `app/build.gradle` (recomendado subir el contenido total del ZIP desde la raíz).
3. Abre en GitHub `app/src/main/assets/app.js`: la **primera línea** debe decir `TÚAquiler 2.7`.
4. Abre `app/build.gradle`: comprueba `versionCode 8` y `versionName '2.7.0-registro-verificado-beta'`.
5. En **Actions**, utiliza la última ejecución del commit donde aparecen esos cambios. No reutilices un APK descargado anteriormente. El ZIP de *Artifacts* se extrae y después se instala `app-debug.apk`.
6. Al abrir TÚAquiler, en pantalla de login debe aparecer **TÚAquiler v2.7.0**. En modo local debe verse **Datos locales · v2.7.0**.
7. Sin inmuebles, el primer paso debe ser «Registrar primer inmueble». Si ves «Registrar inquilino» junto a un tablero de $0 antes del primer inmueble, todavía tienes otro APK/código.

## Nota sobre inicio de sesión
«Inicio de sesión preparado» no es el error del registro: significa que Firebase Authentication aún no está configurado. En este estado solo está habilitado el modo local de prueba; Google y correo reales requieren la configuración independiente del backend.

## Seguridad y datos
No elimines la app si contiene información real sin haber confirmado que posees un respaldo JSON recuperable. La app es beta; no debe utilizarse como repositorio seguro de cédulas, contratos y comprobantes sensibles hasta completar Firebase, reglas de acceso, pruebas y política de privacidad.
