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
| `public/img/` | Logo de Lazurde (piedra y logotipo) |
| `wrangler.jsonc` | Configuración de Cloudflare |

## Precios y reglas (en `public/app.js`, bloque `CONFIG`)

- Base: 3 habitaciones y 6 personas.
- Noche entre semana (sábado a miércoles): 220 OMR.
- Noche de jueves y viernes: 260 OMR. Feriado: 260 OMR.
- Cada 2 personas extra se abre 1 habitación extra: 15 OMR por noche. Máximo 14 personas y 7 habitaciones.
- Impuesto de turismo 4 % e IVA 5 %.
- Depósito de garantía: 100 OMR al llegar, se devuelve dentro de 24 horas.

## Pendiente

- Fotos y video, ubicación, licencia de turismo, términos y condiciones, políticas de cancelación.
- Guardar las reservas en una base de datos y avisar por correo/WhatsApp.
- Pasarela de pago.
- Conectar el dominio lazurdeom.com.
