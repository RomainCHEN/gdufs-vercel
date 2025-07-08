import json
from common import BASE, new_session_with_cookie

def handler(request):
    if request.method != "POST":
        return {"statusCode": 405, "body": "Method Not Allowed"}

    data = request.json()
    token   = data.get("token")
    user    = data.get("username")
    pwd     = data.get("password")
    vcode   = data.get("captcha")

    if not all([token, user, pwd, vcode]):
        return {"statusCode": 400, "body": "missing fields"}

    sess = new_session_with_cookie(token)

    payload = {
        "userAccount" : user,        # 若字段名不同，请抓包替换
        "userPassword": pwd,
        "RANDOMCODE"  : vcode,
    }
    r = sess.post(f"{BASE}/jsxsd/xk/LoginToXk", data=payload, allow_redirects=False)
    if r.status_code not in (302, 303):
        return {"statusCode": 401, "body": json.dumps({"error":"登录失败"})}

    # 登录成功——把完整 cookie 字符串发回前端
    cookie_str = "; ".join(f"{k}={v}" for k,v in sess.cookies.get_dict().items())
    return {
        "statusCode": 200,
        "headers": {"Content-Type": "application/json"},
        "body": json.dumps({"cookie": cookie_str})
    }
