# Despliegue para demo

- **Frontend** (HTML/CSS/JS estático) → **Vercel**. No necesita React ni paso de build.
- **Backend** (FastAPI) + **PostgreSQL** + **Pasarela** (Node) + **MySQL** → **Railway**, todo en un mismo proyecto.

Tiempo estimado: 30–40 min.

## 1. Railway (backend, pasarela y bases de datos)

1. Entra a [railway.com](https://railway.com) con GitHub → **New Project** → **Deploy from GitHub repo** → `Tiesol/riseup-crowdfunding`.
2. En el proyecto: **+ New → Database → PostgreSQL** y **+ New → Database → MySQL**.
3. **Cargar los datos iniciales** (desde tu PC; copia las URLs públicas de la pestaña *Connect* de cada base):
   ```bash
   psql "<POSTGRES_PUBLIC_URL>" -f database/init.sql
   psql "<POSTGRES_PUBLIC_URL>" -f database/add_requirements.sql
   mysql -h <MYSQL_HOST> -P <MYSQL_PORT> -u root -p<MYSQL_PASSWORD> < payment-gateway/Database/database.sql
   ```
4. **Servicio `backend`**: Settings → *Source* rama **`demo-tienda`** · *Root Directory* `/backend` → *Networking* → **Generate Domain** (puerto 8000).
   Variables:
   ```
   DATABASE_URL=${{Postgres.DATABASE_URL}}
   JWT_SECRET_KEY=<cadena aleatoria nueva>
   JWT_ALGORITHM=HS256
   JWT_EXPIRATION_HOURS=24
   FRONTEND_URL=https://<tu-proyecto>.vercel.app
   GATEWAY_URL=https://<dominio-gateway>.up.railway.app/payments
   BREVO_API_KEY=<API key de Brevo, ver sección 3>
   MAIL_FROM=<el correo que verificaste en Brevo>
   MAIL_FROM_NAME=RiseUp
   ```
5. **Servicio `gateway`** (+ New → GitHub repo, el mismo repo): rama **`demo-tienda`** · *Root Directory* `/payment-gateway/Gateway` → **Generate Domain** (puerto 3000).
   Variables:
   ```
   PORT=3000
   DB_HOST=${{MySQL.MYSQLHOST}}
   DB_PORT=${{MySQL.MYSQLPORT}}
   DB_USER=${{MySQL.MYSQLUSER}}
   DB_PASSWORD=${{MySQL.MYSQLPASSWORD}}
   DB_NAME=payments_db
   PUBLIC_URL=https://<dominio-gateway>.up.railway.app/
   CONFIRMATION_HOOK_ENDPOINT=https://<dominio-backend>.up.railway.app/donations/confirm-payment
   ```
6. Comprueba que `https://<dominio-backend>.up.railway.app/health` responde `{"status":"healthy"}`.

## 2. Vercel (frontend)

1. Pon los dominios de Railway en [FrontEnd/js/config.js](FrontEnd/js/config.js) (`RISEUP-BACKEND` y `RISEUP-GATEWAY`), haz commit y push.
2. Entra a [vercel.com](https://vercel.com) → **Add New → Project** → importa el repo.
3. *Root Directory*: `FrontEnd` · *Framework Preset*: **Other** · sin Build Command. Luego en *Settings → Git → Production Branch* pon **`demo-tienda`** y redeploy.
4. Deploy. [FrontEnd/vercel.json](FrontEnd/vercel.json) hace que `/login.html` sirva `pages/login.html`, igual que el nginx local.
5. Copia la URL de Vercel a `FRONTEND_URL` en el backend de Railway (se redespliega solo).

## 3. Correo real con Brevo (verificación al registrarse)

El backend envía por la API HTTP de Brevo cuando existe `BREVO_API_KEY` (los hostings suelen bloquear SMTP); si no existe, usa SMTP (`MAIL_SERVER`...), como en local con Mailtrap.

1. Crea una cuenta gratis en [brevo.com](https://www.brevo.com) (300 correos/día).
2. **Remitente**: *Settings → Senders, domains & dedicated IPs → Senders → Add a sender* con tu Gmail. Brevo te manda un código: confírmalo.
3. **API key**: *Settings → SMTP & API → API Keys → Generate a new API key*. Cópiala (empieza con `xkeysib-`).
4. En Railway (servicio `backend`) pon `BREVO_API_KEY`, `MAIL_FROM` (el Gmail verificado) y `MAIL_FROM_NAME`.
5. Prueba: regístrate desde el celular con un correo real → llega "Verifica tu cuenta" → el enlace abre `verify.html` y activa la cuenta.
   Si no llega, revisa **Spam** y en Brevo *Transactional → Logs*.

## 4. Usuarios de demo (contraseña `test123`)

| Usuario | Rol |
|---|---|
| `admin@riseup.com` | Administrador (aprueba, observa y rechaza productos) |
| `juan@test.com` | Vendedor (tiene productos publicados) |
| `maria@test.com`, `carlos@test.com` | Compradores |

## 5. Probar

```bash
API_URL=https://<dominio-backend>.up.railway.app GATEWAY_URL=https://<dominio-gateway>.up.railway.app python3 tests/smoke_test.py
```

La prueba crea un producto "Smoke test" y compras de prueba: **no la corras sobre la base de la demo justo antes de mostrarla.**
