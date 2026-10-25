#!/usr/bin/env bash
# Downloads the pinned PocketBase binary for the current OS/arch into backend/.
set -euo pipefail

PB_VERSION="${PB_VERSION:-0.40.6}"
DIR="$(cd "$(dirname "$0")/.." && pwd)"

case "$(uname -s)" in
  Darwin) OS=darwin ;;
  Linux)  OS=linux ;;
  *) echo "Unsupported OS: $(uname -s)"; exit 1 ;;
esac
case "$(uname -m)" in
  x86_64|amd64)  ARCH=amd64 ;;
  arm64|aarch64) ARCH=arm64 ;;
  *) echo "Unsupported arch: $(uname -m)"; exit 1 ;;
esac

if [ -x "$DIR/pocketbase" ] && "$DIR/pocketbase" --version | grep -q "$PB_VERSION"; then
  echo "PocketBase $PB_VERSION already present."
  exit 0
fi

URL="https://github.com/pocketbase/pocketbase/releases/download/v${PB_VERSION}/pocketbase_${PB_VERSION}_${OS}_${ARCH}.zip"
TMP="$(mktemp -d)"
echo "Downloading $URL"
curl -fsSL "$URL" -o "$TMP/pb.zip"
unzip -o -q "$TMP/pb.zip" pocketbase -d "$DIR"
chmod +x "$DIR/pocketbase"
rm -rf "$TMP"
"$DIR/pocketbase" --version
