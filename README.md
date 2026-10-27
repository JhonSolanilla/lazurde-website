# Lazurde Resort · Web de reservas

Web de reservas de Lazurde Resort (Omán), en español, inglés y árabe.

## Cómo se publica

1. Los cambios se suben a este repositorio (rama `main`).
2. Cloudflare los publica solo en uno o dos minutos.

No hay que instalar nada ni hacer pasos manuales.

## Qué hay en cada archivo

| Archivo | Qué contiene |
|---|---|
| `public/index.html` | La página y la animación del logo al cargar |
| `public/app.js` | Pantallas, textos en los 3 idiomas, calendario, precios y reglas de habitaciones |
| `public/styles.css` | Colores, tipografía y animaciones |
| `public/phones.json` | Indicativos y reglas de números de todos los países (del archivo oficial de Google, libphonenumber) |
| `public/img/fotos/` | Fotos del resort optimizadas (WebP, tamaño grande `-l` y mediano `-m`) |
| `public/video/` | Videos del resort (MP4) y sus portadas |
| `public/img/` | Logo de Lazurde (piedra y logotipo) |
| `wrangler.jsonc` | Configuración de Cloudflare |

## Precios y reglas (en `public/app.js`, bloque `CONFIG`)

- Base: 3 habitaciones y 6 personas.
- Noche entre semana (sábado a miércoles): 240 OMR.
- Noche de jueves y viernes: 285 OMR. Feriado: 285 OMR.
- Cada 2 personas extra se abre 1 habitación extra: 15 OMR por noche. Máximo 14 personas y 7 habitaciones.
- Impuesto de turismo 4 % e IVA 5 %. Todos los precios de la web ya incluyen los impuestos (también los 15 OMR de la habitación extra).
- Depósito de garantía: 100 OMR al llegar, se devuelve dentro de 24 horas.

## Fotos y videos

El orden de las fotos del carrusel de arriba (`HERO`) y de las zonas de "Conoce el resort" (`ZONES`), con sus títulos en los 3 idiomas, está al comienzo de `public/app.js`.

## Pendiente

- Fotos y video, ubicación, licencia de turismo, términos y condiciones, políticas de cancelación.
- Guardar las reservas en una base de datos y avisar por correo/WhatsApp.
- Pasarela de pago.
- Conectar el dominio lazurdeom.com.
