# Identidad — referencia visual y criterio editorial aprobado

El propietario aprobó REV4 para implementar exclusivamente la **Etapa 6 de Fase 1**. No es la Fase 6 de competición. Se conservan los PR #5 abiertos, sin merge ni Etapa 7. Publicación autorizada únicamente tras verificaciones satisfactorias.

Referencia: [FCMatch — Identidad en Stitch](https://stitch.withgoogle.com/projects/12444931324029253224). Las capturas y HTML de Stitch son referencias visuales, **no código ni copy de producción**. No se solicitan más generaciones para ajustes editoriales. Los exports REV2/REV3 históricos no se alteran.

## Aplicación a las 52 referencias

Cada fila cubre Web oscuro, Web claro, Móvil oscuro y Móvil claro (13 × 4). Los textos institucionales, promocionales, decorativos, etiquetas de revisión y afirmaciones de funciones inexistentes se descartan en todas las variantes. No se copian HTML, Tailwind, recursos externos ni scripts generados por Stitch.

| Flujo                  | Ruta                       | Contenido funcional                                                      |
| ---------------------- | -------------------------- | ------------------------------------------------------------------------ |
| Acceso                 | `/iniciar-sesion`          | Logo, título, correo, contraseña, Entrar y enlaces de cuenta             |
| Registro               | `/registro`                | Logo, título, usuario, correo, contraseña, Crear cuenta e Iniciar sesión |
| Verificación           | `/verificar-correo`        | Acción explícita, vencimiento y reenvío mediante correo                  |
| Recuperación           | `/recuperar-contrasena`    | Correo y Enviar enlace                                                   |
| Restablecer contraseña | `/restablecer-contrasena`  | Nueva contraseña, repetición y aviso de cierre de sesiones               |
| Cambiar contraseña     | `/cambiar-contrasena`      | Contraseña actual, nueva, repetición y aviso de cierre                   |
| Mi perfil              | `/perfil`                  | Datos propios reales, correo Privado, ID copiable y edición              |
| Editar perfil          | `/editar-perfil`           | Foto, usuario, liga opcional, ID no editable y acciones                  |
| Búsqueda               | `/buscar`                  | Usuario, ayuda mínima, resultados reales y paginación por cursor         |
| Perfil público         | `/usuarios/:publicId`      | Perfil real sin correo ni información de sesión                          |
| Ajustes                | `/ajustes`                 | Cuenta y Sesiones; tema únicamente en cabecera                           |
| Cambiar correo         | `/cambiar-correo`          | Correo actual privado, nuevo y contraseña actual                         |
| Confirmar correo nuevo | `/confirmar-cambio-correo` | Confirmación explícita del titular; sesión necesaria                     |

## Reglas de redacción

- Acceso y registro no tienen columnas promocionales, párrafos, sellos ni eslóganes. El espacio vacío es intencional.
- Contraseña nueva: **12–128 caracteres Unicode**, sin requisitos de composición. Se envía sin trim, normalización ni truncamiento; la API valida siempre. Las contraseñas actuales no heredan ese mínimo retroactivamente.
- Usuario: 3–30 caracteres ASCII de letras, números o `_`. Búsqueda: prefijo de 2–30. Liga: hasta 100 caracteres, vacía se envía como `null` para quitarla.
- Foto: JPG/JPEG, PNG o WebP, hasta 5 MiB. La validación de MIME/imagen y los permisos pertenecen al Backend, no al atributo `accept` del navegador.
- Tras una solicitud aceptada de correo: «Si corresponde, recibirás un correo. La recepción no está garantizada.». No aparece antes del envío ni confirma existencia de una cuenta o entrega externa.
- Cambiar/restablecer contraseña cierra todas las sesiones, incluida la actual. Cambiar correo **no** las revoca.
- Correo mostrado solo al titular, marcado Privado. Sin sellos de identidad, estado en línea, métricas ficticias, dispositivos inventados ni afirmaciones técnicas de seguridad en la interfaz.
- Estadísticas e historial son estados vacíos hasta las fases de competición: «Aún no disponibles.» / «Sin torneos finalizados.». No se calculan métricas ni se fabrican ceros.

## Estructura y límites

Angular + Ionic con estilos basados exclusivamente en variables CSS. Se mantienen los originales de ambos logos y los temas compartidos idénticos con AdminWeb. Las fuentes de identidad se distribuyen por copia versionada con `scripts/sync-identity.mjs`; las aplicaciones conservan configuración y rutas propias, sin imports de fuentes entre ellas.

Web: navegación superior. Móvil en navegador: pestañas temporales Mi perfil, Buscar y Ajustes para el alcance de identidad; no se anticipan pestañas de módulos futuros. Los subformularios no muestran las pestañas. AdminWeb recibe solo mantenimiento compatible, nunca estas pantallas.

Las implementaciones y pruebas, no las afirmaciones de Stitch, determinan la accesibilidad y el comportamiento. La verificación de navegador no acredita validación Android/iOS, almacenamiento seguro nativo, correo externo o Cloudflare R2. Estas aceptaciones siguen diferidas según el plan aprobado.

## Correcciones posteriores a la revisión del propietario

Plan de correcciones aprobado: composición más próxima a REV4 sin copiar su HTML, botón luna/sol único en cabecera, perfil compacto y Ajustes con filas Ionic. ID público visible exclusivamente numérico de ocho dígitos; los UUID y enlaces anteriores se mantienen solo para compatibilidad. La nueva representación se solicita explícitamente por Accept; ver Backend DT-015 y Frontend DT-013. No implica aprobación visual definitiva ni autoriza Etapa 7. Las capturas actuales serán material de revisión: una baseline visual definitiva requiere aprobación del propietario, no se autoaprueba por generarla.

## Verificación histórica anterior a estas correcciones

- `npm run check` en `web/` y `mobile/` (lint, formato, build y Playwright): 42 pruebas en verde y 2 omitidas por diseño (aceptación real) en cada aplicación.
- `scripts/sync-identity.mjs --check` y `scripts/sync-design.mjs --check`: fuentes de identidad y temas idénticos entre Web y Móvil; `themes.scss` coincide con el de AdminWeb.
- Aceptación real con `FCMATCH_E2E_API_RUNNER` sobre PostgreSQL, SMTP y S3 locales: 2/2 en Web y 2/2 en Móvil. Requiere `PUBLIC_API_BASE_URL=http://localhost:3006/api/v1`; Móvil usa `FCMATCH_E2E_PORT=4301`, incluido en `CORS_ORIGINS`.
- Las capturas de las 13 pantallas en ambos temas se generan en `test-results/` durante las pruebas y no se versionan.
