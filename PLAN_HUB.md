# Plan: Hub de Chamillion

## Contexto

El Hub es la plataforma premium de chamillion.site. Actualmente `/hub` es un placeholder "En construccion" con 4 feature cards. El objetivo es convertirlo en un area completa con 5 modulos: cartera ampliada, herramientas premium, cartera del usuario, software/bots, y consultorias.

**Stack actual:** Next.js 15 (App Router) + React 19 + Supabase (auth, DB, RLS) + Stripe (subscriptions) + CSS Modules + Vercel.

**Lo que ya existe y se reutiliza:**
- Auth magic link con roles `free | member | admin` → [lib/supabase/auth.ts](lib/supabase/auth.ts)
- Portfolio tracking completo: positions, platforms, strategies, snapshots, capital_flows → [lib/supabase/types.ts](lib/supabase/types.ts)
- Sync engine con adapters (Hyperliquid, Polymarket, DeFi Wallet) → [lib/sync/engine.ts](lib/sync/engine.ts)
- Admin dashboard con CRUD completo → [app/admin/](app/admin/)
- Widget system (vanilla HTML/JS/CSS en `/public/widgets/`) → [components/iframe-widget.tsx](components/iframe-widget.tsx)
- Stripe checkout + webhook + portal → [app/api/stripe/](app/api/stripe/)
- Paywall gate + premium badge → [components/paywall-gate.tsx](components/paywall-gate.tsx)
- `requireMember()` ya implementado → [lib/supabase/auth.ts](lib/supabase/auth.ts)
- Middleware ya protege `/hub` → [middleware.ts](middleware.ts)

**Directriz de UI:** Para toda creacion de UI nueva, usar siempre el comando `/impeccable` (skill de design taste).

**Lo que NO existe y hay que crear:**
- Email transaccional (Resend) — solo hay Supabase native emails
- Supabase Realtime — zero uso actual
- Supabase Storage — no hay buckets configurados
- Booking/calendario — nada
- User-scoped portfolio data — solo existe el de chamillion

---

## Fase 0: Infraestructura

Antes de cualquier modulo, 3 piezas de infraestructura.

### 0.1 Servicio de email (Resend)

Necesario para: digests de operaciones, confirmaciones de consultorias, notificaciones.

1. `npm install resend`
2. Crear `lib/email.ts` — cliente lazy-init (patron identico a `lib/stripe.ts`)
3. Env var: `RESEND_API_KEY`
4. Configurar DNS de chamillion.site: SPF + DKIM (records que da Resend)
5. Sender: `hola@chamillion.site` / nombre "Chamillion" (ya pendiente en `prompts_pendientes.md`)

### 0.2 Reestructura de rutas del Hub

El Hub actual vive en `app/(home)/hub/` (comparte layout de home). Moverlo a estructura propia:

```
app/hub/
├── layout.tsx          ← Hub shell: sidebar, nav, member gate via requireMember()
├── layout.module.css
├── page.tsx            ← Dashboard/overview del Hub
├── cartera/            ← Modulo 1
├── herramientas/       ← Modulo 2
├── mi-cartera/         ← Modulo 3
├── software/           ← Modulo 4
└── consultorias/       ← Modulo 5
```

- `layout.tsx`: Server Component con `requireMember()` → redirect a `/suscribirse` si free
- Shell visual: sidebar con links a los 5 modulos, header con UserMenu + ThemeToggle + breadcrumbs
- CSS Modules para todo (no Tailwind)

### 0.3 Middleware

`/hub` ya esta protegido en `middleware.ts`. Si alguna sub-ruta necesita ser publica (ej: preview de cartera), anadir excepcion.

### 0.4 Landing page del Hub para visitantes no autenticados

Actualmente `/hub` redirige a `/login` si no hay sesion. Pero el link al Hub esta en el menu de la landing page, asi que visitantes sin cuenta lo clicaran. En vez de redirigir, mostrar una pagina publica atractiva que:
- Explique que es el Hub (trailer/snippet)
- Muestre los 5 modulos con descripciones
- CTA para suscribirse o iniciar sesion
- Usar `/impeccable` para el diseno

**Implementacion:** Cambiar `layout.tsx` del Hub para NO redirigir si no hay sesion. En su lugar, detectar el estado de auth y renderizar la landing publica o el shell con sidebar segun corresponda.

---

## Modulo 1: Cartera Ampliada

**Objetivo:** Vision expandida de la cartera de chamillion — posiciones detalladas, historial de operaciones, analiticas avanzadas, feed en tiempo real, y digest por email.

### 1.1 Features

| Feature | Descripcion |
|---------|------------|
| Dashboard completo | Posiciones con entry date, cost basis, valor actual, PnL, ROI |
| Breakdown por estrategia | Agrupado por strategy con metricas agregadas |
| Breakdown por plataforma | Allocation % por platform |
| Grafico historico | Chart de rendimiento usando snapshots (15-min granularidad) |
| Feed de operaciones | Log cronologico de trades/movimientos, actualizado en tiempo real |
| Filtros | Por plataforma, estrategia, rango de fechas |
| Analiticas | Drawdown, best/worst days, win rate, capital efficiency |
| Daily digest | Email opt-in con resumen de operaciones del dia |

### 1.2 Base de datos

**Enfoque API-based (no diff-based):** Consultar directamente las APIs de historial de trades de cada plataforma. El enfoque diff (comparar snapshots) es demasiado lossy: pierde trades intermedios, no distingue apreciacion de precio vs trade, no captura fees ni precios exactos.

**Nueva tabla `trades`:**
```sql
CREATE TABLE trades (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  platform_id     uuid REFERENCES platforms(id),
  asset           text NOT NULL,
  side            text NOT NULL,       -- 'buy'|'sell'|'open_long'|'open_short'|'close_long'|'close_short'
  quantity        numeric NOT NULL,
  price           numeric NOT NULL,    -- precio por unidad en USD
  total_value     numeric NOT NULL,    -- quantity * price
  total_value_eur numeric,             -- convertido a EUR al rate del momento
  fee             numeric,             -- fee de la plataforma
  trade_id        text,                -- ID unico de la plataforma (para deduplicacion)
  executed_at     timestamptz NOT NULL,
  synced_at       timestamptz NOT NULL DEFAULT now()
);
-- RLS: SELECT para authenticated (members ven los trades de chamillion)
-- INSERT solo service-role (sync engine)
-- Index: (platform_id, executed_at), UNIQUE (platform_id, trade_id) para dedup
-- Habilitar Realtime en esta tabla
```

**Nueva vista `trades_enriched`:** join con platforms.name.

**Nueva tabla `email_preferences`:**
```sql
CREATE TABLE email_preferences (
  user_id      uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  daily_digest boolean DEFAULT false,
  digest_hour  int DEFAULT 8,  -- hora UTC
  updated_at   timestamptz DEFAULT now()
);
-- RLS: cada user solo lee/escribe su propio row
```

### 1.3 Trade fetchers por plataforma

Nuevos fetchers independientes del sync engine (no modifican posiciones, solo capturan historial):

**Hyperliquid** — `lib/sync/trades/hyperliquid.ts`
- API: POST `/info` con `userFillsByTime` — devuelve fills con timestamp, precio, lado, fees
- Paginacion por timestamp: guardar `last_synced_at`, pedir fills desde esa fecha
- Deduplicacion via `trade_id` (HL devuelve ID unico por fill)

**Polymarket** — `lib/sync/trades/polymarket.ts`
- API: GET `/trades?user={wallet}` — records individuales con timestamp, precio, size
- Similar paginacion por timestamp

**On-chain (DEX swaps)** — `lib/sync/trades/onchain.ts`
- API: Moralis `getWalletTokenTransfers` (API key ya disponible) o Etherscan `tokentx`
- Logica de deteccion de swaps:
  1. Fetch ERC20 transfers de la wallet
  2. Agrupar por `transactionHash`
  3. Dentro del mismo tx: token OUT + token IN = swap detectado
  4. Registrar como trade: sell token A / buy token B, con cantidades y precio implicito
- Deduplicacion via `trade_id` = `txHash:logIndex`
- Multi-chain: iterar por las chains configuradas (ETH, Arbitrum, Polygon, Base, etc.)
- Edge cases manejados:
  - Multi-hop swaps (USDC→WETH→UNI): solo se ven los extremos (USDC out, UNI in) — correcto
  - Wrapping ETH→WETH: filtrar como no-trade
  - Bridges cross-chain: detectables como transfer OUT sin transfer IN en la misma chain — marcar como `bridge` o ignorar
  - Simple transfers (envios entre wallets propias): un solo token se mueve sin contrapartida — no es swap, ignorar

**Ruta de sync:** `app/api/sync/trades/route.ts` — ejecuta los trade fetchers, inserta en `trades` con dedup.

### 1.4 API routes

- `app/api/sync/trades/route.ts` — Fetch de historial de trades (bearer auth con SYNC_SECRET, igual que sync actual)
- `app/api/cron/daily-digest/route.ts` — Cron diario, protegido con `CRON_SECRET`, envia digest via Resend
- Datos de trades via Supabase client directo para el frontend

### 1.5 Componentes

- `app/hub/cartera/page.tsx` — Server Component, fetch de datos
- `app/hub/cartera/cartera-client.tsx` — Client Component interactivo
- `app/hub/cartera/trades-feed.tsx` — Feed de trades con Supabase Realtime (`supabase.channel()`)
- `app/hub/cartera/performance-chart.tsx` — Chart historico (reutilizar/expandir snapshot-chart del admin)
- `app/hub/cartera/strategy-breakdown.tsx` — Vista agrupada
- `app/hub/cartera/digest-toggle.tsx` — Opt-in/out de email
- Usar `/impeccable` para todo el UI

### 1.6 Dificultades tecnicas

| Dificultad | Detalle | Mitigacion |
|-----------|---------|-----------|
| APIs de historial | Cada plataforma tiene formato distinto | Un trade fetcher por plataforma, normalizan al mismo schema `trades` |
| Deduplicacion | Los syncs repetidos no deben duplicar trades | UNIQUE constraint en `(platform_id, trade_id)` + ON CONFLICT DO NOTHING |
| Paginacion | Historial largo en la primera carga | Primera carga: fetch completo (puede tardar). Siguientes: solo desde `last_synced_at` |
| Swaps on-chain | Interpretar ERC20 transfers como swaps | Agrupar por txHash: token OUT + token IN en mismo tx = swap. Moralis ya integrado |
| Charts financieros | No hay libreria de charts | Opcion A: SVG custom. Opcion B: `lightweight-charts` (TradingView OSS, 40KB). Recomendacion: lightweight-charts |
| Realtime limits | Supabase Free: 200 conexiones simultaneas | Suficiente para comunidad premium pequena |

### 1.7 Orden de construccion

1. Crear tabla `trades` + RLS + Realtime + index de dedup
2. Crear trade fetcher para Hyperliquid (`userFillsByTime`)
3. Crear trade fetcher para Polymarket (`/trades`)
4. Crear trade fetcher para on-chain swaps (Moralis `getWalletTokenTransfers` + agrupacion por txHash)
5. Crear ruta `app/api/sync/trades/route.ts`
6. Crear vista `trades_enriched`
7. Pagina de cartera con datos estaticos (positions, snapshots, strategies)
8. Anadir feed de trades con Realtime
9. Email preferences + daily digest cron

---

## Modulo 2: Herramientas Premium

**Objetivo:** Convertir la pagina `/widgets` existente en un sistema con widgets free y premium. Admin puede marcar widgets como premium directamente desde la UI.

### 2.1 Implementacion — Premium widgets en la pagina existente

**Enfoque:** No crear pagina separada en `/hub/herramientas`. En vez de eso, enriquecer la pagina `/widgets` existente:

**Persistencia del flag premium:**
- Usar tabla `site_settings` existente (JSONB) con key `premium_widgets`
- Valor: array de slugs (ej: `["compound-interest", "daily-compounder"]`)
- Sin migracion, sin tabla nueva — `site_settings` ya existe y acepta cualquier key

**Cambios en `app/widgets/page.tsx`:**
- Convertir de component puro a Server Component que fetch:
  1. `premium_widgets` desde `site_settings`
  2. User role (via `getOptionalUser()`) — para saber si es admin, member, o free/anonimo
- Pasar `premiumSlugs`, `userRole` como props a `WidgetsClient`

**Cambios en `app/widgets/widgets-client.tsx`:**
- Recibir `premiumSlugs: string[]` y `userRole: "free" | "member" | "admin" | null`
- **Modo edicion (solo admin):** Boton toggle "Editar". En modo edicion, cada card muestra un toggle para marcar/desmarcar como premium. Los cambios se guardan via server action en `site_settings`.
- **Widgets premium para no-members:** Se ven en la galeria pero con overlay/lock. No se pueden abrir (el `<a>` se desactiva). Mensaje "Suscribete para acceder".
- **Widgets premium para members/admin:** Funcionan normal, con badge "Premium".

**Server action para guardar:**
- `app/widgets/actions.ts` — `toggleWidgetPremium(slug)`: lee `premium_widgets` de `site_settings`, toggle el slug, guarda. Requiere `requireAdmin()`.

**Archivos a modificar:**
- `app/widgets/page.tsx` — fetch premium slugs + user role
- `app/widgets/widgets-client.tsx` — admin edit mode, premium lock, premium badge
- `app/widgets/page.module.css` — estilos para premium lock, edit toggle, admin controls
- `app/widgets/actions.ts` — nuevo: server action para toggle premium

**No se necesita:**
- No nueva tabla ni migracion
- No pagina separada en `/hub/herramientas` (los widgets premium viven en `/widgets`, accesibles para todos pero gated)
- No mover widgets a directorio separado

### 2.2 Orden de construccion

1. Convertir `page.tsx` a Server Component con fetch de premium slugs + user role
2. Crear `actions.ts` con server action `toggleWidgetPremium`
3. Modificar `widgets-client.tsx`: props nuevas, admin edit mode, premium lock
4. Estilos CSS para premium lock overlay, edit toggle, admin badge

### 2.6 Kronos — Prediccion de velas

**Contexto:** Endpoint ya desplegado en Modal. Acepta OHLCV, devuelve forecast. Falta la UI.

**Flujo del usuario:**
1. Se presenta chart de BTCUSDT por defecto (velas 1h)
2. Selector de activo (catalogo amplio) + selector de timeframe
3. Al pulsar "Predecir", se envian las velas historicas al endpoint de Kronos
4. La prediccion se renderiza animadamente en el chart, diferenciada visualmente

**Fuente de datos OHLCV: Binance Public API**
- Endpoint: `https://data-api.binance.vision/api/v3/klines?symbol={PAIR}&interval={TF}&limit=512`
- Sin API key, sin auth, 1000 velas/request, 1200 req/min
- Timeframes: 1m, 5m, 15m, 30m, 1h, 2h, 4h, 6h, 8h, 12h, 1d, 3d, 1w
- Para el catalogo de pares: `GET /api/v3/exchangeInfo` (filtrar USDT pairs activos)

**Endpoint Kronos:**
- URL: `https://chamillionn--kronos-predictor-kronosservice-api.modal.run`
- POST body: `{ "ohlcv": { "columns": ["open","high","low","close"], "data": [[o,h,l,c],...], "timestamps": ["ISO",...] }, "prediction_length": 24 }`
- Respuesta: mismo formato con las velas predichas
- Script de deploy: `scripts/kronos_modal.py`
- Modelo: Kronos-small (GPU T4, scaledown 300s)

**Chart: lightweight-charts (TradingView OSS)**
- `npm install lightweight-charts` (~40KB)
- Candlestick series para historicas
- Segunda series (distinto color/opacidad) para prediccion
- Animacion: las velas predichas aparecen una a una con delay

**Archivos a crear:**
- `app/hub/herramientas/kronos/page.tsx` — Server Component (metadata)
- `app/hub/herramientas/kronos/kronos-client.tsx` — Client Component (chart + selectores + fetch)
- `app/hub/herramientas/kronos/kronos.module.css` — Estilos
- `lib/kronos.ts` — Helper para llamar al endpoint de Kronos
- `lib/binance.ts` — Helper para fetch de velas + lista de pares

**Timeframes ofrecidos al usuario:**
Solo los que tengan sentido para prediccion: 1h, 4h, 1d (los sub-horarios son demasiado ruidosos para el modelo)

**Catalogo de activos:**
Fetch dinamico desde Binance `exchangeInfo`, filtrar pares USDT con status TRADING. Cache en memoria (no cambia a menudo). Mostrar los ~20 mas populares como "favoritos" y el resto en un buscador.

**Orden de construccion:**
1. `npm install lightweight-charts`
2. Crear `lib/binance.ts` — fetch klines + fetch pairs
3. Crear `lib/kronos.ts` — POST al endpoint de Modal
4. Crear pagina `/hub/herramientas/kronos/` con chart + selectores
5. Implementar animacion de prediccion
6. Usar `/impeccable` para todo el UI

---

## Modulo 3: Mi Cartera

**Objetivo:** Los usuarios crean su propia cartera usando el framework analitico de chamillion. Conectan sus plataformas/wallets y ven sus resultados con las mismas metricas.

### 3.1 Features

| Feature | Descripcion |
|---------|------------|
| CRUD de posiciones | Anadir/editar posiciones manualmente (version simplificada del admin) |
| Conexion de plataformas | Anadir wallet addresses para Hyperliquid, Polymarket, etc. |
| Sync del usuario | Mismo patron de adapters pero scoped a datos del user |
| Dashboard analitico | Misma lente que Modulo 1 pero con datos propios |
| Template de chamillion | "Clonar" setup de estrategias/plataformas como punto de partida |

### 3.2 Base de datos

**`user_platforms`:**
```sql
CREATE TABLE user_platforms (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  platform_id     uuid REFERENCES platforms(id),  -- link a la lista maestra
  wallet_address  text,
  label           text,
  created_at      timestamptz DEFAULT now()
);
-- RLS: CRUD solo para el propio user_id = auth.uid()
```

**`user_positions`:**
```sql
CREATE TABLE user_positions (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  asset            text NOT NULL,
  size             numeric NOT NULL,
  cost_basis       numeric NOT NULL,
  current_value    numeric NOT NULL,
  user_platform_id uuid REFERENCES user_platforms(id),
  strategy_id      uuid REFERENCES strategies(id),  -- reutiliza strategies maestras
  notes            text,
  is_active        boolean DEFAULT true,
  opened_at        timestamptz DEFAULT now(),
  closed_at        timestamptz
);
-- RLS: CRUD solo para el propio user_id = auth.uid()
```

**`user_snapshots`:**
```sql
CREATE TABLE user_snapshots (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  snapshot_date   timestamptz NOT NULL,
  total_value     numeric NOT NULL,
  total_cost      numeric NOT NULL,
  positions_data  jsonb,
  created_at      timestamptz DEFAULT now()
);
-- RLS: SELECT solo para el propio user_id
```

**Vistas:** `user_positions_enriched` y `user_portfolio_summary` (scoped por `auth.uid()`).

### 3.3 Refactor del sync engine

El sync engine actual (`lib/sync/engine.ts`) esta acoplado a los datos globales de chamillion (lee `platforms.wallet_address` de la tabla global). Hay que desacoplarlo:

- Abstraer el engine para aceptar un "target config": wallet address + tabla destino
- Crear `lib/sync/user-engine.ts` que use `user_platforms` como source y `user_positions` como destino
- Los adapters (`lib/sync/adapters/`) no cambian — ya reciben wallet address como parametro

**Dificultad tecnica: ALTA.** Este es el refactor mas complejo de todo el Hub.

### 3.4 API routes

- `app/api/user-sync/route.ts` — POST: trigger sync para el usuario autenticado. Requiere `requireMember()`. Rate limit: 1 sync por plataforma cada 15 minutos por usuario (guardar timestamp del ultimo sync en `user_platforms`).
- `app/api/user-sync/[platform]/route.ts` — Sync de una plataforma individual.

### 3.5 Componentes

- `app/hub/mi-cartera/page.tsx` — Dashboard overview
- `app/hub/mi-cartera/posiciones/` — CRUD de posiciones (reutilizar patrones del admin)
- `app/hub/mi-cartera/plataformas/` — Gestion de plataformas conectadas
- `app/hub/mi-cartera/sync-button.tsx` — Trigger de sync manual
- `app/hub/mi-cartera/analytics.tsx` — Charts de rendimiento (reutilizar componentes de Modulo 1)

### 3.6 Dificultades tecnicas

| Dificultad | Detalle | Mitigacion |
|-----------|---------|-----------|
| Sync engine refactor | Acoplado a datos globales | Abstraer target config, crear user-engine wrapper |
| Rate limits de APIs externas | Cada user sync golpea Hyperliquid/Polymarket | Solo sync manual, cooldown de 15 min, mostrar ultimo sync timestamp |
| RLS correcta | Cada query debe scoped a `auth.uid()` | Supabase client con RLS lo maneja si policies son correctas. Tests exhaustivos |
| Escalabilidad | Multiples users sincronizando simultaneamente | Vercel serverless escala por defecto. Limitar concurrencia via rate limit |

### 3.7 Orden de construccion

1. Crear tablas `user_platforms`, `user_positions`, `user_snapshots` + RLS
2. CRUD manual de posiciones (sin sync inicialmente)
3. Dashboard de portfolio del usuario con analiticas
4. Refactorizar sync engine para soporte user-scoped
5. UI de conexion de plataformas + trigger de sync
6. Captura de snapshots del usuario (despues de cada sync)

---

## Modulo 4: Software & Bots

**Objetivo:** Catalogo de descargas de herramientas, bots y estrategias. Versionado, release notes, tracking.

### 4.1 Features

- Catalogo con cards: nombre, descripcion, categoria, icono
- Pagina de detalle por software con historial de versiones y release notes
- Descarga via signed URL (Supabase Storage)
- Tracking de descargas
- Admin CRUD para gestionar software y subir archivos

### 4.2 Base de datos

**`software`:**
```sql
CREATE TABLE software (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug        text UNIQUE NOT NULL,
  name        text NOT NULL,
  description text,
  category    text,  -- 'bot'|'tool'|'strategy'|'template'
  icon_path   text,
  is_active   boolean DEFAULT true,
  created_at  timestamptz DEFAULT now()
);
-- RLS: SELECT para members/admin (join con profiles.role)
```

**`software_versions`:**
```sql
CREATE TABLE software_versions (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  software_id   uuid NOT NULL REFERENCES software(id) ON DELETE CASCADE,
  version       text NOT NULL,
  release_notes text,
  file_path     text NOT NULL,  -- path en Supabase Storage
  file_size     bigint,
  is_latest     boolean DEFAULT false,
  released_at   timestamptz DEFAULT now()
);
-- RLS: misma que software
```

**`downloads`:**
```sql
CREATE TABLE downloads (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES auth.users(id),
  version_id uuid NOT NULL REFERENCES software_versions(id),
  created_at timestamptz DEFAULT now()
);
-- RLS: INSERT propio, SELECT admin
```

### 4.3 Supabase Storage

Primera vez que se usa Storage en el proyecto:
- Crear bucket `software-releases` (privado, no publico)
- Politica: solo service role puede generar signed URLs
- Admin sube archivos via Supabase Storage JS client

### 4.4 API routes

- `app/api/software/download/route.ts` — POST con `version_id`. Verifica membership, registra descarga en `downloads`, devuelve signed URL (expira en 60s). Esto previene hotlinking.

### 4.5 Admin extension

- `app/admin/software/` — CRUD de software items + upload de versiones a Storage. Seguir patrones existentes del admin dashboard.

### 4.6 Componentes

- `app/hub/software/page.tsx` — Catalogo grid
- `app/hub/software/[slug]/page.tsx` — Detalle con version history + boton de descarga
- `app/hub/software/download-button.tsx` — Llama al API, muestra progreso

### 4.7 Dificultades tecnicas

| Dificultad | Detalle | Mitigacion |
|-----------|---------|-----------|
| Supabase Storage | Primera vez en el proyecto | Setup sencillo: un bucket, policies basicas, signed URLs |
| Limite de Vercel | 4.5MB response limit | Signed URL delega descarga a Supabase CDN (sin limite) |
| Upload admin | Form de subida de archivos | Supabase Storage JS client directo desde admin page |

### 4.8 Orden de construccion

1. Configurar Supabase Storage bucket + policies
2. Crear tablas `software`, `software_versions`, `downloads` + RLS
3. Admin CRUD de software (siguiendo patrones existentes)
4. Pagina de catalogo en Hub
5. Flujo de descarga con signed URLs
6. Tracking de descargas

---

## Modulo 5: Consultorias

**Objetivo:** Sistema de reserva de sesiones 1:1 con chamillion. Calendario, pago, confirmaciones.

### 5.1 Features

| Feature | Descripcion |
|---------|------------|
| Tipos de sesion | Diferentes duraciones/precios (30min, 60min, etc.) |
| Calendario | Selector de fecha/hora con slots disponibles |
| Pago por sesion | Stripe Checkout en modo `payment` (one-time) |
| Confirmaciones | Email via Resend a ambas partes |
| Historial | El usuario ve sus sesiones pasadas/futuras |
| Admin panel | Gestionar disponibilidad, ver sesiones, notas |

### 5.2 Base de datos

**`consultation_types`:**
```sql
CREATE TABLE consultation_types (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name            text NOT NULL,
  description     text,
  duration        int NOT NULL,  -- minutos
  price_eur       numeric NOT NULL,
  stripe_price_id text,  -- Stripe Price ID (one-time)
  is_active       boolean DEFAULT true,
  created_at      timestamptz DEFAULT now()
);
-- RLS: SELECT para authenticated, writes solo admin
```

**`availability_slots`:**
```sql
CREATE TABLE availability_slots (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  day_of_week   int,           -- 0=Dom..6=Sab (null para fechas especificas)
  specific_date date,          -- override para dia concreto
  start_time    time NOT NULL,
  end_time      time NOT NULL,
  is_blocked    boolean DEFAULT false,  -- true = no disponible
  created_at    timestamptz DEFAULT now()
);
-- RLS: SELECT para authenticated, writes solo admin
```

**`consultations`:**
```sql
CREATE TABLE consultations (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid NOT NULL REFERENCES auth.users(id),
  type_id           uuid NOT NULL REFERENCES consultation_types(id),
  scheduled_at      timestamptz NOT NULL,
  duration          int NOT NULL,
  status            text DEFAULT 'pending',  -- 'pending'|'confirmed'|'completed'|'canceled'
  stripe_payment_id text,
  stripe_session_id text,
  notes_user        text,
  notes_admin       text,
  created_at        timestamptz DEFAULT now()
);
-- RLS: SELECT propio para users, SELECT/UPDATE all para admin
```

**Funcion anti-doble-reserva:**
```sql
CREATE FUNCTION check_slot_available(p_scheduled_at timestamptz, p_duration int)
RETURNS boolean AS $$
  SELECT NOT EXISTS (
    SELECT 1 FROM consultations
    WHERE status IN ('pending', 'confirmed')
    AND tstzrange(scheduled_at, scheduled_at + (duration || ' minutes')::interval)
    && tstzrange(p_scheduled_at, p_scheduled_at + (p_duration || ' minutes')::interval)
  );
$$ LANGUAGE sql SECURITY DEFINER;
```

### 5.3 Cambios en Stripe

El webhook actual (`app/api/stripe/webhook/route.ts`) maneja solo subscriptions. Hay que extenderlo:

- En `checkout.session.completed`: diferenciar `mode === 'subscription'` (existente) vs `mode === 'payment'` (consultorias)
- Para `mode === 'payment'`: leer `metadata.consultation_id`, actualizar consultation.status a `confirmed`, enviar email de confirmacion
- Crear Stripe Prices one-time por cada tipo de consulta

### 5.4 API routes

- `app/api/consultations/checkout/route.ts` — POST: crea Checkout session en modo `payment`, valida disponibilidad del slot, crea row en `consultations` con status `pending`, incluye `metadata: { type: 'consultation', consultation_id }`
- `app/api/consultations/available-slots/route.ts` — GET: devuelve slots disponibles para un rango de fechas (calcula desde `availability_slots` menos `consultations` confirmadas/pendientes)

### 5.5 Componentes

- `app/hub/consultorias/page.tsx` — Tipos de sesion + calendario
- `app/hub/consultorias/calendar-picker.tsx` — Selector de fecha/hora con slots clickables
- `app/hub/consultorias/mis-sesiones.tsx` — Historial de reservas del usuario
- `app/admin/consultorias/` — Gestion de disponibilidad + lista de sesiones + notas

### 5.6 Dificultades tecnicas

| Dificultad | Detalle | Mitigacion |
|-----------|---------|-----------|
| Calendar UX | Construir date/time picker desde cero es complejo | Enfoque simple: lista de fechas con slots disponibles como botones clickables. Sin drag-and-drop, sin calendario completo. Puro CSS Modules |
| Timezones | Admin en Madrid (CET), users en cualquier zona | Todo en UTC en DB. Mostrar en timezone local del user via `Intl.DateTimeFormat`. Admin introduce en su timezone, convertir a UTC |
| Doble reserva | Race condition si dos users reservan el mismo slot | Constraint server-side con funcion `SECURITY DEFINER`. Verificar en el API route ANTES de crear Checkout session |
| Integracion calendario externo | No hay Google Calendar / Cal.com | Mantener simple: admin gestiona via panel propio. Futuro: generar `.ics` para invitaciones |

### 5.7 Orden de construccion

1. Crear tablas + funcion anti-doble-reserva + RLS
2. Admin: CRUD de tipos de consulta
3. Admin: gestion de disponibilidad
4. Pagina de reserva con selector de slots
5. Integracion Stripe payment mode
6. Extender webhook para confirmaciones
7. Emails de confirmacion via Resend
8. Historial de sesiones del usuario

---

## Orden global de construccion

```
Fase 0 — Infraestructura                        ██░░░░░░░░
  0.1 Resend email
  0.2 Hub layout + route restructure
  0.3 Middleware adjustments

Fase 1 — Cartera Ampliada (Modulo 1)             ████░░░░░░
  Maximo valor inmediato, establece patrones UI

Fase 2 — Herramientas Premium (Modulo 2)          █░░░░░░░░░
  Quick win, bajo esfuerzo, reutiliza infra existente
  (puede ir en paralelo con back-end de Fase 1)

Fase 3 — Software & Bots (Modulo 4)               ██░░░░░░░░
  Relativamente aislado, introduce Storage

Fase 4 — Mi Cartera (Modulo 3)                     ████░░░░░░
  El mas complejo — sync refactor, user-scoped data
  Se beneficia de componentes de Modulo 1

Fase 5 — Consultorias (Modulo 5)                    ███░░░░░░░
  Requiere toda la infra (Resend, Stripe extension)
  Puede diferirse hasta que haya demanda
```

---

## Consideraciones de seguridad

### Por modulo

| Modulo | Riesgo | Medida |
|--------|--------|--------|
| Cartera Ampliada | Operations: solo admin escribe | RLS: INSERT/UPDATE/DELETE solo admin |
| Cartera Ampliada | Realtime: no exponer datos extra | Habilitar Realtime SOLO en `operations`, no en todas las tablas |
| Cartera Ampliada | Cron digest: proteger endpoint | `CRON_SECRET` header (mismo patron que sync cron) |
| Herramientas | Archivos en `/public/` accesibles por URL directa | Aceptar riesgo (widgets no contienen datos sensibles) |
| Mi Cartera | Datos de un user visibles a otro | RLS estricta: `user_id = auth.uid()` en TODAS las tablas user_* |
| Mi Cartera | Rate limit de sync | Cooldown de 15 min por plataforma por usuario |
| Mi Cartera | Wallet addresses son PII | RLS: solo el propio user ve sus wallets |
| Software | Hotlinking de archivos | Signed URLs con expiry de 60s |
| Software | Storage bucket | Privado, solo service role genera URLs |
| Software | Uploads del admin | Validar extension de archivo minimo |
| Consultorias | Pago sin confirmar | NUNCA confirmar sin webhook de Stripe. Client-side redirect no es prueba de pago |
| Consultorias | Doble reserva | Funcion DB `SECURITY DEFINER` + check en API route |
| Consultorias | Notas del user = PII | RLS: solo el propio user ve sus notas |

### Stripe

- Mantener un unico tier `member` = acceso completo al Hub
- Consultorias: Stripe Checkout en modo `payment` (one-time), no subscription
- Webhook: extender handler existente para `mode === 'payment'` con metadata `type: 'consultation'`
- Crear Stripe Prices para cada tipo de consulta en el Dashboard
- **Futuro:** Si se necesitan tiers, crear segundo Stripe Product y anadir campo `tier` a profiles

---

## Archivos criticos a modificar

| Archivo | Cambio |
|---------|--------|
| [app/(home)/hub/](app/(home)/hub/) | Mover a `app/hub/`, reescribir como layout + modulos |
| [lib/sync/engine.ts](lib/sync/engine.ts) | Extender para loguear operations en diffs. Refactorizar para soporte user-scoped |
| [lib/supabase/types.ts](lib/supabase/types.ts) | Anadir tipos de todas las tablas nuevas |
| [app/api/stripe/webhook/route.ts](app/api/stripe/webhook/route.ts) | Extender para `mode === 'payment'` (consultorias) |
| [middleware.ts](middleware.ts) | Ajustes menores si hay sub-rutas publicas del Hub |
| [lib/supabase/auth.ts](lib/supabase/auth.ts) | Ya tiene `requireMember()`, no necesita cambios |

---

## Verificacion

Para cada modulo completado:
1. **Manual:** Navegar al Hub como `member`, verificar que todas las features funcionan
2. **RLS:** Intentar acceder a datos de otro usuario via Supabase client — debe fallar
3. **Paywall:** Verificar que un user `free` no puede acceder a ninguna ruta del Hub
4. **Stripe:** Test end-to-end de checkout (test mode) para subscriptions y consultorias
5. **Email:** Verificar recepcion de digest y confirmaciones (Resend test mode)
6. **Mobile:** Verificar responsive design en mobile
7. **Theme:** Verificar dark/light mode en todos los componentes del Hub
8. **Tests:** Anadir tests para API routes nuevas (patron de `__tests__/api/sync.test.ts`)
