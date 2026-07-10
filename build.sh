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
# 已在 repo 中的 PNG 一併複製（若存在）
cp "$SRC"/assets/*.png dist/assets/ 2>/dev/null || true

# 從 Higgsfield CDN 抓取 AI 生成的新海洋生物圖（repo 中沒有時才下載）
CDN="https://d8j0ntlcm91z4.cloudfront.net/user_3CG88mzhh71CKdo7YAhe9KY57OM"
fetch() {
  if [ ! -f "dist/assets/$1" ]; then
    curl -fsSL --retry 3 -o "dist/assets/$1" "$CDN/$2" || echo "WARN: failed to fetch $1"
  fi
}
fetch jellyfish.png  hf_20260710_054520_3b884ea1-6e03-41f4-8455-b510ca52f21f.png
fetch lionfish.png   hf_20260710_054522_0b168c14-2357-4f36-b1af-09cb49d8fce8.png
fetch swordfish.png  hf_20260710_054531_35b6a614-c8e1-4235-8573-4c4cb315279a.png
fetch mantaray.png   hf_20260710_054534_65d5a399-5ec9-489b-837e-f6f595dac476.png
fetch turtle.png     hf_20260710_054547_de26a07d-f102-494a-b019-3460b348131e.png
fetch pufferfish.png hf_20260710_054550_fef6ed10-801c-4613-bcfd-da4279819616.png
fetch whale.png      hf_20260710_054552_1c5e70e7-465e-4353-a451-af6896b5d96b.png

echo "Build output:"
ls -la dist dist/assets
