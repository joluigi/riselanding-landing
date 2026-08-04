# QA manual del tracking rl_* (Fases 1–3)

Pasos que requieren navegador + GTM Preview y no pudieron automatizarse. Correr sobre `vercel dev` (requiere `vercel login` + `vercel link` la primera vez) o sobre un preview deploy (push de la rama a GitHub genera preview en Vercel — el preview además permite verificar la cookie `rl_geo`, que en local no existe porque no hay header geo).

Prerequisito para los pasos de tags: contenedor `GTM_riselanding_tracking_v2.1.1.json` importado en un workspace de GTM-P3WZC7MV (Combinar, no Sobrescribir) y GTM Preview (Tag Assistant) conectado a la URL de prueba.

```
[ ] 1. Cargar la home con ?gclid=test123 en ventana privada (sin cookies):
      - rl_context_ready es el PRIMER evento rl_* · 4 bloques completos · traffic.gclid = 'test123'.
[ ] 2. Recargar la misma pestaña: session_count y touch_count NO suben.
[ ] 3. Cerrar y reabrir el navegador (mismo perfil): first_touch intacto,
      session_count +1, is_returning true.
[ ] 4. Cargar con ?rl_internal=1: NINGÚN tag dispara (G1). Recargar sin el
      parámetro: sigue bloqueado (cookie persistente).
[ ] 5. Scroll completo: rl_scroll_depth una vez por umbral 25/50/75/90;
      el tag GA4 - scroll solo dispara en 50 y 90.
[ ] 6. 45 s visibles + scroll ≥50% + 2 interacciones en elementos interactivos:
      rl_engaged_session dispara UNA vez. Con la pestaña oculta el tiempo no avanza.
[ ] 7. #servicios visible ≥20 s: rl_service_view con dwell_time_sec ≈ 20.
      REPETIR EN UN TELÉFONO REAL (la sección es más alta que el viewport;
      valida el fix de visibilidad por mitad de pantalla).
[ ] 8. Recorrer #resultados al 75%: rl_case_study_view (case_id 'resultados_home').
[ ] 9. Foco en un campo del form: rl_form_start una sola vez.
[ ] 10. Enviar con requeridos vacíos: rl_form_error (error_type 'validation',
      error_field correcto).
[ ] 11. Enviar con email @gmail.com y SIN empresa: rl_lead_submit con
      lead_tier 'C', flag 'clean' · GA4 generate_lead dispara · NINGÚN tag de
      Google Ads dispara (G3) · Meta - Lead SÍ dispara (comportamiento correcto:
      G-3 aplica solo a Ads según la guía §2.5).
[ ] 12. Honeypot lleno (consola: document.getElementById('f-hp').value='x'):
      flag 'spam', score 0 · ningún tag de Ads NI Meta (G2) · GA4 sí lo recibe.
[ ] 13. Envío real de prueba: user_data con 2 hashes de 64 hex; el correo y
      teléfono JAMÁS aparecen en claro en el dataLayer. (Aviso: llega a
      n8n/Notion como lead de prueba — borrar después.)
[ ] 14. Tras el envío, cruzar otro umbral de scroll: ese rl_scroll_depth no
      arrastra claves del lead (reset C-13).
[ ] 15. Solo en preview deploy: DevTools → Application → Cookies: rl_geo existe
      con el país, sin Max-Age (cookie de sesión). Con VPN/override EEA (p. ej.
      DE): consent default 'denied' en los 4 permisos ANTES del snippet GTM y
      user.consent_state 'denied'.
```

Generado en la QA de la rama `feat/rl-tracking` (2026-08-03). Los detalles de diseño están en `docs/superpowers/specs/2026-08-03-rl-tracking-fases-1-3-design.md`.
