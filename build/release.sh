set -e
echo "Enter release version: "
read VERSION

read -p "Releasing $VERSION - are you sure? (y/n)" -n 1 -r
echo    # (optional) move to a new line
if [[ $REPLY =~ ^[Yy]$ ]]
then
  echo "Releasing $VERSION ..."

  # run tests
  npm test 2>/dev/null

  # build
  VERSION=$VERSION npm build && echo "Git publish $VERSION ..."

  # commit
  echo "Enter commit message:"
  read MSG

  npm version $VERSION
  git add .
  git commit -m "$MSG"

  # publish
  git tag v$VERSION
  git push -u origin v$VERSION
  git push
  npm publish
fi
