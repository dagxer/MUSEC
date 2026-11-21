#!/usr/bin/env python3
"""
Strip the noise out of the MUSEC mailboxes.

Keeps only the emails that carry a clue; drops the ~1,200 filler emails
(coffee invites, mugs, newsletters, community chatter).

Run it inside the folder that holds the .mbox files:
    python3 filter_emails.py
Output: signal_only.txt  (human-readable, grouped by mailbox)

The three clue types it keeps:
  1. IT Support  -> "Crane System Password Review"  (masked password = length hint)
  2. Newsletter  -> "Newsletter word of the week"    (plaintext string = the hint)
  3. Port Admin  -> "Update about Yard Information"   (layout.png attachment)
Edit KEEP_RULES below to widen or narrow what counts as a clue.
"""
import mailbox, glob, re

# Each rule is (sender substring OR None, subject regex OR None).
# A message is kept if it matches ANY rule.
KEEP_RULES = [
    ("it-support",  None),                         # all IT support mail
    ("port-admin",  None),                         # all port admin mail
    (None, re.compile(r"word of the week", re.I)),  # only this newsletter type
    # --- widen the net here if you suspect more clues, e.g.: ---
    # (None, re.compile(r"password|credential|login|account", re.I)),
]

def body_of(msg):
    if msg.is_multipart():
        return "\n".join(
            (p.get_payload(decode=True) or b"").decode("utf-8", "replace")
            for p in msg.walk() if p.get_content_type() == "text/plain"
        )
    return (msg.get_payload(decode=True) or b"").decode("utf-8", "replace")

def is_signal(msg):
    frm  = (msg["From"] or "").lower()
    subj = msg["Subject"] or ""
    for sender_sub, subj_re in KEEP_RULES:
        if sender_sub and sender_sub in frm:
            return True
        if subj_re and subj_re.search(subj):
            return True
    return False

kept = dropped = 0
with open("signal_only.txt", "w", encoding="utf-8") as out:
    for f in sorted(glob.glob("*.mbox")):
        out.write("\n" + "=" * 60 + f"\nMAILBOX: {f}\n" + "=" * 60 + "\n")
        for msg in mailbox.mbox(f):
            if is_signal(msg):
                kept += 1
                atts = [p.get_filename() for p in msg.walk() if p.get_filename()] \
                       if msg.is_multipart() else []
                out.write(f"\nFROM:    {msg['From']}\n")
                out.write(f"SUBJECT: {msg['Subject']}\n")
                if atts:
                    out.write(f"ATTACH:  {', '.join(atts)}\n")
                out.write("-" * 40 + "\n" + body_of(msg).strip() + "\n")
            else:
                dropped += 1
print(f"kept {kept} signal emails, dropped {dropped} filler emails -> signal_only.txt")