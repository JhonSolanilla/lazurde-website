# Lazurde Resort · Web de reservas

Web de reservas de Lazurde Resort (Omán), en español, inglés y árabe.

## Cómo se publica

1. Los cambios se suben a este repositorio (rama `main`).
2. Cloudflare los publica solo en uno o dos minutos.

No hay que instalar nada ni hacer pasos manuales.

## Qué hay en cada archivo

| Archivo | Qué contiene |
|---|---|
| `public/index.html` | Redirige la raíz del dominio a `/booking/` (más adelante: página con todos los resorts) |
| `public/booking/index.html` | La página y la animación del logo al cargar |
| `public/booking/app.js` | Pantallas, textos en los 3 idiomas, calendario, precios y reglas de habitaciones |
| `public/booking/styles.css` | Colores, tipografía y animaciones |
| `public/booking/phones.json` | Indicativos y reglas de números de todos los países (del archivo oficial de Google, libphonenumber) |
| `public/booking/img/fotos/` | Fotos del resort optimizadas (WebP, tamaño grande `-l` y mediano `-m`) |
| `public/booking/video/` | Videos del resort (MP4) y sus portadas |
| `public/booking/img/` | Logo de Lazurde (piedra y logotipo) |
| `wrangler.jsonc` | Configuración de Cloudflare |

## Precios y reglas (en `public/booking/app.js`, bloque `CONFIG`)

- Base: 3 habitaciones y 6 personas.
- Noche entre semana (sábado a miércoles): 240 OMR.
- Noche de jueves y viernes: 285 OMR. Feriado: 285 OMR.
- Cada 2 personas extra se abre 1 habitación extra: 15 OMR por noche. Máximo 14 personas y 7 habitaciones.
- Impuesto de turismo 4 % e IVA 5 %. Todos los precios de la web ya incluyen los impuestos (también los 15 OMR de la habitación extra).
- Depósito de garantía: 100 OMR al llegar, se devuelve dentro de 24 horas.

## Contacto y reservas por WhatsApp

En `CONFIG` (`public/booking/app.js`): `whatsapp` (solo números con indicativo, ej. `96891234567`), `phone` y `email`. Con `whatsapp` lleno, los botones de WhatsApp/Llamar funcionan y al tocar Reservar se abre WhatsApp con el resumen de la reserva (en inglés) para el resort.

## Servidor, base de datos y panel

- `src/worker.js`: API (`/api/*`). Precios, feriados y **cupones** viven aquí; el precio final siempre se recalcula en el servidor.
- Base de datos **D1** (binding `DB`): las tablas se crean solas la primera vez.
- Panel de administración: **/admin** (clave en el secreto `ADMIN_PASSWORD` de Cloudflare). Confirmar / rechazar / cancelar reservas, notas, bloquear fechas y enviar la confirmación por WhatsApp.
- Pruebas: `npm test` (base de datos simulada).

## Cupones de descuento

En `COUPONS` (`src/worker.js`): código y porcentaje. Se descuentan del total de la estadía (no del depósito), redondeado a 0,01 OMR. Se validan solo en el servidor.

## Fotos y videos

El orden de las fotos del carrusel de arriba (`HERO`) y de las zonas de "Conoce el resort" (`ZONES`), con sus títulos en los 3 idiomas, está al comienzo de `public/booking/app.js`.

## Pendiente

- Fotos y video, ubicación, licencia de turismo, términos y condiciones, políticas de cancelación.
- Guardar las reservas en una base de datos y avisar por correo/WhatsApp.
- Pasarela de pago.
- Conectar el dominio lazurdeom.com.

## Panel de administración (app)

- Dirección: `lazurdeom.com/admin` — se instala como app (iPhone: Compartir → Agregar a pantalla de inicio; PC: Chrome/Edge → Instalar).
- Secciones: Inicio (resumen del día y del mes), Reservas (buscador y filtros), Calendario (ver ocupación, bloquear/desbloquear días tocándolos) y Ajustes.
- Avisos: notificaciones push (Ajustes → Notificaciones → Activar) que llegan aunque la app esté cerrada, más campanita y aviso cuando la app está abierta (revisa cada 20 s).
- Las claves de las notificaciones (VAPID) se crean solas y se guardan en la base de datos. La sesión dura 30 días.
