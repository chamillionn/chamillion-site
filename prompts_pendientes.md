# Tareas Pendientes


## UX / UI

- Ultimo post card: roll/scroll horizontal para ver varios
- Pagina de fallback/agradecimiento tras comprar suscripcion
- Revisa los wiidgets y añadeles favicon

## Hub — Kronos (análisis financiero)

- Integrar interfaz en /hub para interactuar con Kronos (modelo de predicción de velas financieras)
- Endpoint Modal desplegado: `https://chamillionn--kronos-predictor-kronosservice-api.modal.run`
- Script de deploy: `scripts/kronos_modal.py`
- El endpoint acepta POST con datos OHLCV y devuelve forecast de velas futuras
- UI pendiente: input de activo/timeframe, visualización de velas predichas en chart



## SEO
- Revision general.
## Admin



## Email / Branding

> Resend
  Configurar Resend como custom SMTP en Supabase para:
    - Sender name: "Chamillion" (en vez de "Supabase Auth")
    - Sender email: hola@chamillion.site
    - Registros SPF/DKIM en DNS de chamillion.site
    - Resuelve regla 22 de SECURITY.md

## Seguridad

- Rate limiting en API routes (reglas 14-15 de SECURITY.md)
- Audit log explicito cuando webhook cambia role de usuario (regla 26)
- Probar restauracion de backup de Supabase al menos una vez (regla 28)

