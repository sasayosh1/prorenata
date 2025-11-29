#!/usr/bin/env bash
set -euo pipefail

NODE_BIN="$(command -v node || true)"
if [ -z "${NODE_BIN}" ]; then
  echo "Error: node binary not found in PATH. Install Node.js or ensure node is available in PATH."
  exit 1
fi

echo "About to add node (${NODE_BIN}) to macOS Application Firewall allowed list. You will be prompted for your password (sudo)."
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --add "${NODE_BIN}"
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --unblockapp "${NODE_BIN}"

echo "Added and unblocked node in firewall."
