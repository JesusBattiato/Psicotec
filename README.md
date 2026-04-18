# 📂 PSICOTEC — Carpeta Maestra del Proyecto
**Directora:** Lic. Noelia Yair Maza · MP. 149  
**Rubro:** Selección de Personal y Psicotécnicos Laborales  
**Ubicación:** Tartagal, Salta  
**Contacto:** 3873-351125 · @psicotec_consultora  

---

## 🗺️ Estructura

| Carpeta / Archivo | Descripción |
|---|---|
| `web/index.html` | 🌐 **Sitio web principal** — Landing + Formulario CV + 5 Templates + Empresas |
| `web/admin.html` | 🔒 **Panel admin de Yair** — Ver candidatos (Fase 2) |
| `web/assets/` | Imágenes, logo, fuentes locales |
| `docs/` | Documentación y planes del proyecto |

---

## 🚀 Estado del Proyecto

| Módulo | Estado | Notas |
|---|---|---|
| Landing page | ✅ Listo | Hero, Servicios, Footer |
| Formulario CV (5 pasos) | ✅ Listo | Datos personales → Habilidades |
| 5 templates de CV | ✅ Listo | Imprimir individual o todos |
| Sección Empresas | ✅ Listo | Formulario → WhatsApp |
| Panel admin (Yair) | ✅ Fase 1 | Lee localStorage — Fase 2: Supabase |
| Backend / Base de datos real | 🔜 Fase 2 | Requiere integración Supabase |

---

## 🛠️ Tecnologías

- **Frontend:** HTML5 + CSS3 + Vanilla JS  
- **Print/PDF:** `window.print()` nativo — sin dependencias externas  
- **Almacenamiento MVP:** `localStorage` (browser local)  
- **Almacenamiento Fase 2:** Supabase (PostgreSQL + Auth)  
- **Hosting sugerido:** GitHub Pages, Netlify o Vercel (gratis)  

---

## 📋 Notas para Yair

- Para abrir el sitio: doble click en `web/index.html`
- Los CVs que se completen quedan guardados en el browser donde se completaron
- Para ver los candidatos: abrí `web/admin.html` (contraseña inicial: `psicotec2026`)
- Para exportar la lista de candidatos: botón "Exportar CSV" en el panel admin

---

*Desarrollado por Punto Cero · 2026*
