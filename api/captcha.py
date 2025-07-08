import base64, json
from common import BASE, new_session_with_cookie, extract_verify_img

def handler(request):
    sess = new_session_with_cookie()
    html = sess.get(f"{BASE}/jsxsd/").text
    img_url = extract_verify_img(html)
    png = sess.get(img_url).content
    token = sess.cookies.get_dict().get("JSESSIONID")        # 保存给前端
    body = {
        "token": token,
        "img"  : "data:image/png;base64," + base64.b64encode(png).decode()
    }
    return {
        "statusCode": 200,
        "headers": {"Content-Type": "application/json"},
        "body": json.dumps(body)
    }
