#!/bin/bash

# Check for unstaged changes
if ! git diff-index --quiet HEAD --; then
    read -p "You have unstaged changes. Are you sure you want to deploy? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]
    then
        exit 1
    fi
fi

# Check for uncommitted changes
if ! git diff-index --cached --quiet HEAD --; then
    read -p "You have uncommitted changes. Are you sure you want to deploy? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]
    then
        exit 1
    fi
fi

# Check for unpushed commits
if [ "$(git log origin/main..main)" != "" ]; then
    read -p "You have unpushed commits. Are you sure you want to deploy? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]
    then
        exit 1
    fi
fi

# If there were no issues or the user chose to deploy anyway, push to Heroku
git push heroku main