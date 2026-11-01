# Despliegue para demo

- **Frontend** (HTML/CSS/JS estático) → **Vercel**. No necesita React ni paso de build.
- **Backend** (FastAPI) + **Pasarela** (Node) + **PostgreSQL** → **Render**, creados juntos con [render.yaml](render.yaml).

Backend y pasarela comparten la misma base Postgres (la pasarela usa su propia tabla `pagos`).
El backend carga los datos iniciales (`database/*.sql`) solo la primera vez que arranca contra una base vacía.

## 1. Render (backend, pasarela y base de datos)

1. Entra a [render.com](https://render.com) → **Get Started** → **GitHub** (cuenta `Tiesol`).
2. **New → Blueprint** → conecta el repo `riseup-crowdfunding` → rama **`demo-tienda`**.
   Render lee `render.yaml` y muestra: `riseup-db`, `riseup-backend`, `riseup-gateway`.
3. Te pide las variables marcadas `sync: false`. Pon estas (si el nombre `.onrender.com` cambia, se corrige después):
   ```
   riseup-backend  GATEWAY_URL                = https://riseup-gateway.onrender.com/payments
   riseup-backend  FRONTEND_URL               = (déjalo vacío por ahora, paso 2.4)
   riseup-backend  BREVO_API_KEY              = (sección 3; puede ir vacío al inicio)
   riseup-backend  MAIL_FROM                  = (tu Gmail verificado en Brevo)
   riseup-gateway  CONFIRMATION_HOOK_ENDPOINT = https://riseup-backend.onrender.com/donations/confirm-payment
   ```
4. **Apply**. El primer deploy tarda 5–10 min. Cuando termine, comprueba:
   - `https://riseup-backend.onrender.com/health` → `{"status":"healthy"}`
   - `https://riseup-gateway.onrender.com/` → `{"ok":true,...}`
5. Si Render asignó otras URLs (por ejemplo `riseup-backend-x1y2.onrender.com`), corrígelas en las variables
   de arriba y en [FrontEnd/js/config.js](FrontEnd/js/config.js).

> **Plan gratis:** los servicios se duermen tras 15 min sin uso y la primera visita tarda ~50 s en despertarlos.
> Antes de la demo abre el sitio y `.../health` del backend 2–3 minutos antes. La base gratis expira a los 30 días.

## 2. Vercel (frontend)

1. **Create New → Project** → importa `riseup-crowdfunding`.
2. *Root Directory*: `FrontEnd` · *Framework Preset*: **Other** · sin Build Command → **Deploy**.
3. *Settings → Git → Production Branch*: **`demo-tienda`** → *Deployments* → **Redeploy**.
   [FrontEnd/vercel.json](FrontEnd/vercel.json) hace que `/login.html` sirva `pages/login.html`, igual que el nginx local.
4. Copia tu URL `https://xxx.vercel.app` a `FRONTEND_URL` en `riseup-backend` (Render → *Environment*). Se redespliega solo.

## 3. Correo real con Brevo (verificación al registrarse)

El backend envía por la API HTTP de Brevo cuando existe `BREVO_API_KEY`; si no, usa SMTP (`MAIL_SERVER`...), como en local con Mailtrap.

1. Crea una cuenta gratis en [brevo.com](https://www.brevo.com) (300 correos/día).
2. **Remitente**: *Settings → Senders, domains & dedicated IPs → Senders → Add a sender* con tu Gmail y confirma el código.
3. **API key**: *Settings → SMTP & API → API Keys → Generate a new API key* (empieza con `xkeysib-`).
4. En Render → `riseup-backend` → *Environment*: `BREVO_API_KEY` y `MAIL_FROM` (el Gmail verificado).
5. Prueba desde el celular: regístrate con un correo real → llega "Verifica tu cuenta" → el enlace activa la cuenta.
   Si no llega, revisa **Spam** y en Brevo *Transactional → Logs*.

## 4. Usuarios de demo (contraseña `test123`)

| Usuario | Rol |
|---|---|
| `admin@riseup.com` | Administrador (aprueba, observa y rechaza productos) |
| `juan@test.com` | Vendedor (tiene productos publicados) |
| `maria@test.com`, `carlos@test.com` | Compradores |

En el celular, en la página de pago usa **"Simular pago"** (el QR está pensado para escanearse desde otro teléfono).

## 5. Probar

```bash
API_URL=https://riseup-backend.onrender.com GATEWAY_URL=https://riseup-gateway.onrender.com python3 tests/smoke_test.py
```

La prueba crea un producto "Smoke test" y compras de prueba: **no la corras sobre la base de la demo justo antes de mostrarla.**

## Local

`docker compose up -d --build` levanta todo (Postgres, backend, pasarela y frontend en http://localhost:8080).
