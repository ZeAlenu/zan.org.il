#!/usr/bin/env bash
set -eo pipefail

version=$(tr -d '[:space:]' < .nvmrc)
prefix="/opt/node-v${version}-linux-x64"

if [ -s "$HOME/.nvm/nvm.sh" ]; then
  . "$HOME/.nvm/nvm.sh"
  nvm install "$version"
  nvm alias default "$version"
fi

if ! "$prefix/bin/node" -v 2>/dev/null | grep -qx "v${version}"; then
  archive=$(mktemp)
  curl -fsSL "https://nodejs.org/dist/v${version}/node-v${version}-linux-x64.tar.xz" -o "$archive"
  sudo tar -xJf "$archive" -C /opt
  rm -f "$archive"
fi

sudo ln -sfn "$prefix/bin/node" /usr/local/bin/node
sudo ln -sfn "$prefix/bin/npm" /usr/local/bin/npm
sudo ln -sfn "$prefix/bin/npx" /usr/local/bin/npx

hash -r
node -v | grep -qx "v${version}"
npm ci
