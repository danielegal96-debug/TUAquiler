# TÚAquiler 2.9.0 — Registro simplificado

## Flujo nuevo

1. El propietario registra el inmueble (nombre, tipo, dirección).
2. Si es casa o local individual, la app crea automáticamente «Vivienda principal» o «Local principal».
3. En «Registrar inquilino», el propietario selecciona inmueble y después una unidad disponible o «Agregar nuevo departamento»; no repite el número en dos formularios.
4. El canon y día de cobro se definen por arrendamiento, no por edificio.
5. La creación de contrato es una acción separada.

## Protección de datos

Conserva `properties` como tabla de unidades y mantiene `propertyId` en contratos y pagos; no altera registros previos.
No permite ocupar dos veces una unidad, duplicar números dentro del mismo inmueble ni exceder tres inquilinos activos sin una suscripción verificada.

## Comprobaciones antes de instalar

- APK debe mostrar `Datos locales · v2.9.0`.
- Inmueble multipropiedad: se puede pasar del inmueble directamente a la ficha del inquilino.
- En la ficha: «Departamento / unidad asignada» permite elegir uno libre o crearlo.
- Casa independiente: no solicita inventar un departamento; ofrece «Vivienda principal».

### Precaución

Aún se requiere Firebase real para cuentas, colaboración y correos; no introducir documentos bancarios sensibles en modo local.
Prueba compilación en GitHub Actions y guarda copia JSON antes de reemplazar una instalación existente.
