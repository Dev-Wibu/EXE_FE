# Fix the commit 9932099 by creating new commit with same content but without co-authored-by
$oldCommit = "9932099"
$parentCommit = "3489afb"

# Get tree from old commit
$tree = git rev-parse "$oldCommit^{tree}"

# Get author and committer info
$authorLine = git log -1 --format="author %an <%ae> %at %ae" $oldCommit
$committerLine = git log -1 --format="committer %cn <%ce> %ct" $oldCommit

# Get the original message without co-authored-by
$message = git log -1 --format="%B" $oldCommit
$message = $message -replace "(?m)^Co-authored-by:.*$", ""
$message = $message.TrimEnd()

Write-Host "Old message:"
Write-Host $message

# Create new commit
$newCommit = git commit-tree -p $parentCommit -p $oldCommit -m $message $tree
Write-Host "New commit: $newCommit"
