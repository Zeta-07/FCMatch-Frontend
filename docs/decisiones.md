# Decisiones técnicas — Fase 0

## DT-008 — Skills OpenCode compartidas y portables

Se consume el catálogo HTTP de seis skills revisadas alojado en `FCMatch-Backend`, fijado a un SHA completo en `opencode.json`, junto con su política de uso. No se copian skills, lockfiles ni guías completas a este repositorio y no se usan rutas absolutas locales ni imports de aplicación entre repositorios. Tanto `web/` como `mobile/` heredan la configuración del repositorio. La configuración se puede usar desde un clon independiente con OpenCode V2 y acceso HTTPS a GitHub, sin credenciales personales para descargar el catálogo público. No cambia aplicaciones, dependencias, MCP ni permisos. Referencias: DT-007 de Backend y `docs/skills-opencode.md`; DT-007 de AdminWeb. Publicación aprobada por el propietario, Fase 1 no iniciada.

## DT-007 — Logo oficial por tema

Por petición del propietario, `Logo.png` se conserva para modo claro y `Logo-modo-oscuro.png` se usa en oscuro. Ambos originales de 2752 × 1536 se copian sin transformación ni compresión a los tres clientes. El componente compartido muestra solo la imagen del tema mediante `data-theme`, sin esperar a Angular ni depender del tema del sistema; conserva el ancho de presentación y altura automática. El favicon también se actualiza al alternar y antes del primer render al recargar. `scripts/sync-design.mjs` distribuye y comprueba ambos PNG. No se generan iconos nativos ni se avanza a Fase 1. Referencia cruzada: DT-006 de `FCMatch-AdminWeb/docs/decisiones.md`.

## DT-001 — Stack unificado autorizado

El propietario sustituye la biblioteca web anterior por Angular + Ionic en Web Cliente, móvil y AdminWeb; Capacitor solo se utiliza en móvil. Mantiene tres aplicaciones con sus propias rutas, navegación y responsabilidades. Se refleja también en `FCMatch-Backend/docs/decisiones.md` y `FCMatch-AdminWeb/docs/decisiones.md`.

## DT-002 — Diseño distribuido, repositorios independientes

El frontend conserva la fuente del sistema de diseño en `web/src/styles/` y `design-system/components/`. `scripts/sync-design.mjs` distribuye copias idénticas a cada cliente y permite comprobar diferencias con `--check`. La configuración común de herramientas vive en `client-tooling/`. AdminWeb recibe copias versionadas y nunca importa fuentes de otro repositorio. Se evita introducir un cuarto repositorio o un registro de paquetes antes de necesitarlo.

## DT-003 — Versiones y compatibilidad

Angular 22.2, Ionic 9.0.10 y Capacitor 8.6.0 estables. Ionic 9 importa standalone desde `@ionic/angular` y admite Angular 22 zoneless; estado asíncrono mediante signals. No se carga Zone.js. Angular compiler-cli exige TypeScript `>=6.0 <6.1`; typescript-eslint también excluye 7.0. Se utiliza TypeScript 6.0.3 en vez de la estable 7.0.2 incompatible. Los lockfiles fijan versiones resueltas.

Ionic CLI 7.2.1 fue consultado con `ionic info` y retirado porque incorpora dependencias obsoletas con vulnerabilidades sin solución en su cadena. Angular CLI y Capacitor CLI cubren las operaciones necesarias. El preset SCSS de Stylelint todavía exige 17; se utiliza Stylelint 18 con reglas explícitas, sin downgrade. Override minimatch 11.0.4 corrige la auditoría de las herramientas; se verifica mediante lint y pruebas.

## DT-004 — Temas, contraste y logo

Modo oscuro inicial, atributo `data-theme` y preferencia aplicada mediante `theme-init.js` antes del render. `localStorage` solo guarda `fcmatch-theme`, nunca tokens. `themes.scss` idéntico en los tres clientes y único archivo de cada aplicación con colores fijos.

Tokens derivados: texto secundario `#CBD5E1`/`#475569`, borde `#64748B`, texto sobre acción `#0B0F19`/`#FFFFFF`. Se conserva el archivo original sin recortar ni recolorear. El soporte visual claro del logo se retiró por petición del propietario en DT-006. Angular puede advertir en desarrollo que el original es mayor que su representación; no se altera el recurso para ocultar ese aviso.

La paleta corporativa permanece intacta. Se añade `--button-background` (`#00FF87`/`#047857`) para que las acciones conserven contraste legible también con texto claro en el tema claro. Estilos responsivos con ancho máximo, espacios fluidos y foco visible; no se añade una segunda biblioteca de UI.

## DT-005 — Alcance y pruebas

Las únicas pantallas son comprobaciones de infraestructura: `/estado` en web, `/inicio` en móvil y `/sistema` en AdminWeb. No se anticipan accesos, guards JWT, pestañas de negocio ni CRUD. El componente común `ApiStatus` es técnico y consume la misma API.

Playwright comprueba los clientes contra API/PostgreSQL reales localmente. En CI independiente usa un contrato interceptado explícito; la validación real de base de datos vive en el backend. Android/iOS nativos y tiendas siguen previstos para la fase 11, no se incorporan compilaciones fuera de alcance.

## DT-006 — Transparencia original del logo

Tras la revisión visual del propietario se comprobó que `Logo.png` tiene transparencia real: 2752 × 1536 píxeles, con 3 769 583 píxeles completamente transparentes y 70 884 parcialmente transparentes. El original y sus tres copias son binariamente idénticos. El rectángulo claro procedía de `background: var(--brand-background)` en `.brand-mark`, no del PNG ni de Ionic.

Se retiran esa declaración y el token claro de ambos temas en los tres clientes. El logo se compone sobre el fondo de la página sin filtros, recoloreado, recorte, cambios de tamaño ni archivo derivado. Esta corrección sustituye únicamente la decisión anterior de añadir un soporte claro. Referencia cruzada: DT-005 de `FCMatch-AdminWeb/docs/decisiones.md`.
