"""
被多个函数共享的工具 & 常量
"""
import requests, re
from bs4 import BeautifulSoup

BASE = "https://jxgl.gdufs.edu.cn"

def new_session_with_cookie(jcookie: str | None = None) -> requests.Session:
    s = requests.Session()
    if jcookie:
        s.cookies.set("JSESSIONID", jcookie, domain="jxgl.gdufs.edu.cn")
    return s

def extract_verify_img(html: str) -> str:
    soup = BeautifulSoup(html, "lxml")
    img = soup.select_one("img[src*='VerifyCodeServlet'], img[id=imgCode]")
    if not img:
        raise RuntimeError("找不到验证码图片标签")
    src = img["src"]
    return src if src.startswith("http") else BASE + src.lstrip(".")

def parse_course_list(html: str):
    soup = BeautifulSoup(html, "lxml")
    for a in soup.select("a[href^=\"javascript:JsMod\"]"):
        m = re.search(r"/jsxsd/kscj/pscj_list\.do\?[^']+", a["href"])
        if not m: continue
        row = a.find_parent("tr").find_all("td")
        yield {
            "name"  : row[2].get_text(strip=True),
            "score" : row[3].get_text(strip=True),
            "relurl": m.group(0),
        }

def parse_detail(html: str):
    soup = BeautifulSoup(html, "lxml")
    trs = soup.select("table tr")[1:]
    for tr in trs:
        tds = [td.get_text(strip=True) for td in tr("td")]
        if not tds: continue
        yield dict(zip(
            ["序号","平时成绩","平时比例","期中成绩","期中比例",
             "期末成绩","期末比例","总成绩"], tds))