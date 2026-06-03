#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="${ROOT}/infomaniak-deploy.env"
REPO="${GITHUB_REPOSITORY:-lbatschelet/wellspace}"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Missing ${ENV_FILE} — copy from infomaniak-deploy.env.example" >&2
  exit 1
fi

if ! command -v gh >/dev/null 2>&1; then
  echo "GitHub CLI (gh) is required." >&2
  exit 1
fi

gh secret set -f "$ENV_FILE" -R "$REPO"
echo "Secrets updated for ${REPO} (SSH_HOST, SSH_USERNAME, SSH_PASSWORD, SSH_TARGET_PATH, …)."
