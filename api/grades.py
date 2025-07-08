import json
from common import BASE, new_session_with_cookie, parse_course_list

def handler(request):
    if request.method != "POST":
        return {"statusCode": 405, "body": "Method Not Allowed"}
    cookie = request.json().get("cookie")
    if not cookie:
        return {"statusCode": 400, "body": "missing cookie"}

    sess = new_session_with_cookie()
    sess.headers["cookie"] = cookie

    html = sess.get(f"{BASE}/jsxsd/kscj/cjcx_list").text
    courses = list(parse_course_list(html))
    return {
        "statusCode": 200,
        "headers": {"Content-Type": "application/json"},
        "body": json.dumps(courses, ensure_ascii=False)
    }
