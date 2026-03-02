




---

- Ultimo post card roll scroll para ver varios
- algo más de contraste 
---

# ADMIN
- Haz un estudio y auditoria a nivel UX/UI del admin panel.

Considera escenarios o posibles errores y busca la mejor manera de dar una buena experiencia al administrador de feedback y que el backend no rompa. Por ejemplo, un fallo de sync.
Mira cada pagina y añade posibles herramientas utiles para visualizar o manipular datos.
Cambia la estructura de las paginas de admin o borra alguna si lo consideras.
Haz mejoras esteticas y de experiencia de usuario de toda la admin page.
## Historial
- Grafico y mejor presentacion

---
✓ **COMPLETADO: Auditoria general del proyecto**
- Borrado: `app/admin/debug/page.tsx` (huerfano desde Settings consolidation)
- Refactorizado: Validacion numerica a `lib/validation.ts` (elimino duplicados en positions/capital)
- Bug fix: Estrategias ahora valida nombre no-vacio
- DRY: Middleware redirect (3 bloques → 1 loop)
- Cache fix: `revalidatePath("/")` en mutations de positions/capital/snapshots (homepage data stale)
- Prod reliability: Sync engine timeout 30s (AbortController) — evita bloqueo indefinido de cron
- Error boundary: `app/admin/error.tsx` para SSR failures