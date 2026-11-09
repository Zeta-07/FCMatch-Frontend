# FCMatch Frontend — Fase 0

## Skills OpenCode compartidas

`opencode.json` carga seis skills revisadas desde un catálogo público de Backend fijado a un commit, tanto en `web/` como en `mobile/`. No requiere copiar archivos ni configurar rutas personales. [Guía canónica, procedencia y política](https://github.com/Zeta-07/FCMatch-Backend/blob/ab1501182f034bde2c248ffea1e7205be8a3f472/docs/skills-opencode.md). La descarga inicial requiere OpenCode V2 y acceso HTTPS a GitHub; no autoriza iniciar Fase 1.

La evidencia común se mantiene en el [informe versionado del backend](https://github.com/Zeta-07/FCMatch-Backend/blob/feature/fase-0/docs/fase-0-verificacion.md).

Dos aplicaciones Angular + Ionic independientes: `web/` y `mobile/`. Cada una tiene su paquete, lockfile, configuración y pruebas. AdminWeb vive en su propio repositorio.

## Ejecutar

Requiere Node.js 26.13.0 LTS y npm 12.2.1. En el espacio de trabajo original, activa herramientas con `. ../tooling/activate.ps1`. Inicia previamente la API y PostgreSQL siguiendo el README del backend.

```powershell
npm --prefix web ci
npm --prefix mobile ci
npm --prefix web start
```

En otra terminal: `npm --prefix mobile start`.

## Diseño compartido

- Fuente de tokens y estilos: `web/src/styles/themes.scss` y `responsive.scss`.
- Fuente de componentes comunes: `design-system/components/` (logo, alternador de tema y estado técnico).
- Fuente de herramientas de cliente: `client-tooling/`.
- Distribución: `node scripts/sync-design.mjs`.
- Comprobación: `node scripts/sync-design.mjs --check`.
- AdminWeb: `node scripts/sync-design.mjs --target ../FCMatch-AdminWeb` desde este repositorio, revisando sus cambios por separado.

La distribución copia fuentes controladas; el código compilado de cada aplicación solo importa sus archivos locales. No existen symlinks, submódulos ni imports entre repositorios. El consumidor AdminWeb puede compilar de forma independiente. Cambiar rutas o pantallas de un cliente no modifica los otros.

Los tipos de API proceden del OpenAPI del backend y se distribuyen con `tooling/sync-api.mjs` del espacio de trabajo. Se mantienen idénticos en `src/app/core/api/types.gen.ts` de los tres clientes.

## Pruebas y CI

Cada cliente ejecuta `npm run check` desde su carpeta. Las pruebas locales usan API y PostgreSQL reales. Cubren conectividad, error y reintento, logo original, ancho móvil y persistencia de ambos temas.

El workflow propio usa una matriz web/móvil. Para no depender de checkout ni credenciales de otro repositorio, **solo en CI** se intercepta `/health` con el contrato esperado (`FCMATCH_E2E_STUB_API=1`). Esto comprueba el cliente, no certifica PostgreSQL; la integración real se prueba en el backend y se ha probado localmente desde cada cliente.

Se han retirado los ejemplos generados por Angular. No hay funcionalidad de fases posteriores. Las dependencias transitivas corregidas y la excepción compatible de TypeScript están documentadas en `docs/decisiones.md`.
