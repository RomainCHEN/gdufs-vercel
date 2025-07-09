# File: api/login.py  —— 完整覆盖
import json, requests
from urllib.parse import urljoin

BASE = "https://jxgl.gdufs.edu.cn"          # 教务系统根

def handler(request):
    if request.method != "POST":
        return {"statusCode": 405, "body": "Method Not Allowed"}

    data = request.json()
    token = data.get("token")               # 来自 /api/captcha
    user  = data.get("username")
    pwd   = data.get("password")
    code  = data.get("captcha")

    if not all([token, user, pwd, code]):
        return {"statusCode": 400, "body": "missing fields"}

    # ① 用同一 JSESSIONID 建 session
    sess = requests.Session()
    sess.cookies.set("JSESSIONID", token, domain="jxgl.gdufs.edu.cn")

    # ② 发送登录表单
    login_url = urljoin(BASE, "/jsxsd/xk/LoginToXkLdap")
    payload   = {
        "USERNAME":   user,
        "PASSWORD":   pwd,
        "RANDOMCODE": code,
    }

    # allow_redirects=False 方便用 302 判断是否成功
    r = sess.post(login_url, data=payload, allow_redirects=False, timeout=10)

    if r.status_code not in (302, 303):
        return {"statusCode": 401,
                "headers": {"Content-Type": "application/json"},
                "body": json.dumps({"error": "学号/密码/验证码错误"})}

    # ③ 登录成功：把所有 cookie 打包给前端
    cookie_str = "; ".join(f"{k}={v}" for k, v in sess.cookies.get_dict().items())
    return {
        "statusCode": 200,
        "headers": {"Content-Type": "application/json"},
        "body": json.dumps({"cookie": cookie_str})
    }
