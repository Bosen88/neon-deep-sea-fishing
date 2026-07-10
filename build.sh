#!/bin/bash
set -e
if [ -f index.html ] && [ -d assets ]; then
  SRC=.
else
  rm -rf _src
  git clone --depth 1 https://github.com/Bosen88/neon-deep-sea-fishing.git _src
  SRC=_src
fi
mkdir -p dist/assets
cp "$SRC/index.html" "$SRC/style.css" "$SRC/game.js" dist/
cp "$SRC"/assets/*.jpg dist/assets/
echo "Build output:"
ls -la dist dist/assets
