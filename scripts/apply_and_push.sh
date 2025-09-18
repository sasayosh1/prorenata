#!/bin/bash
# Apply Codex changeset and push to repository
# Usage: ./scripts/apply_and_push.sh <repo_path> <changeset_path> <branch_name> <commit_message>

set -e

# Check arguments
if [ $# -ne 4 ]; then
    echo "Usage: $0 <repo_path> <changeset_path> <branch_name> <commit_message>"
    echo ""
    echo "Example:"
    echo "  $0 /path/to/repo /path/to/changeset-20250918-1530 feature/codex-sync 'Apply Codex changeset'"
    exit 1
fi

REPO_PATH="$1"
CHANGESET_PATH="$2"
BRANCH_NAME="$3"
COMMIT_MESSAGE="$4"

# Validate inputs
if [ ! -d "$REPO_PATH" ]; then
    echo "❌ Repository path does not exist: $REPO_PATH"
    exit 1
fi

if [ ! -d "$CHANGESET_PATH" ]; then
    echo "❌ Changeset path does not exist: $CHANGESET_PATH"
    exit 1
fi

if [ ! -f "$CHANGESET_PATH/manifest.json" ]; then
    echo "❌ Invalid changeset: manifest.json not found in $CHANGESET_PATH"
    exit 1
fi

echo "🚀 Applying Codex changeset and pushing..."
echo "   Repository: $REPO_PATH"
echo "   Changeset: $CHANGESET_PATH"
echo "   Branch: $BRANCH_NAME"
echo "   Message: $COMMIT_MESSAGE"
echo ""

# Change to repository directory
cd "$REPO_PATH"

# Verify it's a git repository
if [ ! -d ".git" ]; then
    echo "❌ Not a git repository: $REPO_PATH"
    exit 1
fi

# Check if apply script exists
APPLY_SCRIPT="$REPO_PATH/tools/bridge/apply_changeset_local.py"
if [ ! -f "$APPLY_SCRIPT" ]; then
    echo "❌ Apply script not found: $APPLY_SCRIPT"
    echo "   Make sure you've pulled the latest changes that include the bridge tools."
    exit 1
fi

# Run dry-run first
echo "🔍 Running dry-run to preview changes..."
python3 "$APPLY_SCRIPT" "$CHANGESET_PATH" --dry-run

if [ $? -ne 0 ]; then
    echo "❌ Dry-run failed. Please check the changeset."
    exit 1
fi

echo ""
read -p "Continue with applying changes? (y/N): " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "🛑 Cancelled by user."
    exit 0
fi

# Apply changeset
echo "📦 Applying changeset..."
python3 "$APPLY_SCRIPT" "$CHANGESET_PATH"

if [ $? -ne 0 ]; then
    echo "❌ Failed to apply changeset."
    exit 1
fi

# Check git status
echo ""
echo "📋 Git status after applying changeset:"
git status --porcelain

# Create or switch to branch
echo ""
echo "🌿 Switching to branch: $BRANCH_NAME"

if git show-ref --verify --quiet "refs/heads/$BRANCH_NAME"; then
    echo "   Branch exists, switching..."
    git checkout "$BRANCH_NAME"
else
    echo "   Creating new branch..."
    git checkout -b "$BRANCH_NAME"
fi

# Stage all changes
echo "📝 Staging changes..."
git add -A

# Check if there are changes to commit
if git diff --cached --quiet; then
    echo "ℹ️  No changes to commit."
    exit 0
fi

# Show what will be committed
echo ""
echo "📊 Changes to be committed:"
git diff --cached --stat

echo ""
read -p "Commit and push these changes? (y/N): " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "🛑 Cancelled by user. Changes are staged but not committed."
    exit 0
fi

# Commit changes
echo "💾 Committing changes..."
git commit -m "$COMMIT_MESSAGE"

if [ $? -ne 0 ]; then
    echo "❌ Failed to commit changes."
    exit 1
fi

# Push to remote
echo "🚀 Pushing to remote..."
git push -u origin "$BRANCH_NAME"

if [ $? -ne 0 ]; then
    echo "❌ Failed to push to remote."
    echo "   Commit was successful locally. You can manually push later."
    exit 1
fi

echo ""
echo "✅ Successfully applied changeset and pushed to $BRANCH_NAME"
echo ""
echo "💡 Next steps:"
echo "   1. Create a Pull Request from $BRANCH_NAME to main"
echo "   2. Review and merge the PR"
echo "   3. Update baseline: cd $REPO_PATH && python3 tools/bridge/init_baseline.py"
echo ""