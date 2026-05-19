#!/bin/bash
set -e

cd /Users/momo/data/opqnext/anthropic/website/blog-src
hexo clean
hexo generate

# Compile polarbear theme SCSS to CSS
SASS_CMD=$(command -v sass || command -v npx)
if command -v sass &> /dev/null; then
    sass /Users/momo/data/opqnext/anthropic/website/blog-src/themes/polarbear/source/css/style.scss /Users/momo/data/opqnext/anthropic/website/blog/css/style.css
elif command -v npx &> /dev/null; then
    npx -y sass /Users/momo/data/opqnext/anthropic/website/blog-src/themes/polarbear/source/css/style.scss /Users/momo/data/opqnext/anthropic/website/blog/css/style.css
fi

cd /Users/momo/data/opqnext/anthropic/website
git add -A
git commit -m "deploy blog $(date '+%Y-%m-%d %H:%M')"
git push