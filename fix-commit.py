# Use git filter-repo to remove co-authored-by
git filter-repo --force --message-callback '
import re
if re.search(r"^Co-authored-by:.*$", message, re.MULTILINE):
    message = re.sub(r"\nCo-authored-by:.*$", "", message, flags=re.MULTILINE)
    changed = True
return message
'
