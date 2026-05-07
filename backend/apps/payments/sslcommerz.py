from urllib.parse import urlencode

from django.conf import settings
from urllib import parse, request
import json
import time


SSL_SANDBOX_URL = "https://sandbox.sslcommerz.com/gwprocess/v4/api.php"
SSL_LIVE_URL = "https://securepay.sslcommerz.com/gwprocess/v4/api.php"
SSL_VALIDATE_SANDBOX_URL = "https://sandbox.sslcommerz.com/validator/api/validationserverAPI.php"
SSL_VALIDATE_LIVE_URL = "https://securepay.sslcommerz.com/validator/api/validationserverAPI.php"


def _post_form(url, payload):
    encoded = urlencode(payload).encode("utf-8")
    req = request.Request(url, data=encoded, method="POST")
    req.add_header("Content-Type", "application/x-www-form-urlencoded")
    with request.urlopen(req, timeout=30) as response:
        return json.loads(response.read().decode("utf-8"))


def get_gateway_url():
    return SSL_SANDBOX_URL if settings.SSLCOMMERZ_SANDBOX else SSL_LIVE_URL


def get_validation_url():
    return SSL_VALIDATE_SANDBOX_URL if settings.SSLCOMMERZ_SANDBOX else SSL_VALIDATE_LIVE_URL


def build_session_payload(payment, request_user):
    employee = payment.employee
    timestamp = int(time.time())
    tran_id = f"PAY-{payment.id}-{timestamp}-{payment.payment_id.hex[:6].upper()}"

    return {
        "store_id": settings.SSLCOMMERZ_STORE_ID,
        "store_passwd": settings.SSLCOMMERZ_STORE_PASSWORD,
        "total_amount": str(payment.amount),
        "currency": "BDT",
        "tran_id": tran_id,
        "success_url": f"{settings.BACKEND_BASE_URL.rstrip('/')}/api/payments/sslcommerz/success/",
        "fail_url": f"{settings.BACKEND_BASE_URL.rstrip('/')}/api/payments/sslcommerz/fail/",
        "cancel_url": f"{settings.BACKEND_BASE_URL.rstrip('/')}/api/payments/sslcommerz/cancel/",
        "ipn_url": f"{settings.BACKEND_BASE_URL.rstrip('/')}/api/payments/sslcommerz/ipn/",
        "shipping_method": "NO",
        "product_name": payment.invoice_number or f"Invoice {payment.id}",
        "product_category": "Canteen Bill",
        "product_profile": "general",
        "cus_name": employee.name or request_user.get_full_name() or request_user.username,
        "cus_email": employee.email or request_user.email or "customer@canteen.local",
        "cus_add1": employee.department.department_name if employee.department else "Office",
        "cus_city": "Dhaka",
        "cus_country": "Bangladesh",
        "cus_phone": employee.phone or request_user.phone or "01700000000",
        "ship_name": employee.name or request_user.username,
        "ship_add1": "Office Canteen",
        "ship_city": "Dhaka",
        "ship_country": "Bangladesh",
        "value_a": str(payment.id),
        "value_b": str(employee.id),
        "value_c": payment.invoice_number or "",
        "value_d": settings.FRONTEND_APP_URL.rstrip("/"),
    }


def create_session(payment, request_user):
    payload = build_session_payload(payment, request_user)
    response = _post_form(get_gateway_url(), payload)
    return payload, response


def validate_payment(val_id):
    validation_url = (
        f"{get_validation_url()}?val_id={parse.quote(val_id)}"
        f"&store_id={parse.quote(settings.SSLCOMMERZ_STORE_ID)}"
        f"&store_passwd={parse.quote(settings.SSLCOMMERZ_STORE_PASSWORD)}&format=json"
    )
    with request.urlopen(validation_url, timeout=30) as response:
        return json.loads(response.read().decode("utf-8"))
