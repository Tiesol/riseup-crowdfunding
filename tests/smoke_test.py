"""Prueba de humo end-to-end contra el stack levantado con docker compose.

Uso:  docker compose up -d   &&   python3 tests/smoke_test.py
Variables opcionales: API_URL (default http://localhost:3000), GATEWAY_URL (default http://localhost:3002)
"""
import json
import os
import sys
import time
import urllib.error
import urllib.request

API = os.getenv("API_URL", "http://localhost:3000")
GATEWAY = os.getenv("GATEWAY_URL", "http://localhost:3002")
PASSWORD = "test123"  # usuarios seed de database/init.sql

results = []


def call(method, url, body=None, token=None):
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=15) as r:
            raw = r.read()
            return r.status, json.loads(raw) if raw else None
    except urllib.error.HTTPError as e:
        raw = e.read()
        try:
            return e.code, json.loads(raw)
        except ValueError:
            return e.code, raw.decode(errors="replace")


def api(method, path, body=None, token=None):
    return call(method, API + path, body, token)


def check(name, ok, detail=""):
    ok = bool(ok)
    results.append((name, ok))
    print(f"  {'PASS' if ok else 'FAIL'}  {name}" + (f"  -> {detail}" if not ok and detail else ""))
    return ok


def login(email):
    status, body = api("POST", "/auth/login", {"email": email, "password": PASSWORD})
    check(f"login {email}", status == 200, body)
    return body["token"] if status == 200 else None


def main():
    print("\n[1] Salud y datos públicos")
    check("GET /health", api("GET", "/health")[0] == 200)
    for path in ["/categories/", "/countries/", "/payment-methods/", "/campaigns/public",
                 "/campaigns/featured", "/campaigns/popular", "/campaigns/public/1"]:
        status, body = api("GET", path)
        check(f"GET {path}", status == 200, body)

    print("\n[2] Autenticación")
    admin = login("admin@riseup.com")
    juan = login("juan@test.com")
    maria = login("maria@test.com")
    if not (admin and juan and maria):
        sys.exit("No se pudo iniciar sesión con los usuarios seed; ¿la BD se inicializó con init.sql?")
    check("login con contraseña incorrecta -> 401",
          api("POST", "/auth/login", {"email": "juan@test.com", "password": "mala"})[0] == 401)
    email = f"nuevo{int(time.time())}@test.com"
    status, body = api("POST", "/auth/register", {"first_name": "Nuevo", "last_name": "Usuario",
                                                  "email": email, "password": PASSWORD, "country_id": 1})
    check("registro de usuario nuevo", status == 200, body)
    check("usuario sin verificar no puede entrar -> 403",
          api("POST", "/auth/login", {"email": email, "password": PASSWORD})[0] == 403)
    check("GET /auth/profile", api("GET", "/auth/profile", token=juan)[0] == 200)
    check("perfil sin token -> 401/403", api("GET", "/auth/profile")[0] in (401, 403))

    print("\n[3] Ciclo de vida de una campaña (borrador -> revisión -> publicada -> en progreso)")
    status, camp = api("POST", "/campaigns/", {"tittle": "Smoke test", "description": "Campaña de prueba",
                                               "goal_amount": 1000, "category_id": 1}, juan)
    if not check("crear campaña", status in (200, 201), camp):
        return
    cid = camp["id"]
    check("usuario normal no accede a /admin -> 403", api("GET", "/admin/campaigns", token=juan)[0] == 403)
    status, body = api("POST", f"/campaigns/{cid}/submit-for-review", token=juan)
    check("enviar a revisión", status == 200, body)
    status, body = api("POST", f"/admin/campaigns/{cid}/approve", {}, admin)
    check("admin aprueba", status == 200, body)
    status, body = api("POST", f"/campaigns/{cid}/start", token=juan)
    check("iniciar recaudación", status == 200, body)
    status, body = api("GET", f"/campaigns/public/{cid}")
    check("campaña visible públicamente", status == 200, body)

    print("\n[4] Recompensas y favoritos")
    status, body = api("POST", "/rewards/", {"tittle": "Gracias", "amount": 50, "stock": 10,
                                             "campaign_id": cid}, juan)
    check("crear recompensa", status in (200, 201), body)
    check("listar recompensas", api("GET", f"/rewards/campaign/{cid}")[0] == 200)
    status, body = api("POST", "/favorites/", {"campaign_id": cid}, maria)
    check("agregar favorito", status in (200, 201), body)
    status, body = api("GET", f"/favorites/check/{cid}", token=maria)
    check("favorito registrado", status == 200, body)
    check("quitar favorito", api("DELETE", f"/favorites/{cid}", token=maria)[0] == 200)

    print("\n[5] Pago vía pasarela")
    check("no puedes donar a tu propia campaña -> 400",
          api("POST", "/donations/", {"amount": 10, "campaign_id": cid, "payment_method_id": 1}, juan)[0] == 400)
    status, don = api("POST", "/donations/", {"amount": 100, "campaign_id": cid, "payment_method_id": 1}, maria)
    if not check("crear donación", status == 200, don):
        return
    check("sin confirmación de pago la donación NO queda Completada", don["donation_state_id"] != 2,
          "si la pasarela falla, el backend marca la donación como pagada sin cobrar")
    gateway_ok = check("la pasarela generó el pago (estado Pendiente)",
                       don.get("gateway_payment_id") and don["donation_state_id"] == 1, don)
    if gateway_ok:
        status, body = call("POST", f"{GATEWAY}/payments/{don['gateway_payment_id']}/confirm")
        check("confirmar pago en la pasarela", status == 200, body)
        time.sleep(1)
        status, body = api("GET", f"/donations/status/{don['id']}", token=maria)
        check("webhook marcó la donación como Completada", status == 200 and body.get("state_id") == 2, body)
        status, body = api("GET", f"/campaigns/public/{cid}")
        check("monto recaudado actualizado", status == 200 and float(body["current_amount"]) == 100.0, body)
    check("aparece en Mis Donaciones", any(d["id"] == don["id"] for d in api("GET", "/donations/my-donations", token=maria)[1]))

    print("\n[6] Seguridad del pago (deben PASAR antes de cobrar dinero real)")
    status, don2 = api("POST", "/donations/", {"amount": 5, "campaign_id": cid, "payment_method_id": 1}, maria)
    if status == 200 and don2.get("gateway_payment_id"):
        status, _ = api("POST", "/donations/confirm-payment", {"id": don2["gateway_payment_id"]})
        check("webhook confirm-payment rechaza llamadas sin firma/secreto", status in (401, 403),
              f"cualquiera puede marcar un pago como pagado (HTTP {status})")

    passed = sum(ok for _, ok in results)
    print(f"\nResultado: {passed}/{len(results)} pruebas pasaron")
    sys.exit(0 if passed == len(results) else 1)


if __name__ == "__main__":
    main()
