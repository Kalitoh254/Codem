#!/data/data/com.termux/files/usr/bin/bash

set -u

PROJECT="$HOME/codem"
BRANCH="main"
DEBOUNCE=5

cd "$PROJECT" || exit 1

echo "Codem Auto-Push started."
echo "Watching: $PROJECT"
echo "Branch: $BRANCH"
echo "Press Ctrl+C to stop."

while true; do
    inotifywait -qq -r \
        -e modify,create,delete,move \
        --exclude '(^|/)(\.git|node_modules|dist|build|coverage)(/|$)' \
        "$PROJECT"

    sleep "$DEBOUNCE"

    if [ -n "$(git status --porcelain)" ]; then
        git add -A

        if git diff --cached --quiet; then
            continue
        fi

        MESSAGE="chore(auto-sync): $(date '+%Y-%m-%d %H:%M:%S')"

        git commit -m "$MESSAGE" || continue
        git push origin "$BRANCH" || true

        echo "[$(date '+%Y-%m-%d %H:%M:%S')] Changes pushed to GitHub."
    fi
done
