# Etapa 6 — dos remates móviles para revisión de cierre

## Ampliación solicitada: retroceso también en Web Cliente

El propietario aclara que el regreso desde Buscar usuarios debe funcionar también en Web. Se eliminan exclusivamente las condiciones que limitaban la instantánea/restauración y la flecha a móvil. Ambos clientes usan ahora el mecanismo existente, sin cambiar el comportamiento móvil ni añadir estilos. El alcance y resultados siguientes describen la entrega móvil anterior; esta ampliación se verifica de forma dirigida, sin repetir sus baterías completas locales ni aceptaciones reales.

Pruebas dirigidas: Web 13/13 y móvil 9/9, incluyendo regreso por cabecera/navegador, conservación de consulta/borrador/páginas/cursor y scroll (5px), sin refetch, y Mi perfil intacto. Web cubre 320/768/1280px y móvil 390px, en claro y oscuro; se comprueban además búsqueda, contraste, perfil público y cabecera. Lint, formato, build y auditoría correctos en ambos; cero vulnerabilidades. Las capturas esperan a que termine la transición Ionic antes de su revisión. Sin cambios de diseño, temas, API, dependencias, Backend o AdminWeb.

## Alcance

1. Perfil abierto desde búsqueda móvil: retroceso nativo Ionic en cabecera, sin alterar Mi perfil. Regreso por pila con respaldo /buscar y restauración de consulta enviada, borrador del campo, páginas, cursor y posición cuando el contenido lo permita.
2. Editar perfil móvil: solo ajuste de padding, margen y ancho hasta 768px para aprovechar el espacio disponible. Se mantienen campos, botones, validaciones y comportamiento.

Web comparte fuentes por copia versionada, pero conserva su navegación y diseño. No hay cambios de API, migraciones, Backend, AdminWeb, temas, logos ni tarjetas de Estadísticas/Historial. La instantánea de búsqueda es única, en memoria y ligada a sesión; no persiste datos entre recargas o sesiones. Un acceso directo a un perfil no inventa resultados anteriores. Se descartan respuestas de búsquedas abandonadas para no reemplazar la vista al volver.

## Verificación

Verificación final satisfactoria con npm run check en ambos clientes: móvil 54/54 y Web 52 correctas + 2 omitidas intencionalmente por ser exclusivas de navegación móvil. Cada batería incluye sus 2 pruebas de aceptación con API/PostgreSQL/SMTP/SeaweedFS locales reales; las demás cubren regresiones con respuestas controladas e infraestructura. Lint, formato y build correctos; npm audit sin vulnerabilidades en ambos clientes. Fuentes compartidas y sistema de diseño verificados sincronizados, también con AdminWeb.

Las pruebas cubren regreso con cabecera y navegador, consulta/borrador distintos, páginas y cursor conservados, no repetir solicitudes al regresar, posición en lista larga (tolerancia de 5px), ausencia de retroceso en Mi perfil y ancho sin desbordamiento a 320/360/390/768px en ambos temas. Capturas sintéticas revisadas en oscuro y claro quedan en test-results, sin datos de usuarios reales. Las tarjetas aprobadas de Estadísticas/Historial conservan su plantilla idéntica.

Backend y AdminWeb permanecen sin cambios: se conservan sus resultados válidos y se consulta su CI remoto, sin repetir sus baterías. La medida de ancho útil usa el contenedor ion-input (borde del campo); el input nativo conserva su padding interno aprobado. La actualización estable de herramientas dev requirió descargar el Chromium correspondiente a Playwright; no implica una compilación nativa ni modifica las aplicaciones.

Advertencias de bundle y tamaño intrínseco de logos oficiales permanecen visibles. No se afirma certificación WCAG ni validación Android/iOS. R2 y SMTP externos/almacenamiento seguro nativo siguen diferidos. PR #5 abierto, sin merge ni Etapa 7; cierre definitivo pendiente de la revisión del propietario.
