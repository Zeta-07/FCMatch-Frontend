# Etapa 6 — correcciones posteriores a la revisión funcional

## Alcance y estado

Correcciones autorizadas por el propietario sobre `feature/fase-1-identidad`. REV4 es referencia de composición, no código ni texto de producción. La implementación no equivale a aprobación visual definitiva. PR #5 abiertos, sin merge ni avance a Etapa 7.

## Cambios

- Cabecera web compacta con navegación activa accesible y adaptación a anchos pequeños. Móvil conserva sus pestañas de identidad y cabecera propia; subformularios con regreso, sin pestañas.
- Tema mediante icono sol/luna según la acción disponible, nombre accesible dinámico y descripción del tema actual. Sin selector duplicado ni sección Apariencia vacía en Ajustes. Preferencia y favicon conservados antes del render y tras alternar.
- Acceso con formulario centrado, recuperación junto a contraseña, visibilidad por icono accesible, acción principal y enlaces secundarios agrupados.
- Perfil con avatar/identidad, correo privado del titular y fila compacta para ID/copiar; estados vacíos reales de estadísticas e historial.
- Ajustes con filas Ionic para la cuenta; cierre actual separado del cierre global, con confirmación cancelable.
- Solo el ID numérico aparece en perfiles, edición, búsqueda y portapapeles. Enlaces nuevos numéricos; UUID anteriores todavía resuelven, sin mostrarlos en la interfaz.
- Búsqueda explícita por Usuario o ID público, evitando reinterpretar usernames numéricos.

Se conservan logos byte-exact, Ionic/Angular, colores solo en tokens globales y temas idénticos en los tres clientes. AdminWeb recibe únicamente mantenimiento de tema, componente y modelos, no pantallas del cliente.

## API y datos

Ver Backend `docs/decisiones.md`, DT-015: migraciones expand/finalize, backfill reanudable, UUID internos y anteriores intactos, número único/inmutable/no reciclado. Respuesta application/json anterior sin campos nuevos; representación nueva opt-in mediante Accept application/vnd.fcmatch.identity.v2+json. Cursores HMAC UUID y autenticación sin cambios. Los números son públicos y enumerables, nunca credenciales ni permisos.

## Verificación

Pasada completa satisfactoria: `npm run check` en Web y móvil con **47/47 pruebas por aplicación**, ninguna omitida. Cada una incluye 45 pruebas de interfaz/transporte/infraestructura y **2 aceptaciones con API real**, no mocks. AdminWeb: check completo y **3/3 pruebas**. Backend: check completo, **36 unitarias/HTTP/contrato y 70 integraciones reales**, sin omisiones. Las cuatro auditorías npm reportan cero vulnerabilidades. Modelos idénticos en Backend y tres clientes; temas y logos verificados, distribución de diseño/identidad comprobada.

Después del último ajuste de bordes efectivos y aislamiento del servidor E2E se repitieron lint, formato, build y regresión completa de interfaz: **45/45 por cliente y 3/3 AdminWeb**, satisfactorios. En esta repetición las dos aceptaciones reales se omiten por no definir el runner; sus cuatro ejecuciones satisfactorias (dos por cliente) constan en la pasada real anterior. No se confunden estas omisiones con pruebas ejecutadas. La comprobación de bordes/radios efectivos y tipografía se ejecuta en ambos temas; cierre global claro medido en el botón nativo: rgb(185, 28, 28), correspondiente al token action-danger.

Las primeras pasadas detectaron selectores de pruebas sobre elementos internos de Ionic y páginas cacheadas, además de un límite compartido por el nuevo caso de API. Se corrigió el arnés (selectores por página/host, aplicación de prueba aislada con los mismos límites, sin desactivar protecciones). Se amplió a 15 s la espera de aserciones por compilación inicial, sin reintentos automáticos. El servidor E2E desactiva prebundling/HMR para evitar recargas del optimizador de Vite compartido con los servidores de revisión del mismo checkout; no cambia el servidor del usuario ni la compilación de producción. La revisión del renderizado detectó bordes/radios por defecto de Ionic y referencias CSS circulares; se corrige la prioridad del componente y se comprueba el estilo efectivo, no solo los tokens.

Se añaden verificaciones de ID visible/copiado, negociación, enlaces numéricos, selección exacta de búsqueda, accesibilidad del tema, teclado, tamaños táctiles y navegación a 320/390/768/1280 px. Se mantienen privacidad, escape de texto, tokens solo en memoria/cookies, CSRF, errores, no reintentos inseguros, Unicode, zoom y contraste. La aceptación real usa PostgreSQL, SMTP y SeaweedFS locales aislados, incluido perfil público por enlace UUID anterior y estabilidad del número tras edición.

Las capturas sintéticas de las 13 pantallas en ambos temas se generan en `{web,mobile}/test-results/identity-*.png`, sin versionar datos personales, cookies, tokens ni capturas de cuentas reales. Se revisa la composición con REV4; una baseline visual definitiva se fija después de la aprobación del propietario, no mediante autoaprobación de nuevas imágenes.

## Límites y pendientes

- Pendiente la revisión funcional y aprobación visual definitiva del propietario.
- Pruebas de navegador no acreditan Android/iOS, teclado nativo ni almacenamiento seguro nativo: siguen diferidos a Fase 11.
- R2 de producción y entrega externa de correo siguen pendientes; esta aceptación utiliza servicios locales reales.
- No se declara certificación WCAG ni revisión humana completa con lectores de pantalla. Se verifica el alcance automatizado descrito.
- Se conservan las advertencias de presupuesto inicial de Angular y tamaño intrínseco de logos oficiales. No se amplían presupuestos ni se alteran PNG para ocultarlas.
- Angular 22.2.4 y TypeScript 6.0.3 mantienen las excepciones aprobadas; sin dependencias nuevas ni actualización mayor fuera de alcance.
