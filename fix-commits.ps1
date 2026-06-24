# Cherry-pick and fix all commits with co-authored-by

# First, cherry-pick 9932099 with fixed message
Write-Host "Step 1: Cherry-pick 9932099 with fixed message"
git cherry-pick -n 9932099

# Get original author info
$authorName = git log -1 --format="%an" 9932099
$authorEmail = git log -1 --format="%ae" 9932099
$authorDate = git log -1 --format="%ai" 9932099
$message = "feat: add AI evaluation polling and optimistic submission UI"

# Set author and commit
$env:GIT_AUTHOR_NAME = $authorName
$env:GIT_AUTHOR_EMAIL = $authorEmail
$env:GIT_COMMITTER_NAME = $authorName
$env:GIT_COMMITTER_EMAIL = $authorEmail

git commit -m $message

Write-Host "Done!"
git log --oneline -3
