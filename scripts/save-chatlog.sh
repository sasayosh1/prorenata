#!/usr/bin/env bash
set -euo pipefail

# Mac-only helper: saves clipboard (pbpaste) to docs/chatlogs/*.md
#
# Usage:
#   ./scripts/save-chatlog.sh "vibecoding-ops"
#
# Notes:
# - Copy the chat content first (clipboard).
# - Re-running with same topic on same date will append.

TOPIC_RAW="${1:-}"
if [[ -z "${TOPIC_RAW}" ]]; then
  echo "ERROR: topic is required"
  echo "Usage: $0 \"vibecoding-ops\""
  exit 1
fi

if ! command -v pbpaste >/dev/null 2>&1; then
  echo "ERROR: pbpaste not found (Mac only)"
  exit 1
fi

ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
LOG_DIR="${ROOT}/docs/chatlogs"
INDEX_PATH="${LOG_DIR}/index.md"

mkdir -p "${LOG_DIR}"

TOPIC="$(printf "%s" "${TOPIC_RAW}" \
  | tr '[:upper:]' '[:lower:]' \
  | sed -E 's/[[:space:]]+/-/g; s/[^a-z0-9_-]+/-/g; s/-+/-/g; s/^-+//; s/-+$//' \
  | cut -c1-80)"

if [[ -z "${TOPIC}" ]]; then
  echo "ERROR: topic became empty after normalization"
  exit 1
fi

DATE_UTC="$(date -u +%F)"
DATE_LOCAL="$(date +%F)"
TIME_LOCAL="$(date +%H:%M)"

FILENAME="${DATE_LOCAL}_prorenata-${TOPIC}.md"
PATH_MD="${LOG_DIR}/${FILENAME}"

CLIP="$(pbpaste || true)"
CLIP_TRIMMED="$(printf "%s" "${CLIP}" | sed -E 's/[[:space:]]+$//' || true)"
if [[ -z "${CLIP_TRIMMED}" ]]; then
  echo "ERROR: clipboard is empty"
  exit 1
fi

escape_yaml() {
  # minimal escaping for YAML single-line strings
  printf "%s" "$1" | sed -E 's/"/\\"/g'
}

write_new_file() {
  local topic_yaml
  topic_yaml="$(escape_yaml "${TOPIC_RAW}")"
  cat > "${PATH_MD}" <<EOF
---
date: "${DATE_UTC}"
repo: "prorenata"
topic: "${topic_yaml}"
tags:
  - "chatlog"
  - "${TOPIC}"
---

# Chat Log: ${TOPIC_RAW}

## 目次
- [要点](#要点)
- [決定事項](#決定事項)
- [次アクション](#次アクション)
- [Transcript](#transcript)

## 要点
- 

## 決定事項
- 

## 次アクション
- 

## Transcript

### ${DATE_LOCAL} ${TIME_LOCAL}

${CLIP_TRIMMED}
EOF
}

append_to_existing() {
  # Append new transcript entry to the end (keeps diffs small and avoids structural edits).
  cat >> "${PATH_MD}" <<EOF

### ${DATE_LOCAL} ${TIME_LOCAL}

${CLIP_TRIMMED}
EOF
}

if [[ -f "${PATH_MD}" ]]; then
  append_to_existing
  echo "Appended: ${PATH_MD}"
else
  write_new_file
  echo "Created: ${PATH_MD}"
fi

generate_index() {
  if [[ ! -f "${INDEX_PATH}" ]]; then
    cat > "${INDEX_PATH}" <<'EOF'
# Chat Logs Index

このファイルは `scripts/save-chatlog.sh` により自動生成されます。

## Logs

<!-- AUTO-GENERATED:START -->
<!-- AUTO-GENERATED:END -->
EOF
  fi

  local tmp
  tmp="$(mktemp)"

  {
    echo "<!-- AUTO-GENERATED:START -->"
    # newest first
    find "${LOG_DIR}" -maxdepth 1 -type f -name "*.md" \
      ! -name "README.md" ! -name "index.md" \
      -print \
      | sed -E 's#^.*/##' \
      | sort -r \
      | while read -r f; do
          echo "- [${f}](./${f})"
        done
    echo "<!-- AUTO-GENERATED:END -->"
  } > "${tmp}"

  # Replace section between markers.
  awk -v repl="${tmp}" '
    BEGIN {inside=0}
    /<!-- AUTO-GENERATED:START -->/ {inside=1; system("cat " repl); next}
    /<!-- AUTO-GENERATED:END -->/ {inside=0; next}
    inside==0 {print}
  ' "${INDEX_PATH}" > "${INDEX_PATH}.tmp"
  mv "${INDEX_PATH}.tmp" "${INDEX_PATH}"
  rm -f "${tmp}"
}

generate_index
echo "Updated: ${INDEX_PATH}"
