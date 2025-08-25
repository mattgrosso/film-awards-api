#!/bin/bash

echo "🚀 Railway Deployment Script"
echo "============================"
echo

# Check if we're in a git repository
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    echo "❌ Error: Not in a git repository"
    exit 1
fi

# Check for unstaged changes
if ! git diff-index --quiet HEAD --; then
    echo "⚠️  You have unstaged changes."
    read -p "Stage and commit them? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        git add .
        read -p "Enter commit message: " commit_msg
        git commit -m "$commit_msg"
    else
        echo "❌ Deployment cancelled. Please commit your changes first."
        exit 1
    fi
fi

# Check for uncommitted staged changes
if ! git diff-index --cached --quiet HEAD --; then
    echo "⚠️  You have staged but uncommitted changes."
    read -p "Commit them? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        read -p "Enter commit message: " commit_msg
        git commit -m "$commit_msg"
    else
        echo "❌ Deployment cancelled. Please commit your staged changes first."
        exit 1
    fi
fi

# Check for unpushed commits or if we need to push
if [ "$(git log origin/main..main 2>/dev/null)" != "" ] || ! git diff-index --quiet HEAD -- 2>/dev/null; then
    echo "📤 Pushing changes to GitHub..."
    git push origin main
    
    if [ $? -eq 0 ]; then
        echo "✅ Successfully pushed to GitHub!"
        echo
        echo "🎯 Railway will automatically deploy your changes."
        echo "🌐 Live URL: https://web-production-b8145.up.railway.app"
        echo "📊 Check deployment status at: https://railway.app"
        echo
        echo "⏱️  Deployment typically takes 1-2 minutes."
    else
        echo "❌ Failed to push to GitHub. Please check your connection and try again."
        exit 1
    fi
else
    echo "✅ No changes to deploy - everything is up to date!"
    echo "🌐 Live URL: https://web-production-b8145.up.railway.app"
fi