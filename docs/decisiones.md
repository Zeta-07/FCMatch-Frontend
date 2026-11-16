# Decisiones técnicas — Fase 0

## DT-016 — Completar retroceso desde perfiles buscados en Web Cliente

El propietario aclara que el retroceso de DT-015 también corresponde a Web Cliente. La causa era una restricción de plataforma en la captura/restauración de búsqueda y visibilidad de la flecha. Se retira esa restricción en las fuentes compartidas; Web usa la misma instantánea en memoria y el mismo ion-back-button/icono de Editar perfil ya verificados en móvil, sin nueva navegación ni estilos. Se conserva consulta enviada, borrador, resultados acumulados, cursor y scroll al volver; Mi perfil y accesos directos siguen sin retroceso añadido. El comportamiento móvil permanece equivalente. No cambian temas, formularios, API, Backend, AdminWeb ni dependencias; se conservan las excepciones aprobadas de Angular/TypeScript.

Verificación local dirigida: regreso por cabecera y navegador en ambos temas a 320/768/1280px en Web y 390px en móvil; páginas/cursor, ausencia de refetch, scroll con tolerancia de 5px y Mi perfil sin flecha. Además regresiones de búsqueda, contraste, perfil público y cabecera, lint/formato/build/audit de ambos clientes. No se repite aceptación real ni baterías completas locales de módulos intactos. CI existente sin modificaciones; PR #5 abiertos sin merge ni Etapa 7.

## DT-015 — Regreso desde búsqueda y ancho de Editar perfil móvil

El propietario aprueba el resto de Etapa 6 y solicita únicamente dos remates móviles, sin cierre definitivo ni Etapa 7. El perfil público abierto desde Buscar muestra retroceso Ionic con el mismo icono de Editar perfil. Se usa ion-back-button para volver en la pila de Ionic, con /buscar como destino de respaldo. No se añade retroceso a Mi perfil ni a perfiles abiertos directamente sin procedencia de búsqueda.

La búsqueda guarda una única instantánea de navegación en memoria (consulta enviada y texto editado, resultados acumulados, cursor, estado de búsqueda y scrollTop); nunca localStorage, URL con datos ni nuevas llamadas automáticas. Está vinculada a la revisión de sesión y se limpia al cerrar sesión o abandonar la búsqueda hacia otro destino. Se restaura al regresar, incluso si Ionic recrea la página; scroll después de la transición. Las respuestas tardías de búsquedas abandonadas no sobrescriben el estado restaurado. No cambia API, semántica, límites, permisos o paginación.

Editar perfil utiliza una clase exclusivamente móvil y de modo profile: hasta 48rem aprovecha el ancho completo, con padding horizontal 0.75rem en marco y tarjeta, y margen vertical 0.5rem en tarjeta. No cambia campos, controles, validaciones, botones, temas, colores, tarjetas de Estadísticas/Historial ni otros formularios; Web mantiene su composición. Fuentes canónicas distribuidas por sync-identity a las dos aplicaciones, nunca imports cruzados. Sin cambios de Backend/AdminWeb.

Se mantienen las excepciones aprobadas Angular 22.2.4/TypeScript 6.0.3. El inventario detectó mantenimiento estable de Playwright 1.65.1 y ESLint 10.15.0; se actualizan herramientas dev en commit separado, sin añadir dependencias ni cambiar UI.

## DT-014 — Ajustes finales aprobados: búsqueda manual única y perfil

El propietario aprueba eliminar el selector Usuario/ID y usar un campo Usuario o ID público; solo submit por Buscar/Enter consulta. Cargar más utiliza una copia de la última consulta enviada, no el valor editado. query se resuelve y pagina íntegramente en Backend DT-016, con compatibilidad de search/publicNumber y cursor anterior. La etiqueta Tú compara publicNumber con el perfil propio disponible en memoria; si falta, se obtiene al enviar, sin búsqueda automática y sin alterar permisos. Los resultados incluyen al titular. Únicamente se elimina Ajustes dentro de Mi perfil; Editar perfil y Ajustes en navegación principal continúan. Las tarjetas Estadísticas e Historial y sus estilos quedan expresamente aprobados e intactos, sin cambios de tamaño/distribución. Pruebas/aceptación y contraste ambos temas antes de publicar. No nuevas pantallas, paleta, dependencias de UI, Etapa 7 ni merge. Modelos actualizados desde OpenAPI; AdminWeb solo sincroniza contrato (DT-013).

## DT-013 — Correcciones REV4 y número público de Etapa 6

Plan aprobado por el propietario, pendiente nueva aprobación visual definitiva. Cabecera compacta, navegación actual con aria-current, botón de acción luna/sol con nombre dinámico y descripción del estado, único en cabecera; se retira Apariencia de Ajustes. Formularios con jerarquía y controles consistentes, recuperación junto a contraseña, acciones secundarias agrupadas; perfil con avatar/identidad y fila compacta para ID/copia, cuenta en filas Ionic y sesiones con cierre global diferenciado/cancelable. Sin eslóganes, sellos ficticios, estadísticas inventadas ni cambios de logo. Web conserva navegación superior y móvil sus pestañas temporales de identidad: no se anticipan módulos.

Tokens nuevos (oscuro/claro): bg-subtle #141B27/#F1F5F9, border-subtle #3C4656/#CBD5E1 (separadores decorativos, no borde único de controles), nav-active #00FF87/#047857, action-danger #FF8585/#B91C1C; bg-transparent transparente. Solo themes.scss define colores, idéntico en los tres clientes. Los controles conservan border-color con contraste comprobable; el texto principal/secundario y foco conservan los tokens existentes. Fuentes canónicas: design-system/components, web/src/app para identidad, client-tooling para tests; se distribuyen por copia versionada, nunca imports entre aplicaciones.

Accept application/vnd.fcmatch.identity.v2+json solicita la representación nueva de perfiles. La interfaz solo muestra/copia publicNumber y enlaza /usuarios/<número>; no se usa el UUID público anterior como fallback visible. Backend conserva los dos UUID, respuesta JSON anterior, cursores y permisos; búsqueda Usuario o ID explícita para no confundir usernames numéricos. Referencias: Backend DT-015, AdminWeb DT-012. Solo mantenimiento de modelos/tema/componentes en AdminWeb, nunca pantallas cliente. Sin dependencias nuevas; Angular 22.2.4/TS 6.0.3 conservan excepciones aprobadas.

## DT-012 — Contrato de Etapa 5 sin interfaces

Etapas 3–4 aprobadas y Etapa 5 autorizada en la API única: perfiles/búsqueda/cambio de correo y avatares. Este repositorio recibe solo los modelos regenerados idénticos del contrato, cuya descripción de Avatar aclara S3 local real (HTTP solo 127.0.0.1) y R2 HTTPS previsto para producción con integración real pendiente. El propietario sustituyó R2 de desarrollo para evitar tarjeta; no hay configuración S3 o secretos en los clientes. No se añaden pantallas, rutas, servicios de autenticación ni lógica de negocio. Tema/logos y Angular 22.2.4/TypeScript 6.0.3 conservados. Publicación autorizada tras verificaciones, PR #5 abierto y sin merge; Etapa 6 requiere aprobación. Referencias: Backend DT-014 e informe Etapa 5, AdminWeb DT-011. Los apartados anteriores son históricos.

## DT-011 — Publicación de etapas aprobadas

El propietario aprueba los resultados de Etapas 1 y 2 y autoriza sus commits/push en `feature/fase-1-identidad`, con mantenimiento separado de contrato/modelos. En adelante se pueden publicar etapas aprobadas con pruebas satisfactorias; Etapa 3 tiene autorización expresa de publicación al finalizar sus verificaciones. No se autorizan fusiones, force push, secretos o avanzar a Etapa 4. La Etapa 3 de registro/verificación corresponde a Backend; este cliente solo recibirá mantenimiento de modelos si el contrato lo requiere. Referencias: DT-011 de Backend, DT-010 de AdminWeb.

## DT-010 — Excepción Angular aprobada

El propietario aprueba el 11/11/2026 los resultados de Etapa 1 y conservar temporalmente Angular 22.2.4. Esto resuelve el pendiente histórico de DT-009, sin forzar 22.2.5, hacer downgrade ni modificar dependencias incompatibles. El contrato y los resultados de Etapa 1 se mantienen. Etapa 2 se limita a persistencia en Backend; no añade interfaces ni autenticación en estos clientes. Referencias: DT-010 de Backend y DT-009 de AdminWeb. No commits, push o fusiones autorizados.

## DT-009 — Fase 1, Etapa 1 y mantenimiento compatible

El propietario autoriza cambios locales de RF-01 a RF-06 y revisión al terminar cada etapa, sin commits/push/fusiones. Etapa 1 solo incorpora modelos generados desde el contrato objetivo del Backend; no hay pantallas, guards o autenticación implementados. SMTP local aprobado; avatares requieren R2 real de desarrollo, todavía pendiente; móvil se acepta en navegador y no acredita validación nativa/almacenamiento seguro de Fase 11. Políticas en `FCMatch-Backend/docs/fase-1-identidad.md` (DT-008/009), sin importar fuentes entre repositorios. Mantenimiento: Ionic 9.0.11, Playwright 1.65.0, Prettier 3.10.0, typescript-eslint 8.72.2 y npm 12.2.2; TS 6.0.3 conserva la excepción de peers. Angular sigue en 22.2.4: los intentos hacia 22.2.5 fallaron con ERESOLVE; una actualización global también falló por Babel no publicado. Sin downgrade, force, legacy-peer-deps, permisos de scripts ni override nuevo. La excepción temporal de Angular está pendiente de aprobación; no se declara mantenimiento completo. No cambia temas, logos o rutas. Referencia: DT-008 de AdminWeb.

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
