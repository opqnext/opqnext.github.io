#!/bin/bash
set -e

cd /Users/momo/data/opqnext/anthropic/website/blog-src
hexo generate

cd /Users/momo/data/opqnext/anthropic/website
git add -A
git commit -m "deploy blog $(date '+%Y-%m-%d %H:%M')"
git push
