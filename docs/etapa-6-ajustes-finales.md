# Etapa 6 — ajustes finales de búsqueda y perfil

## Alcance autorizado

Búsqueda unificada manual por usuario o ID público, etiqueta discreta «Tú» y retirada exclusiva del botón Ajustes dentro de Mi perfil. Las tarjetas Estadísticas e Historial, su plantilla, tamaños, distribución y estilos se conservan; no cambia el resto del diseño, logos, temas ni navegación principal. Sin Etapa 7 ni merge de los PR #5.

## Comportamiento

- Un campo «Usuario o ID público», sin pestañas. Solo botón Buscar o Enter envían la consulta; escribir, borrar o salir del campo no consulta la API.
- El backend combina prefijo de username y, para ocho dígitos válidos, ID exacto; no se mezclan dos paginaciones en el cliente. Ceros iniciales siguen siendo usernames válidos para búsqueda.
- Cargar más conserva la última consulta enviada, aunque se edite el campo. Un nuevo envío reinicia resultados y cursor. Defensa adicional frente a duplicados en el cliente por publicNumber.
- No se excluye al titular. «Tú» se calcula por igualdad del ID numérico con el perfil autenticado, solo como presentación, nunca como permiso. Si falta el perfil en memoria se obtiene al enviar la búsqueda, no al escribir; se respeta la revisión de sesión antes de actualizarlo.
- Se conservan navegación, Editar perfil, validación, teclado, carga, errores y mensajes mínimos en español.

## Compatibilidad

Nuevo filtro query en el mismo GET /users, excluyente con search/publicNumber. Los filtros anteriores conservan significado, respuestas y cursores. La representación numérica opt-in no cambia. Contrato y modelos sincronizados con AdminWeb, sin incorporar pantallas allí. Backend DT-016 y Frontend DT-014 documentan las decisiones.

## Verificación

Resultados finales satisfactorios: **50/50 pruebas en Web y 50/50 en móvil**, sin fallos ni omisiones. Por cliente son 48 comprobaciones de interfaz/transporte/infraestructura y 2 aceptaciones con API, PostgreSQL, SMTP y SeaweedFS locales reales. Backend: **36 unitarias/HTTP/contrato y 71 integraciones reales**. AdminWeb: **3/3** y check de mantenimiento. Lint, formato, build y OpenAPI correctos; cuatro auditorías npm sin vulnerabilidades reportadas.

Se verifican con PostgreSQL real la ambigüedad numérica, deduplicación, titular, ceros iniciales, normalización, páginas y cursores firmados de distintos modos/consultas. Playwright cubre envío manual, Enter, ausencia de pestañas, paginación de consulta enviada, Tú, contraste efectivo de controles en ambos temas, navegación y regresiones de identidad. Las aceptaciones reales incluyen Tú y búsqueda por ID mediante Enter. El contraste de texto de los controles visibles de búsqueda supera 4.5:1 en ambos temas sin modificar los tokens ni la paleta. Plantilla de Estadísticas/Historial idéntica a la entrega anterior y ningún cambio en sus estilos.

Recuperación tras interrupción: se contrastaron los registros completos de las ejecuciones locales del 13/11/2026 (Backend terminó 16:15; Web/móvil 16:21; AdminWeb 16:13) con los archivos actuales, todos guardados antes de sus respectivas pruebas. No se repitieron las baterías costosas: solo validación ligera de documentación, sincronización, diferencias y publicación/CI remoto. La aprobación visual definitiva de Etapa 6 sigue pendiente del propietario.

No se declara certificación WCAG ni validación nativa. Persisten los límites ya documentados: Android/iOS y almacenamiento seguro nativo, R2 de producción y SMTP externo diferidos; advertencias de bundle y dimensiones intrínsecas del logo sin ocultar ni modificar PNG.
