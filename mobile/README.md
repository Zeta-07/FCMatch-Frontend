# FCMatch Móvil

Angular 22 + Ionic 9 + Capacitor 8. Aplicación independiente; reutiliza el sistema de diseño de los otros clientes.

```powershell
npm ci
npm start
```

Vista de desarrollo en `http://localhost:8100/inicio`. La Fase 0 implementa estructura, tema y comprobación de infraestructura. No incluye pantallas de cuentas ni torneos.

Configura `PUBLIC_API_BASE_URL` en `.env`. En un dispositivo físico usa una API HTTPS accesible, no `localhost`. La configuración pública se genera antes de servir o compilar; las credenciales nunca van al cliente.

`npm run check` ejecuta lint, formato, build y recorridos Playwright. `npx cap doctor` verifica las versiones de Capacitor. `capacitor.config.ts` define `webDir` y la identidad técnica móvil; `com.fcmatch.app` es un identificador técnico inicial documentado, no una publicación en tiendas.

Los proyectos nativos y compilaciones Android/iOS se prepararán al llegar a su validación nativa, prevista en la fase 11. Para esa fase: `npx cap add android`, `npx cap add ios` y `npm run native:sync`. iOS requiere macOS y Xcode. Los iconos nativos deberán usar el logo oficial; no se han generado iconos alternativos en Fase 0.

No se mantiene Ionic CLI en las dependencias: la versión estable consultada introduce dependencias obsoletas y vulnerabilidades sin corregir. Angular CLI compila Ionic y Capacitor CLI gestiona la integración nativa. Esta decisión no cambia Ionic Framework.
