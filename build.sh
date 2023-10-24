# Tạo tag
git tag -a $1 -m "Release $1"
git push origin $1
npm pack
npm publish