# Design System Master File — FamilyPicks

> **LÓGICA:** Al construir una página concreta, primero mira `design-system/familypicks/pages/[nombre].md`.
> Si ese archivo existe, sus reglas **anulan** este Master. Si no, sigue estrictamente lo de abajo.

---

**Proyecto:** FamilyPicks — servicio de predicciones deportivas de **un único tipster** (tú). Picks, track record verificado, suscripciones. NO es un marketplace de tipsters.
**Generado:** 2026-09-03 · afinado a mano sobre la salida del skill
**Categoría base:** Sports Team/Club → reencaminada a **Sports-Betting / Data product** (dark-first)
**Design Dials:** Variance 7/10 · Motion 5/10 · Density 7/10
**Idioma UI por defecto:** Español (es-ES). **Edad legal:** 18+ (configurable a 21+ por jurisdicción).

---

## 0. Principios del producto (no negociables)

1. **La semántica de resultado manda sobre la marca.** Verde = acierto/valor, Rojo = fallo, Gris = nulo/push, Ámbar = pendiente/en vivo. Por eso **el color de marca NO puede ser rojo ni verde**: se usa un azul. El oro queda reservado a "Premium/VIP".
2. **Transparencia radical.** Todo pick lleva timestamp anterior al inicio del evento, cuota de registro y cuota de cierre. El track record del canal muestra ROI, yield, % acierto y **tamaño de muestra** (nº de picks) siempre visible. Nunca un % de acierto sin el nº de apuestas.
   - **Un solo autor.** Hay un único tipster. No usar lenguaje de marketplace ("sigue a tus tipsters", "descubre tipsters", ranking de tipsters). La marca *es* la persona: FamilyPicks = tú.
3. **Juego responsable siempre visible.** Banner 18+, enlace a ayuda, mensaje "las predicciones no garantizan resultados; apostar implica riesgo de pérdida" en footer de cada página y en el checkout.
4. **Números legibles.** Cifras siempre con `font-variant-numeric: tabular-nums`. Miles con separador. Cuotas a 2 decimales. Unidades de stake 1–10.
5. **Sin humo.** Prohibido "100% seguro", "pick ganador garantizado", cuentas atrás falsas, ROI sin periodo, testimonios inventados.

---

## 1. Color

### 1.1 Modo oscuro (por defecto)

| Rol | Hex | CSS var |
|-----|-----|---------|
| Background (app) | `#0B0F1A` | `--bg` |
| Surface / Card | `#141A28` | `--surface` |
| Surface elevada (modal, popover) | `#1B2333` | `--surface-2` |
| Border / divider | `#26303F` | `--border` |
| Text primary | `#F1F5F9` | `--text` |
| Text secondary | `#94A3B8` | `--text-muted` |
| Text disabled | `#5B6676` | `--text-disabled` |
| **Primary (marca)** | `#0EA5E9` | `--primary` |
| Primary hover | `#38BDF8` | `--primary-hover` |
| On primary | `#04121C` | `--on-primary` |
| Focus ring | `#7DD3FC` | `--ring` |

### 1.2 Colores semánticos de resultado (idénticos en claro y oscuro salvo ajuste de luminancia)

| Estado | Base | Texto sobre oscuro | Fondo tenue (badge) | CSS var |
|--------|------|--------------------|---------------------|---------|
| Acierto / Win / valor + | `#22C55E` | `#4ADE80` | `rgba(34,197,94,.14)` | `--win` |
| Fallo / Loss | `#EF4444` | `#F87171` | `rgba(239,68,68,.14)` | `--loss` |
| Nulo / Push / Void | `#94A3B8` | `#CBD5E1` | `rgba(148,163,184,.14)` | `--push` |
| Pendiente / En vivo | `#F59E0B` | `#FBBF24` | `rgba(245,158,11,.14)` | `--pending` |
| Cash out parcial | `#0EA5E9` | `#38BDF8` | `rgba(14,165,233,.14)` | `--cashout` |

### 1.3 Premium / VIP (uso mínimo: badges, borde de plan, corona)

| Rol | Hex | CSS var |
|-----|-----|---------|
| Gold | `#EAB308` | `--vip` |
| Gold on dark text | `#FACC15` | `--vip-text` |
| Gradiente VIP | `linear-gradient(135deg,#EAB308,#F59E0B)` | `--vip-grad` |

### 1.4 Modo claro (soportado, no por defecto)

| Rol | Hex |
|-----|-----|
| Background | `#F8FAFC` |
| Surface / Card | `#FFFFFF` |
| Border | `#E2E8F0` |
| Text primary | `#0F172A` |
| Text secondary | `#475569` |
| Primary | `#0284C7` (más oscuro para contraste sobre blanco) |
| Win / Loss / Push / Pending | `#16A34A` / `#DC2626` / `#64748B` / `#D97706` |

### 1.5 Reglas de color

- Contraste texto normal ≥ 4.5:1; texto grande / no-texto ≥ 3:1. Verificar `--text-muted` sobre `--surface` (cumple 4.6:1) y las cuotas verde/rojo sobre card.
- **Nunca** transmitir el resultado solo por color: acompañar siempre de icono (check / cross / dash / clock) y/o etiqueta.
- Gráficas: series por color **+** estilo de línea (sólida/discontinua) + etiqueta directa. Bankroll positivo `--win`, negativo `--loss`, línea 0 `--border`.
- Movimiento de cuota: ↑ subió (`--win` si te favorece al haber cogido antes), ↓ bajó (`--loss`), con flecha, no solo color.

---

## 2. Tipografía

```css
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@500;600;700;800&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@500;700&display=swap');
```

| Uso | Fuente | Notas |
|-----|--------|-------|
| Display / H1–H2 / cifras hero | **Outfit** 700–800 | Geométrica, deportiva, moderna |
| H3–H6 / UI / botones | **Outfit** 600 | |
| Body / párrafos / tablas | **Inter** 400–600 | Humanista, densa, legible a 14–16px |
| Cuotas, ROI, stake, ticker | **JetBrains Mono** 500–700 | Solo datos numéricos que deben alinear en columna |

- **Todo dato numérico:** `font-variant-numeric: tabular-nums;` (aplícalo global a `td`, `.stat`, `.odds`).
- Escala tipográfica (px): `12 · 14 · 16 · 18 · 20 · 24 · 32 · 40 · 56`. Base body **16px** (14px sólo en celdas de tabla densas y metadatos).
- Line-height: body 1.6, headings 1.15, cifras 1.
- Medida de línea: 60–75 car. desktop, 35–60 móvil.
- Peso como jerarquía: headings 700, labels 600, body 400, dato destacado 700.

---

## 3. Espaciado, radios, sombras, layout

### Espaciado (escala 4px, densidad 7/10)

| Token | Valor | Uso |
|-------|-------|-----|
| `--space-1` | 4px | gaps mínimos, icon-text |
| `--space-2` | 8px | interno de chips/badges |
| `--space-3` | 12px | padding de celdas |
| `--space-4` | 16px | padding estándar de card |
| `--space-6` | 24px | separación de bloques |
| `--space-8` | 32px | gaps de grid, padding de card grande |
| `--space-12` | 48px | márgenes entre secciones (app) |
| `--space-16` | 64px | secciones landing |
| `--space-24` | 96px | respiración de hero |

### Radios

`--radius-sm: 6px` (inputs, chips) · `--radius-md: 10px` (botones, badges) · `--radius-lg: 14px` (cards) · `--radius-xl: 20px` (modales, hero cards) · `--radius-full: 9999px` (avatares, pills de cuota).

### Sombras (modo oscuro: sombra + borde, no solo sombra)

| Nivel | Valor |
|-------|-------|
| `--shadow-sm` | `0 1px 2px rgba(0,0,0,.4)` |
| `--shadow-md` | `0 4px 12px rgba(0,0,0,.45)` |
| `--shadow-lg` | `0 12px 32px rgba(0,0,0,.5)` |
| `--glow-primary` | `0 0 0 1px rgba(14,165,233,.4), 0 8px 24px rgba(14,165,233,.18)` (solo CTA principal / pick destacado) |

### Layout

- Contenedor máx: `1200px` (app) / `1280px` (landing). Gutter: 16px móvil → 24px tablet → 32px desktop.
- Breakpoints: **375 / 768 / 1024 / 1440**. Mobile-first.
- `min-height: 100dvh` (no `100vh`).
- z-index: `base 0 · sticky nav 20 · dropdown 30 · overlay 40 · modal 50 · toast 60 · age-gate 100`.
- App con nav lateral en ≥1024px; barra inferior (máx 5 ítems) o top-bar en móvil.
- Reservar padding para navbar sticky (64px) y, en móvil, para barra inferior (56px + safe-area).

---

## 4. Patrones de página

### 4.1 Landing (marketing) — Hero-Centric

Orden: **Age-gate (primera visita) → Nav sticky con CTA → Hero (titular + prueba de track record real + 1 CTA) → Tira de métricas verificadas (ROI global, yield, nº picks, periodo) → Cómo funciona (3 pasos) → Gráfica de bankroll + últimos picks resueltos → Quién está detrás (tú: foto, trayectoria, metodología) → Planes → FAQ → Footer con juego responsable**.

- Un solo CTA primario por viewport ("Ver picks gratis" / "Empezar"). Secundario subordinado.
- Hero estático si `prefers-reduced-motion`. Sin cuentas atrás falsas.
- Prueba social = datos auditables (gráfica de bankroll, enlace a histórico completo), no frases.

### 4.2 App (producto) — Dashboard / Feed

- **Shell:** nav lateral (Inicio, Picks, Resultados, Estadísticas, Mi cuenta) + topbar (buscador, filtros, estado de sesión, saldo de unidades opcional).
- **Feed de picks:** lista/grid de Pick Cards con filtros por chips (deporte, mercado, estado, fecha). Orden por: más recientes / mayor cuota / mayor confianza.
- **Estadísticas / track record:** una única página con la cabecera de autoridad (KPIs del canal) + gráfica de bankroll + desglose por deporte/mercado + tabla de histórico. Sin "seguir": la relación es suscripción al canal.
- **Resultados:** tabla filtrable y ordenable, exportable a CSV, con resumen arriba (P&L en unidades, ROI, racha).
- Estado vacío siempre con mensaje + acción ("Aún no hay picks para hoy. Activa avisos.").

---

## 5. Componentes (specs)

### 5.1 Botones

```css
.btn { font: 600 15px/1 Outfit, sans-serif; padding: 12px 20px; border-radius: var(--radius-md);
       transition: background .18s ease, transform .18s ease, box-shadow .18s ease; cursor: pointer; }
.btn-primary { background: var(--primary); color: var(--on-primary); }
.btn-primary:hover { background: var(--primary-hover); }
.btn-primary:active { transform: translateY(1px); }
.btn-primary:focus-visible { outline: 2px solid var(--ring); outline-offset: 2px; }
.btn-primary.cta { box-shadow: var(--glow-primary); }           /* solo 1 por pantalla */
.btn-ghost { background: transparent; color: var(--text); border: 1px solid var(--border); }
.btn-ghost:hover { background: var(--surface-2); }
.btn:disabled { opacity: .45; cursor: not-allowed; }
```
Altura mínima táctil 44px. Nunca botón solo-icono sin `aria-label`.

### 5.2 Pick Card

Contiene, en este orden visual:
1. Fila meta: icono de deporte + liga · hora de inicio · **badge de estado** (Pendiente / Acierto / Fallo / Nulo).
2. Evento: `Local vs Visitante` (Outfit 600, 16–18px).
3. Selección + mercado: p. ej. "Over 2.5 goles" · "Hándicap -1".
4. Fila de datos (JetBrains Mono, tabular): **Cuota** `2.10` (con ↑/↓ vs cierre) · **Stake** `4/10` · **Confianza** meter.
5. Pie: `hace 2 h` + acción (guardar / copiar / compartir). **No lleva nombre de tipster por card** — hay un solo autor; la autoría es implícita. Como mucho, un tick "verificado" discreto.

```css
.pick-card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-lg);
             padding: var(--space-4); display: grid; gap: var(--space-3); }
.pick-card:hover { border-color: #33404F; box-shadow: var(--shadow-md); }
.pick-card[data-status="win"]  { border-left: 3px solid var(--win); }
.pick-card[data-status="loss"] { border-left: 3px solid var(--loss); }
.pick-card[data-status="push"] { border-left: 3px solid var(--push); }
.pick-card[data-status="pending"] { border-left: 3px solid var(--pending); }
.pick-card--featured { box-shadow: var(--glow-primary); border-color: rgba(14,165,233,.5); }
```

### 5.3 Odds pill

```css
.odds { font: 700 14px/1 'JetBrains Mono', monospace; font-variant-numeric: tabular-nums;
        padding: 4px 8px; border-radius: var(--radius-full); background: var(--surface-2); color: var(--text); }
.odds .move-up::before   { content: "▲"; color: var(--win);  font-size: 9px; margin-right: 4px; }
.odds .move-down::before { content: "▼"; color: var(--loss); font-size: 9px; margin-right: 4px; }
```

### 5.4 Badge de estado

```css
.badge { display: inline-flex; align-items: center; gap: 4px; font: 600 12px/1 Inter; padding: 5px 8px;
         border-radius: var(--radius-md); text-transform: uppercase; letter-spacing: .02em; }
.badge--win     { color: var(--win);     background: var(--win-bg); }      /* icono: check */
.badge--loss    { color: var(--loss);    background: var(--loss-bg); }     /* icono: x */
.badge--push    { color: var(--push);    background: var(--push-bg); }     /* icono: minus */
.badge--pending { color: var(--pending); background: var(--pending-bg); }  /* icono: clock */
.badge--vip     { background: var(--vip-grad); color: #1A1204; }           /* icono: crown */
```
Siempre icono + texto (no solo color).

### 5.5 Stat tile / KPI

```
┌─────────────────────────────┐
│ ROI                    ↗     │   label Inter 600 12px muted
│ +14.2 %                      │   valor Outfit 800 32px, color --win si +, --loss si −
│ ▁▂▃▅▆▇  últimos 90 días      │   sparkline + periodo (obligatorio el periodo)
│ 1.284 picks · yield 6.1 %    │   contexto: SIEMPRE tamaño de muestra
└─────────────────────────────┘
```
Nunca un KPI sin periodo ni sin nº de picks.

### 5.6 Cabecera de autoridad (bloque único de credibilidad)

**Un solo autor** — no es una card repetible, es la franja de credibilidad del sitio (aparece en Estadísticas y, condensada, en el hero de la landing).

- Avatar / foto real (64px, `--radius-full`) + nombre o marca (FamilyPicks / tu handle) + **check verificado** (tooltip "Historial auditado y público desde {fecha}").
- Fila de KPIs del canal: **ROI · Yield · % acierto · Nº picks · Periodo · Racha** — cada uno con su contexto, siempre con tamaño de muestra.
- Una línea de metodología en texto ("Value betting en fútbol europeo y NBA, stakes 1–10, cierre registrado en Pinnacle").
- CTA: **"Suscribirse"** (primary). Nunca "Seguir" (eso es lenguaje de marketplace).

### 5.6b Pick bloqueado (plan Gratis)

Estado de la Pick Card cuando el plan del usuario aún no da acceso a ese pick (Gratis = 24 h de retraso). Es el punto de conversión principal del feed.

- `.pick--locked` con `position:relative; overflow:hidden`.
- Contenido real difuminado (`filter: blur(5px)`, `pointer-events:none`, `user-select:none`, `aria-hidden="true"`) — se intuye deporte/evento pero no la selección ni la cuota exacta.
- Overlay centrado sobre `color-mix(--surface 62%, transparent)`: candado (`--pending`) + "Se publica en {N} h en tu plan" + línea de valor ("Premium lo recibe ahora, antes del cierre de cuota") + botón primary "Verlo ahora con Premium".
- No usar cuenta atrás falsa: el tiempo restante es real (24 h desde la publicación).
- Los picks **resueltos** nunca se bloquean: el track record es siempre público y completo.

### 5.7 Tabla de resultados

- Wrapper `overflow-x: auto`. En <768px: colapsa a lista de cards (una card por pick).
- Header sticky, `aria-sort` en la columna activa, orden por fecha/cuota/stake/resultado.
- Fila con `border-left` de color de resultado; celda "Beneficio" en verde/rojo con signo.
- Formato: fechas locales, unidades con signo (`+3.60 u` / `−4.00 u`), cuotas 2 decimales.
- Resumen fijo arriba: P&L total, ROI, nº apuestas, racha actual.
- Exportar CSV. Paginación o virtualización a partir de 50 filas.

### 5.8 Confidence meter

5 barras (o `role="meter"` 0–100). Etiqueta textual: Baja / Media / Alta / Máxima. Color neutro (`--primary` relleno, `--border` vacío) — la confianza **no** es un resultado, no usar verde/rojo.

### 5.9 Gráfica de bankroll (evolución de unidades)

- Line/area chart, eje X tiempo, eje Y unidades acumuladas. Línea 0 marcada.
- Área verde por encima de 0, roja por debajo (con patrón además de color).
- Hover/focus revela: fecha, pick, resultado, unidades. Accesible por teclado (flechas + / −). Fallback: tabla visible + resumen ("De 0 a +78 u en 9 meses, drawdown máx −22 u").
- `prefers-reduced-motion`: sin animación de entrada, datos legibles al instante.
- Librería: Chart.js o Recharts.

### 5.10 Planes (pricing)

3 columnas, diferenciadas por **acceso a los picks** (no por tipster, que es uno):
- **Gratis** — picks publicados con 24 h de retraso · 1 deporte · track record completo visible.
- **Premium** — todos los picks en tiempo real · todos los deportes/mercados · alertas por email.
- **VIP** — todo lo anterior + alertas push y canal de Telegram · picks de stake alto y valores especiales · cierre de cuota registrado.

Columna recomendada con borde `--primary` + label "Más elegido" (real, no falso). Precio con periodo claro, IVA incluido, "cancela cuando quieras". Sin auto-renovación oculta.

### 5.11 Age gate (bloqueante, primera visita)

Modal centrado, overlay `blur(6px)`, no cerrable con Esc sin elegir. Texto: "Debes tener 18 años o más para acceder." Botones "Tengo 18+ / Salir". "Salir" → redirige fuera. Guardar aceptación en `localStorage` (try/catch). Enlace a juego responsable dentro del modal.

### 5.12 Inputs / formularios

Label visible siempre (no solo placeholder). Error debajo del campo con `aria-describedby` + `role="alert"`. Validar en `blur`. `inputmode`/`type` semántico. Toggle mostrar/ocultar en contraseña. `autocomplete` correcto. Tras submit fallido con varios errores: foco al resumen de errores enlazado.

---

## 6. Movimiento

| Uso | Duración | Easing |
|-----|----------|--------|
| Hover / cambio de estado | 150–200ms | `ease-out` |
| Entrada de modal / sheet | 220ms enter / 150ms exit | `cubic-bezier(.2,.8,.2,1)` |
| Stagger de lista de picks | 300–420ms, 50ms/ítem | `back.out(1.2)` (no en tablas) |
| Actualización de cuota (flash) | 400ms | `ease-out`, fondo → normal |
| Sparkline / gráfica | 500ms una vez | `ease-out`, omitir si reduced-motion |

```js
// Respetar siempre:
if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { /* estado final directo */ }
```

Reglas: solo `transform`/`opacity`. Máx 1–2 elementos animados por vista. Exit ~65% del enter. Nada de motion en datos de tabla. Toda animación interrumpible; el tap del usuario cancela.

---

## 7. Iconos

- Set único: **Lucide** (o Phosphor). Stroke 1.75–2px, sin mezclar filled/outline en el mismo nivel.
- Deportes: `activity` genérico o set específico (balón, tenis, baloncesto) coherente.
- Semántica: `check` win · `x` loss · `minus` push · `clock` pending · `crown` VIP · `shield-check` verificado · `trending-up/down` movimiento.
- Iconos decorativos junto a texto visible → `aria-hidden="true"`. Icono con significado propio → `aria-label`.
- Tamaños token: `--icon-sm 16 · --icon-md 20 · --icon-lg 24`. Nunca emojis como iconos estructurales.

---

## 8. Accesibilidad (checklist de entrega)

- [ ] Contraste ≥ 4.5:1 texto normal en claro y oscuro (verificado `--text-muted`, cuotas, badges).
- [ ] Resultado nunca solo por color: icono + etiqueta en badges, filas y gráficas.
- [ ] Focus visible (2px `--ring`, offset 2px) en todo elemento interactivo; no quitar outline.
- [ ] Orden de tabulación = orden visual. Navegación por teclado completa (feed, filtros, tabla, gráfica).
- [ ] Tabla: `<th scope>`, `aria-sort`, caption o resumen; alternativa en texto para la gráfica.
- [ ] Modales (age gate, checkout): foco atrapado, retorno de foco, cierre claro (salvo age gate).
- [ ] `prefers-reduced-motion` respetado en hero, stagger, flash de cuotas, gráficas.
- [ ] Targets táctiles ≥ 44px; ≥ 24px CSS mínimo en web con separación.
- [ ] Dynamic type / zoom 200% sin romper layout ni truncar datos críticos.
- [ ] Toasts `aria-live="polite"`, no roban foco. Errores de formulario `role="alert"`.
- [ ] Login permite gestor de contraseñas y pegar.

---

## 9. Cumplimiento / juego responsable (checklist)

- [ ] Age gate 18+ en primera visita, bloqueante.
- [ ] Footer de cada página: "18+ · Juega con responsabilidad" + enlace a recurso de ayuda + `+ info` autoexclusión.
- [ ] Disclaimer visible en landing, ficha de tipster y checkout: *"Las predicciones no garantizan resultados. Apostar conlleva riesgo de pérdida económica."*
- [ ] Todo KPI con periodo y tamaño de muestra. Histórico completo accesible (no cherry-picking).
- [ ] Sin lenguaje de garantía de beneficio, sin urgencia falsa, sin testimonios no verificables.
- [ ] Cuotas de afiliados/casas: marcar enlaces como publicidad si los hay.
- [ ] Suscripciones: precio con impuestos, renovación clara, cancelación en 2 clics.

---

## 10. Anti-patrones (NO hacer)

- ❌ Rojo o verde como color de marca (colisiona con win/loss).
- ❌ Lenguaje de marketplace: "sigue a tus tipsters", "ranking de tipsters", "descubre tipsters", nombre de autor en cada pick. Hay **un solo** tipster.
- ❌ % de acierto sin nº de apuestas · ROI sin periodo.
- ❌ Emojis como iconos · iconos PNG · mezclar sets de iconos.
- ❌ Resultado comunicado solo por color.
- ❌ Hover que desplaza el layout (usar color/opacidad/sombra, no `scale` que empuje).
- ❌ Cambios de estado instantáneos (siempre 150–200ms).
- ❌ `100vh` en móvil · tablas que desbordan sin `overflow-x` · scroll horizontal.
- ❌ Placeholder como única etiqueta · errores solo arriba del formulario.
- ❌ Cuentas atrás falsas, "plazas limitadas" ficticias, "pick 100% seguro".
- ❌ Auto-play de vídeo con sonido en hero.

---

## 11. Pre-Delivery Checklist (todas las páginas)

- [ ] Iconos SVG de un solo set, tamaños token, stroke consistente.
- [ ] `cursor: pointer` en todo clicable; estados hover/active/disabled distintos.
- [ ] Transiciones 150–200ms; `prefers-reduced-motion` respetado.
- [ ] Contraste 4.5:1 en claro y oscuro; probados ambos modos.
- [ ] Focus visible en teclado; orden lógico.
- [ ] Responsive real en 375 / 768 / 1024 / 1440; sin scroll horizontal; landscape ok.
- [ ] Datos numéricos con `tabular-nums` y separadores de miles.
- [ ] Contenido no oculto tras navbar sticky ni barra inferior (safe-area).
- [ ] Estados vacío / carga (skeleton) / error definidos.
- [ ] Age gate + footer de juego responsable + disclaimer presentes.
