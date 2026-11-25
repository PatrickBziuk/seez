import json,re,difflib,librosa,numpy as np
raw=json.load(open("words_raw.json"))
# drop echo repeats
raw=[w for w in raw if not (74<w[0]<77) and not (199<w[0]<205)]
def norm(s):
    s=s.lower().replace("ß","ss")
    s=re.sub(r"[^a-zäöü0-9]","",s); return s
lines=[];sec=None
for l in open("lyrics.txt",encoding="utf8"):
    l=l.strip()
    if not l: continue
    if l[0]=="#": sec=l[1:]; continue
    lines.append({"sec":sec,"words":[w for w in l.split() if w!="–"],"text":l})
# keep dash attached: re-split keeping dash merged to previous word
for L in lines:
    ws=[]
    for w in L["text"].split():
        if w=="–" and ws: ws[-1]+=" –"
        else: ws.append(w)
    L["words"]=ws
flat=[(i,j,norm(w)) for i,L in enumerate(lines) for j,w in enumerate(L["words"])]
a=[f[2] for f in flat]; b=[norm(w[2]) for w in raw]
sm=difflib.SequenceMatcher(None,a,b,autojunk=False)
T=[None]*len(flat)
for tag,i1,i2,j1,j2 in sm.get_opcodes():
    if tag=="equal":
        for k in range(i2-i1): T[i1+k]=(raw[j1+k][0],raw[j1+k][1])
    elif tag=="replace":
        n=i2-i1; s=raw[j1][0]; e=raw[j2-1][1]
        for k in range(n): T[i1+k]=(s+(e-s)*k/n, s+(e-s)*(k+1)/n)
# fill None by interpolation
idx=[k for k,t in enumerate(T) if t]
for k in range(len(T)):
    if T[k] is None:
        p=max([i for i in idx if i<k],default=None); n=min([i for i in idx if i>k],default=None)
        if p is None: T[k]=(T[n][0]-0.3,T[n][0])
        elif n is None: T[k]=(T[p][1]+0.25*(k-p),T[p][1]+0.25*(k-p)+0.3)
        else:
            f=(k-p)/(n-p); s=T[p][1]+(T[n][0]-T[p][1])*f; T[k]=(s,s+0.2)
for (i,j,_),t in zip(flat,T):
    lines[i].setdefault("t",[]).append([round(t[0],2),round(t[1],2)])
for L in lines: print(L["sec"],L["t"][0][0],L["t"][-1][1],L["text"][:50], sum(1 for x in L["t"]))
y,sr=librosa.load("song.mp3",sr=22050)
tempo,bt=librosa.beat.beat_track(y=y,sr=sr,units="time")
rms=librosa.feature.rms(y=y,frame_length=2048,hop_length=735)[0]
rms=(rms/rms.max()).round(3).tolist()
print("tempo",tempo,len(bt),bt[:8])
json.dump({"lines":lines,"beats":[round(float(x),3) for x in bt],"rms":rms},open("data.json","w"),ensure_ascii=False)
