# Tareas Pendientes

## UX / UI

- Ultimo post card: roll/scroll horizontal para ver varios
- Acceder a cuenta fuera de hamburguesa en movil (mas visible)
- Pagina de fallback/agradecimiento tras comprar suscripcion

## Admin

- Auditoria UX/UI del admin panel:
  - Escenarios de error (ej. fallo de sync) y feedback al administrador
  - Herramientas utiles para visualizar/manipular datos en cada pagina
  - Reestructurar paginas o borrar si sobran
  - Mejoras esteticas y de experiencia
- Historial: grafico y mejor presentacion

## Email / Branding

- Configurar Resend como custom SMTP en Supabase para:
  - Sender name: "Chamillion" (en vez de "Supabase Auth")
  - Sender email: hola@chamillion.site
  - Registros SPF/DKIM en DNS de chamillion.site
  - Resuelve regla 22 de SECURITY.md

## Seguridad

- Rate limiting en API routes (reglas 14-15 de SECURITY.md)
- Audit log explicito cuando webhook cambia role de usuario (regla 26)
- Probar restauracion de backup de Supabase al menos una vez (regla 28)
