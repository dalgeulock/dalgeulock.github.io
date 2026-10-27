import re,os,sys,html,subprocess,hashlib,json
P=sys.argv[1]
J=os.path.join(P,'과정/jsx'); A=os.path.join(P,'assets')
pages=[('home','Component00Home'),('about','Component01About'),('research','Component02Research'),
       ('experiment','Component03Experiment'),('design','Component04DesignEScissorsFTray'),('brand','Component05Brand')]
out={}
for key,comp in pages:
    src=open(os.path.join(J,comp+'.jsx'),encoding='utf-8').read()
    consts=dict(re.findall(r'const (\w+) = "(https://www\.figma\.com/api/mcp/asset/[^"]+)";',src))
    local={}
    for k,u in consts.items():
        ext=u.rsplit('.',1)[-1]; fn=u.split('/')[-1]
        dst=os.path.join(A,fn)
        if not os.path.exists(dst) or os.path.getsize(dst)==0:
            subprocess.run(['curl','-sL','-o',dst,u],check=True)
        local[k]='assets/'+fn
    body=src[src.index('return (')+len('return ('):src.rindex(');')]
    body=body.replace('className=','class=')
    body=re.sub(r'src=\{(\w+)\}',lambda m:'src="%s" loading="lazy" decoding="async"'%local[m.group(1)],body)
    body=re.sub(r'\{`([^`]*)`\}',lambda m:html.escape(m.group(1),quote=False),body)
    # self closing tags -> explicit
    body=re.sub(r'<(div|p|a|span)(\s[^<>]*?)\s*/>',r'<\1\2></\1>',body)
    body=re.sub(r"font-\['Noto_Sans_KR:(\w+)'\]\s?",'',body)
    out[key]=body.strip()
json.dump(out,open(os.path.join(P,'과정/pages.json'),'w'),ensure_ascii=False)
for k,v in out.items(): print(k,len(v))
