#!/usr/bin/env bash
set -Eeuo pipefail

ROOT="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
MOOD="$ROOT/bin/mood"
TMP="$(mktemp -d)"
trap 'rm -rf -- "$TMP"' EXIT

bash -n "$MOOD"
bash -n "$ROOT/install.sh"

export XDG_CONFIG_HOME="$TMP/config"
export XDG_STATE_HOME="$TMP/state"
export XDG_DATA_HOME="$TMP/data"

[[ "$("$MOOD" topics | wc -l)" -eq 8 ]]
[[ "$("$MOOD" status | sed -n '1p')" == "app=mood" ]]
grep -q '^OnStartupSec=10s$' "$ROOT/systemd/mood.timer"
grep -q 'gnome-extensions install falhou' "$ROOT/bin/mood"

if "$MOOD" set-scheme invalid >/dev/null 2>&1; then
  printf 'set-scheme aceitou um valor inválido\n' >&2
  exit 1
fi

if command -v gnome-extensions >/dev/null 2>&1; then
  gnome-extensions pack "$ROOT/gnome-extension/mood@local" --out-dir "$TMP" >/dev/null
  [[ -f "$TMP/mood@local.shell-extension.zip" ]]
fi

printf 'mood CLI checks passed\n'

