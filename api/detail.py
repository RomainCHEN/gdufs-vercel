import json, urllib.parse
from common import BASE, new_session_with_cookie, parse_detail

def handler(request):
    if request.method != "POST":
        return {"statusCode": 405, "body": "Method Not Allowed"}

    data = request.json()
    cookie  = data.get("cookie")
    relurl  = urllib.parse.unquote(data.get("relurl",""))
    if not (cookie and relurl):
        return {"statusCode": 400, "body": "missing params"}

    sess = new_session_with_cookie()
    sess.headers["cookie"] = cookie
    html = sess.get(BASE + relurl).text
    rows = list(parse_detail(html))
    return {
        "statusCode": 200,
        "headers": {"Content-Type": "application/json"},
        "body": json.dumps(rows, ensure_ascii=False)
    }
