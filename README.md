# MUSEC

All four role groups are visible in /etc/group:
- cargo-inspector (GID 1001): 31 accounts (E-4.205 through E-4.297)
- crane-operator (GID 1002): 9 accounts (E-4.000 through E-4.096 — your current group)
- security-operator (GID 1003): 15 accounts (E-4.100 through E-4.183)
- yard-manager (GID 1004): 25 accounts (E-4.308 through E-4.397)


Possible Passwords:
- bond007
- chester
- thomas
- superman
- blowme
- silver
- <CKj2m*1
- password1


Hashcat passwords:
C:\Users\Noah\Desktop\hashcat-8.0.0\hashcat-8.0.0>hashcat.exe -m 500 --username box1_hashes.txt --show
E-1.016:$1$SALT$dV71tBwEqGxg4l2AY5bTQ0:**joshua**
E-1.054:$1$SALT$Qj/rJlxNw0.tXwYq.hA6D0:**cookie**
E-1.032:$1$SALT$BKqxxquRwoh4m6ICcVlfg/:**12345678**
E-1.020:$1$SALT$5or30L69czJk3.i1lpwVA1:**asdf123**
E-1.100:$1$SALT$hGqtgvSrYVkh7hG1krOED1:**iloveyou1**

C:\Users\Noah\Desktop\hashcat-8.0.0\hashcat-8.0.0>
