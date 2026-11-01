import aiosmtplib
import httpx
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from app.core.config import settings

BREVO_URL = "https://api.brevo.com/v3/smtp/email"

STYLES = """
    body { font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 10px; padding: 40px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
    h1 { color: #FF7A59; text-align: center; }
    p { color: #333; line-height: 1.6; }
    .button { display: block; width: 200px; margin: 30px auto; padding: 15px 30px; background-color: #FF7A59; color: white; text-decoration: none; text-align: center; border-radius: 5px; font-weight: bold; }
    .features { background-color: #f9f9f9; padding: 20px; border-radius: 5px; margin: 20px 0; }
    .features ul { color: #555; }
    .footer { text-align: center; margin-top: 40px; color: #888; font-size: 12px; }
"""


def _layout(body: str) -> str:
    return f"""<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><style>{STYLES}</style></head>
<body>
  <div class="container">
    {body}
    <div class="footer"><p>&copy; 2026 RiseUp. Todos los derechos reservados.</p></div>
  </div>
</body>
</html>"""


async def _send_brevo(to_email: str, subject: str, html_content: str):
    async with httpx.AsyncClient(timeout=15) as client:
        response = await client.post(
            BREVO_URL,
            headers={"api-key": settings.BREVO_API_KEY, "accept": "application/json"},
            json={
                "sender": {"name": settings.MAIL_FROM_NAME, "email": settings.MAIL_FROM},
                "to": [{"email": to_email}],
                "subject": subject,
                "htmlContent": html_content,
            },
        )
        response.raise_for_status()


async def _send_smtp(to_email: str, subject: str, html_content: str):
    message = MIMEMultipart("alternative")
    message["From"] = f"{settings.MAIL_FROM_NAME} <{settings.MAIL_FROM}>"
    message["To"] = to_email
    message["Subject"] = subject
    message.attach(MIMEText(html_content, "html"))

    await aiosmtplib.send(
        message,
        hostname=settings.MAIL_SERVER,
        port=settings.MAIL_PORT,
        username=settings.MAIL_USERNAME,
        password=settings.MAIL_PASSWORD,
        start_tls=True,
    )


async def send_email(to_email: str, subject: str, html_content: str):
    # Brevo (API HTTP) si hay API key; si no, SMTP. Muchos hostings bloquean SMTP saliente.
    try:
        if settings.BREVO_API_KEY:
            await _send_brevo(to_email, subject, html_content)
        else:
            await _send_smtp(to_email, subject, html_content)
        return True
    except Exception as e:
        print(f"Error enviando email: {e}")
        return False


async def send_verification_email(to_email: str, first_name: str, verification_token: str):

    verification_link = f"{settings.FRONTEND_URL}/verify.html?token={verification_token}"

    html_content = _layout(f"""
    <h2 style="color: #FF7A59; text-align: center;">RiseUp</h2>
    <h1>¡Bienvenido a RiseUp!</h1>
    <p>Hola <strong>{first_name}</strong>,</p>
    <p>Gracias por registrarte en nuestra tienda en línea. Para completar tu registro y empezar a comprar o vender, verifica tu correo electrónico.</p>
    <a href="{verification_link}" class="button">Verificar mi cuenta</a>
    <p>Si no puedes hacer clic en el botón, copia y pega este enlace en tu navegador:</p>
    <p style="word-break: break-all; color: #FF7A59;">{verification_link}</p>
    <p>Este enlace expirará en 24 horas. Si no te registraste en RiseUp, ignora este correo.</p>
    """)

    return await send_email(to_email, "Verifica tu cuenta en RiseUp", html_content)


async def send_welcome_email(to_email: str, first_name: str):

    html_content = _layout(f"""
    <h1>¡Tu cuenta está activa!</h1>
    <p>Hola <strong>{first_name}</strong>,</p>
    <p>Tu cuenta en RiseUp fue verificada. Ya puedes usar todas las funciones de la tienda.</p>
    <div class="features">
      <p><strong>Con tu cuenta puedes:</strong></p>
      <ul>
        <li>Publicar y vender tus productos</li>
        <li>Comprar y pagar con QR</li>
        <li>Guardar productos en favoritos</li>
        <li>Ver el historial de tus compras</li>
      </ul>
    </div>
    <a href="{settings.FRONTEND_URL}/index-logged.html" class="button">Ir a la tienda</a>
    """)

    return await send_email(to_email, "¡Bienvenido a RiseUp!", html_content)
