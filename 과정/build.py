import json,os,re,shutil,subprocess,sys,tempfile
P=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
S=os.path.join(P,'과정','src')
H={'home':3594.375,'about':2200,'research':5340,'experiment':4840,'design':5480,'brand':4980}
pages=json.load(open(os.path.join(P,'과정','pages.json'),encoding='utf-8'))
secs=''.join(f'<section class="page" data-page="{k}"><div class="frame" style="height:{H[k]}px">{pages[k]}</div></section>\n' for k in H)

# Tailwind 스타일을 미리 구워 페이지 안에 넣어요(인터넷에서 받아 오지 않게). node 의 npx 가 필요해요.
with tempfile.TemporaryDirectory() as t:
    open(os.path.join(t,'in.css'),'w').write('@tailwind base;\n@tailwind components;\n@tailwind utilities;\n')
    open(os.path.join(t,'pages.html'),'w',encoding='utf-8').write(secs)
    subprocess.run(['npx','-y','tailwindcss@3.4.16','-i',os.path.join(t,'in.css'),'-o',os.path.join(t,'tw.css'),
                    '--content',os.path.join(t,'pages.html'),'--minify'],check=True,capture_output=True)
    tw=open(os.path.join(t,'tw.css'),encoding='utf-8').read()

shell=open(os.path.join(S,'shell.html'),encoding='utf-8').read()
css=open(os.path.join(S,'site.css'),encoding='utf-8').read()
js=open(os.path.join(S,'site.js'),encoding='utf-8').read()
out=shell.replace('/*TW*/',tw).replace('/*CSS*/',css).replace('<!--PAGES-->',secs).replace('/*JS*/',js)
open(os.path.join(P,'index.html'),'w',encoding='utf-8').write(out)
print(len(out))

# 아티팩트용: 문서 껍데기를 빼고(게시할 때 씌워짐) 머리 요소를 맨 위로
if len(sys.argv)>1:
    dst=sys.argv[1]; os.makedirs(dst,exist_ok=True)
    head=re.search(r'<head>(.*?)</head>',out,re.S).group(1)
    head=re.sub(r'<meta charset[^>]*>\s*|<meta name="viewport"[^>]*>\s*','',head)
    body=re.search(r'<body>(.*)</body>',out,re.S).group(1)
    art='<!-- slop-ok: 10 em 대시는 피그마 원문(팀 작성) 문구를 그대로 옮긴 것 -->\n'+head.strip()+'\n'+body.strip()+'\n'
    open(os.path.join(dst,'달그락.html'),'w',encoding='utf-8').write(art)
    a=os.path.join(dst,'assets'); os.makedirs(a,exist_ok=True)
    for f in os.listdir(os.path.join(P,'assets')):
        if not os.path.exists(os.path.join(a,f)): shutil.copy2(os.path.join(P,'assets',f),a)
    print('artifact',len(art))
