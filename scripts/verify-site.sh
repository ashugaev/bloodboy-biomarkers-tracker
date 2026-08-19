#!/usr/bin/env bash
# Verify a deployed site serves the built bundle, not raw repo source.
# Catches the GitHub Pages "legacy branch build" failure mode, where the repo
# root index.html is published verbatim (%BASE_URL% placeholder, /src/main.tsx).
#
# Usage: scripts/verify-site.sh <url> [attempts] [delay-seconds]

set -uo pipefail

URL="${1:?usage: verify-site.sh <url> [attempts] [delay-seconds]}"
ATTEMPTS="${2:-6}"
DELAY="${3:-20}"

URL="${URL%/}/"
ORIGIN=$(printf '%s' "$URL" | sed -E 's#^(https?://[^/]+).*#\1#')

fail=""

for attempt in $(seq 1 "$ATTEMPTS"); do
  fail=""

  html=$(curl -fsSL --connect-timeout 10 --max-time 30 "$URL") || fail="cannot fetch $URL"

  if [ -z "$fail" ]; then
    case "$html" in
      *'%BASE_URL%'*) fail="raw source served: index.html still contains %BASE_URL%" ;;
      *'/src/main.tsx'*) fail="raw source served: index.html references /src/main.tsx" ;;
    esac
  fi

  if [ -z "$fail" ]; then
    entry=$(printf '%s' "$html" | grep -o 'src="[^"]*\.js"' | head -1 | sed 's/^src="//; s/"$//')
    if [ -z "$entry" ]; then
      fail="no built entry script (*.js) referenced in index.html"
    else
      case "$entry" in
        http*) entry_url="$entry" ;;
        /*) entry_url="${ORIGIN}${entry}" ;;
        *) entry_url="${URL}${entry}" ;;
      esac

      read -r code ctype < <(
        curl -fsSL -o /dev/null --connect-timeout 10 --max-time 30 \
          -w '%{http_code} %{content_type}\n' "$entry_url"
      ) || fail="entry script unreachable: $entry_url"

      if [ -z "$fail" ] && [ "${code:-}" != "200" ]; then
        fail="entry script $entry_url returned HTTP ${code:-none}"
      fi

      if [ -z "$fail" ]; then
        case "${ctype:-}" in
          *javascript*) : ;;
          *) fail="entry script $entry_url served as '${ctype:-unknown}', not JavaScript" ;;
        esac
      fi
    fi
  fi

  if [ -z "$fail" ]; then
    echo "OK  $URL serves built bundle ($entry)"
    exit 0
  fi

  echo "attempt $attempt/$ATTEMPTS failed: $fail"
  if [ "$attempt" -lt "$ATTEMPTS" ]; then
    sleep "$DELAY"
  fi
done

echo "FAIL  $URL - $fail"
echo "Check Settings > Pages > Source. It must be 'GitHub Actions', not a branch."
exit 1
