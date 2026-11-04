# Despliegue ByGio — catálogo → ecommerce (Wompi)

Checklist para pasar la rama `back` a producción. Está pensado para ejecutarse
**de arriba a abajo, sin saltarse pasos**. Los valores reales nunca van a este
archivo ni al repositorio: van en la consola de Neon, en las Environment
Variables de Vercel o en `Api/.env.local` (no versionado).

- **Base de datos:** Neon (PostgreSQL).
- **API:** Vercel (`Api/`, Express), conectada con la cadena DIRECTA de Neon
  (sin `-pooler`). No cambiar sin medir.
- **Cliente:** Vercel (`Cliente/`, Vite + React 18).
- **Pagos:** Wompi Web Checkout + webhook.

> `sequelize.sync()` **no** corre en producción. Todo cambio de esquema se aplica
> a mano en Neon con los archivos de `Api/migrations/`. Los modelos en
> `Api/DataBase/models/` son la fuente de verdad del código.

---

## 0. Antes de tocar nada

- [ ] `git status` limpio y todo commiteado en la rama `back`.
- [ ] Rama/tag de respaldo: `git tag pre-ecommerce && git push origin pre-ecommerce`.
- [ ] **Respaldo de la base**: en Neon, *Branches → New branch* desde la rama de
      producción (es instantáneo y sirve como punto de retorno). Anota su nombre.
- [ ] Confirmar que los dos proyectos de Vercel (`Api` y `Cliente`) apuntan a la
      rama correcta y que el build del cliente pasa en local (`cd Cliente; npm run build`).
- [ ] Saber que **no hay pedidos reales** en producción hoy (sí hay usuarios,
      artículos, DTF, banners y precios: no perderlos).

---

## 1. Migraciones SQL en Neon (orden exacto)

Se ejecutan en el **SQL Editor de Neon**, una por una, en este orden:

```
001 → 002 → 003 → 004 → 005 → 006 → 007 → 008 → 009
```

De esa lista, lo nuevo de esta rama es **002 → 003 → 004 → 005 → 008 → 009**.
`001` (login social), `006` (notificaciones) y `007` (campañas Gmail) ya deberían
estar aplicadas; si no lo están, aplícalas antes en su turno.

Reglas generales:
- Cada archivo es **idempotente**: si ya estaba aplicado, no rompe nada.
- Pegar el archivo **completo**, incluyendo `BEGIN;` y `COMMIT;`.
- Después de cada uno, revisar que Neon no muestre error **antes** de seguir.

### 1.1 `001_social_auth.sql`
Solo si `usuarios.googleId` / `usuarios.facebookId` no existen ya.
**Pre-check obligatorio** (debe devolver 0 filas antes del índice único de email):

```sql
SELECT email, COUNT(*) FROM usuarios GROUP BY email HAVING COUNT(*) > 1;
```

Si devuelve filas, resolver los duplicados a mano primero.

### 1.2 `002_ecommerce_orders.sql`
Crea `order_items`, `payments`, `order_status_history`, `dtf_price_variants` y
las columnas de pedido. Verificación posterior:

```sql
SELECT table_name FROM information_schema.tables
 WHERE table_schema = 'public'
   AND table_name IN ('order_items','payments','order_status_history','dtf_price_variants');
-- Deben salir las 4.
```

### 1.3 `003_shipping_and_dtf_prices.sql`
Crea la secuencia `order_number_seq`, la tabla `shipping_rates` y carga las
tarifas de ejemplo. Verificación:

```sql
SELECT last_value FROM order_number_seq;                       -- devuelve 1
SELECT zone, label, cost FROM shipping_rates ORDER BY zone;    -- 3 filas (medellin, antioquia, nacional)
```

Revisar que las tarifas cargadas sean las reales. Si no, ajustarlas:

```sql
UPDATE shipping_rates SET cost = <valor_real> WHERE zone = 'nacional';
```

### 1.4 `004_global_prices.sql`
Precios globales, excepciones y combos. Es la más grande e idempotente.
En producción `ensurePricingSchema()` (arranque de la API) la reproduce sola,
pero **ejecutarla a mano aquí es seguro** y deja el esquema listo antes del
primer request. Verificación:

```sql
SELECT count(*) FROM price_variants;
SELECT count(*) FROM product_prices;
SELECT count(*) FROM articulos WHERE precio IS NULL;   -- artículos sin precio (debe ser 0)
```

### 1.5 `005_align_schema.sql`
Alinea la base con los modelos (incluye `payments.status = 'en_revision'`).

```sql
SELECT pg_get_constraintdef(oid) FROM pg_constraint
 WHERE conname LIKE 'payments_status%';
-- El CHECK debe aceptar 'en_revision'.
```

### 1.6 `008_ventas_manuales.sql`
`orders.userId` pasa a NULL, agrega `orders.channel` y el resto de ventas manuales.

```sql
SELECT is_nullable FROM information_schema.columns
 WHERE table_name = 'orders' AND column_name = 'userId';       -- YES
SELECT DISTINCT channel FROM orders;                            -- web / presencial / whatsapp / otro
```

### 1.7 `009_payments_wompi.sql`  ← la migración nueva de esta rama
Plazo de entrega, `paymentApprovedAt`, `statusMessage`, `failureCode`, el índice
de "un solo pago aprobado por pedido" y la limpieza de reservas heredadas.

**Pre-check obligatorio** (debe devolver 0 filas):

```sql
SELECT "orderId", count(*) FROM payments
 WHERE status = 'aprobado' GROUP BY 1 HAVING count(*) > 1;
```

Si devuelve filas, **no ejecutes el archivo**: resolver antes esos pedidos
(reembolsar el intento sobrante).

### 1.8 Verificación final del esquema

```sql
-- Columnas nuevas
SELECT table_name, column_name, data_type, is_nullable
  FROM information_schema.columns
 WHERE (table_name = 'orders'   AND column_name IN ('estimatedDeliveryDays','paymentApprovedAt'))
    OR (table_name = 'payments' AND column_name IN ('statusMessage','failureCode','providerTransactionId','wompiStatus'))
 ORDER BY table_name, column_name;   -- 6 filas

-- Índice de un solo pago aprobado
SELECT indexdef FROM pg_indexes
 WHERE tablename = 'payments' AND indexname = 'payments_one_approved_per_order';

-- Sin reservas de stock heredadas
SELECT count(*) FROM orders WHERE "stockReservedUntil" IS NOT NULL;   -- 0

-- Plazo de entrega repartido
SELECT status, count(*), min("estimatedDeliveryDays"), max("estimatedDeliveryDays")
  FROM orders GROUP BY status;

-- Un solo pago aprobado por pedido (debe estar vacío)
SELECT "orderId", count(*) FROM payments
 WHERE status = 'aprobado' GROUP BY 1 HAVING count(*) > 1;
```

Y desde el repo (compara modelos vs tablas reales):

```powershell
cd Api
node scripts/checkSchema.js
```

Debe terminar en `✅ TODOS LOS MODELOS COINCIDEN CON LAS TABLAS`.

> **Alternativa por consola** (si tienes `psql` y no quieres usar el editor):
> ```powershell
> $env:PGURL = "postgresql://<usuario>:<clave>@<host-directo-neon>/<db>?sslmode=require"
> cd Api
> psql "$env:PGURL" -v ON_ERROR_STOP=1 -f migrations/002_ecommerce_orders.sql
> psql "$env:PGURL" -v ON_ERROR_STOP=1 -f migrations/003_shipping_and_dtf_prices.sql
> psql "$env:PGURL" -v ON_ERROR_STOP=1 -f migrations/004_global_prices.sql
> psql "$env:PGURL" -v ON_ERROR_STOP=1 -f migrations/005_align_schema.sql
> psql "$env:PGURL" -v ON_ERROR_STOP=1 -f migrations/008_ventas_manuales.sql
> psql "$env:PGURL" -v ON_ERROR_STOP=1 -f migrations/009_payments_wompi.sql
> ```
> Ensayo recomendado antes: correr los mismos archivos contra un Postgres local
> (`DB_SSL=false`) o contra una **rama** de Neon.

---

## 2. Variables de entorno — Vercel, proyecto `Api`

Settings → Environment Variables → Production (y Preview si se usa).

**Infraestructura y seguridad**

| Variable | Valor |
|---|---|
| `DATABASE_URL` | cadena **directa** de Neon (sin `-pooler`), con `sslmode=require` |
| `JWT_SECRET` | secreto largo y aleatorio (nunca el `"jwtkey"` de desarrollo) |
| `FRONTEND_URL` | `https://<dominio-del-cliente>` (sin barra final) |

**Wompi (ver paso 4)**

| Variable | Valor |
|---|---|
| `WOMPI_PUBLIC_KEY` | `pub_prod_...` |
| `WOMPI_PRIVATE_KEY` | `prv_prod_...` |
| `WOMPI_INTEGRITY_SECRET` | `prod_integrity_...` |
| `WOMPI_EVENTS_SECRET` | `prod_events_...` |
| `WOMPI_ENV` | `prod` |

`WOMPI_BASE_URL` se deduce solo (`pub_prod_` → `https://production.wompi.co/v1`).
No configurarla salvo que se esté probando a propósito.

**Login social y correo**

| Variable | Valor |
|---|---|
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | credenciales de Google Cloud |
| `FACEBOOK_APP_ID` / `FACEBOOK_APP_SECRET` | credenciales de Meta |
| `GOOGLE_MAIL_CLIENT_ID` / `GOOGLE_MAIL_CLIENT_SECRET` | envío de campañas |
| `GOOGLE_MAIL_FROM` | correo remitente (`bygionay.88@gmail.com` por defecto) |

**Ajustes opcionales (tienen valores por defecto sensatos)**

| Variable | Valor sugerido | Para qué |
|---|---|---|
| `STOCK_RESERVATION_ENABLED` | `false` | reserva de stock de 30 min (apagada hasta que el stock sea por cantidad) |
| `RATE_LIMIT_ENABLED` | `true` | límites de peticiones (Fase E) |
| `TRUST_PROXY` | (vacío) | se deduce: `1` en producción, apagado en local |
| `WOMPI_EVENT_MAX_AGE_SECONDS` | `86400` | eventos más viejos se registran como `evento_antiguo` (no se descartan) |
| `DTF_PRICE_BASICO` / `DTF_PRICE_OVERSIZE` | `22000` / `32000` | precio DTF por defecto |
| `WAREHOUSE_LAT` / `WAREHOUSE_LNG` | `6.2442` / `-75.5812` | punto de despacho para calcular el envío |
| `DB_CONNECT_ATTEMPTS` | (vacío) | reintentos de conexión al despertar Neon |
| `DB_DEBUG` | **no poner** | solo para diagnóstico: expone el error real de la base en `/health` |

> Los archivos `Api/.env` y `Cliente/.env` del repositorio son **plantillas**
> (solo nombres). No poner secretos ahí: GitHub Push Protection bloquea el push.

---

## 3. Variables de entorno — Vercel, proyecto `Cliente`

Se leen en **build time**: después de cambiarlas hay que **redesplegar**.

| Variable | Valor |
|---|---|
| `VITE_API_URL` | `https://<dominio-de-la-api>` (sin barra final) |
| `VITE_NUMBER_PHONE` | WhatsApp del negocio, formato país (`5732...`) |
| `VITE_CLOUDINARY_NAME` | `ds1xggjvm` |
| `VITE_CLOUDINARY_PRESET` | preset artículos |
| `VITE_CLOUDINARY_PRESET_DTF` | preset DTF |
| `VITE_CLOUDINARY_PRESET_BANNER` | preset banners |
| `VITE_GOOGLE_CLIENT_ID` | Client ID de Google (el mismo de la API) |
| `VITE_FACEBOOK_APP_ID` | App ID de Meta |

Si `VITE_GOOGLE_CLIENT_ID` / `VITE_FACEBOOK_APP_ID` quedan vacíos, los botones
sociales se ocultan solos (no rompen la página).

---

## 4. Wompi (panel del comercio)

- [ ] Crear/entrar al comercio y completar la verificación de la cuenta.
- [ ] **Llaves de producción**: copiar `pub_prod_`, `prv_prod_`, el *Secreto de
      integridad* y el *Secreto de eventos* → cargarlos en Vercel (§2).
- [ ] **Eventos**: agregar la URL
      `https://<dominio-de-la-api>/api/payments/webhook`
      con el evento **`transaction.updated`**.
- [ ] Confirmar que la URL de redirección es la del sitio (§1 de la API ya arma
      `https://<FRONTEND_URL>/mis-pedidos/<id>?pago=wompi`; debe estar en
      dominios permitidos del comercio si Wompi lo exige).
- [ ] Métodos de pago habilitados: tarjeta, Nequi, PSE (los que el negocio acepte).

**Prueba en sandbox primero** (llaves `pub_test_` en `Api/.env.local`, no en Vercel):
Wompi no puede llamar a `localhost`, así que el webhook no llegará; el respaldo
es el botón de verificación (la página del pedido llama sola a
`POST /api/orders/:id/payment/verify` al volver). Con dominio real, el webhook
toma el relevo y ambos caminos son idempotentes entre sí.

---

## 5. Orden del despliegue

1. [ ] Migraciones en Neon (§1) y verificación final.
2. [ ] Variables de entorno de la API en Vercel (§2) y de Wompi (§4).
3. [ ] **Desplegar la API** (`Api/`). Esperar a que esté lista.
4. [ ] `GET https://<api>/` → `{"message":"ByGio API funcionando correctamente 🚀"}`.
5. [ ] `GET https://<api>/health` → `{"ok":true,"db":"up",...}`.
       Si `/` responde 200 y las `/api/*` 503, el problema es la base, no la función.
6. [ ] Variables del cliente en Vercel (§3).
7. [ ] **Desplegar el cliente** (`Cliente/`).
8. [ ] Pruebas de humo (§6).

> No desplegar el cliente antes que la API: el checkout espera endpoints
> (`/api/orders`, `/api/orders/:id/payment`) que hasta entonces devolverían 404.

---

## 6. Pruebas de humo (producción)

**API**

- [ ] `GET /` → 200 con el mensaje.
- [ ] `GET /health` → `db: "up"` y latencia razonable (Neon despierta en el primer golpe).
- [ ] `GET /api/no-existe` → `404 "Recurso no encontrado"` (string plano).
- [ ] Cabeceras presentes: `X-Content-Type-Options: nosniff`,
      `X-Frame-Options`, `Referrer-Policy`; y **no** aparece `X-Powered-By`.
- [ ] 11 intentos de login seguidos → los últimos responden `429`.

**Cuenta y catálogo**

- [ ] Registro y login devuelven cookie `access_token` (httpOnly). `GET /api/auth/me` responde el usuario.
- [ ] Login con Google y con Facebook funcionan.
- [ ] Catálogo: `/productos`, ficha de producto y DTF cargan imágenes y precios.
- [ ] Carrito persiste al recargar; checkout muestra el resumen y el envío calculado.

**Pedido y pago**

- [ ] Crear un pedido de prueba (producto barato, envío a Antioquia) → queda `pendiente_pago`.
- [ ] **Plazo correcto**: 3 días hábiles en Antioquia, 10 en el resto del país.
- [ ] DTF sin franela queda **bloqueado** en el checkout web (la franela es obligatoria);
      en el panel admin la venta manual sí lo acepta.
- [ ] "Pagar en línea" redirige a `checkout.wompi.co` con la referencia del pedido.
- [ ] Pagar con un monto mínimo real (o en sandbox) y volver al sitio:
      el pedido pasa a **pago aprobado** y el producto vuelve a estar disponible (`stock = true`).
- [ ] Log del webhook en Vercel: línea `{"scope":"wompi.webhook","resultado":"aplicado",...}`.
- [ ] Cancelar un pedido `pendiente_pago` funciona y avisa al cliente.

**Panel admin**

- [ ] Listado y filtros de pedidos; detalle con historial y pagos.
- [ ] **Confirmar pago** (transferencia/Nequi) → pago aprobado y pedido actualizado.
- [ ] **Registrar reembolso** → pedido `reembolsado` y producto disponible.
- [ ] Un usuario comprador **no** puede entrar a `/api/admin/*` (403).
- [ ] Venta manual (canal presencial/whatsapp) se registra y no exige cuenta.

**Cliente**

- [ ] 0 errores en la consola del navegador.
- [ ] Revisar en 912×670 y en ambos temas (claro/oscuro).
- [ ] Banner de cookies aparece; al **aceptar** carga el Meta Pixel (Network: `fbevents.js`);
      al **rechazar** no carga. "Preferencias de cookies" en el footer reinicia la elección.
- [ ] `/privacidad` y `/terminos` abren (con placeholders pendientes, ver §8).

---

## 7. Si algo sale mal

- **Rollback de la API/cliente**: en Vercel, *Deployments → ... → Promote to
  Production* sobre el despliegue anterior. El esquema no se revierte solo.
- **Rollback del esquema**: cada migración trae su bloque `ROLLBACK` al final
  (destructivo). Solo es seguro antes de tener pedidos reales; con pedidos,
  restaurar la **rama de respaldo de Neon** del paso 0.
- **Wompi en problemas**: borrar las llaves `WOMPI_*` de Vercel y redesplegar.
  Los endpoints de pago en línea responden `503` y el checkout sigue con el
  flujo manual (transferencia/Nequi por WhatsApp).
- **Eventos perdidos** (webhook caído): el comprador puede verificar solo al
  volver, o el admin confirmar el pago a mano en el panel.

---

## 8. Pendientes después del despliegue

Técnicos / negocio:

- [ ] Completar los placeholders `[PENDIENTE: ...]` de `/privacidad` y `/terminos`
      (NIT, dirección, correo, fechas) y hacer que los revise un abogado.
- [ ] Registrar la marca y la base de datos ante la SIC si aplica.
- [ ] Facturación electrónica DIAN (cuando haya ventas con pasarela).
- [ ] Al implementar el checkout con pasarela: actualizar `/terminos` con
      retracto/reversa (arts. 47 y 51 Ley 1480/2011, Decreto 587/2016).
- [ ] Cuando el stock pase a ser por cantidad: activar `STOCK_RESERVATION_ENABLED=true`
      (la estructura ya está lista) y revisar el detector de sobreventa.
- [ ] Monitorear los primeros pedidos: revisar el log `scope=wompi.webhook` y las
      notificaciones de "Posible sobreventa" que lleguen al panel admin.
