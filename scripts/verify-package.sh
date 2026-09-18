#!/usr/bin/env bash
# Verify the package the way a stranger would receive it.
#   scripts/verify-package.sh          static checks + unit tests (fast, offline after npm ci)
#   scripts/verify-package.sh --full   also: fresh copy, npm ci, typecheck, render and check every example
set -uo pipefail
cd "$(dirname "$0")/.."
FAILS=0
bad() { echo "FAIL $*"; FAILS=$((FAILS+1)); }
ok() { echo "ok   $*"; }

# 1. Frontmatter
for d in skills/*/; do
  n=$(basename "$d")
  head -1 "$d/SKILL.md" | grep -q '^---$' || bad "$n: SKILL.md has no frontmatter"
  grep -q "^name: $n$" "$d/SKILL.md" && ok "$n: name matches folder" || bad "$n: name does not match folder"
  grep -q '^description:' "$d/SKILL.md" || bad "$n: no description"
done

# 2. Nothing personal, account-specific or machine-specific in shipped text and code
PATTERN='/Users/|~/GH|~/\.claude|Bayram|Байрам|empatika|act_[0-9]|[0-9]{15,}|@gmail|sk_live|RUNWAY_API_KEY="?[A-Za-z0-9]{12}'
HITS=$(grep -rInE "$PATTERN" skills --exclude-dir=node_modules --exclude-dir=out --exclude=package-lock.json || true)
[ -z "$HITS" ] && ok "no personal paths, names or account ids" || { bad "personal or account-specific strings:"; echo "$HITS"; }
EM=$(grep -rIn $'\xe2\x80\x94' skills --exclude-dir=node_modules --exclude-dir=out || true)
[ -z "$EM" ] && ok "no em dashes" || { bad "em dashes:"; echo "$EM"; }

# 3. Every file a skill points to exists: references in SKILL.md, references/ and templates/, resolved inside the same
#    skill (or its template/). Each skill must work when installed alone.
for d in skills/*/; do
  n=$(basename "$d")
  miss=0
  while IFS= read -r ref; do
    [ -e "$d/$ref" ] || [ -e "$d/template/$ref" ] || { bad "$n: missing $ref"; miss=1; }
  done < <(grep -rohE '`?(references|templates|template|scripts)/[A-Za-z0-9_./-]+' "$d/SKILL.md" "$d/references" "$d/templates" 2>/dev/null | tr -d '`' | sed -E 's/[.,:)]+$//' | grep -v '<' | sort -u)
  # Bare filenames in prose (`story-and-attention.md`) escaped the pattern above, which is how a shared file
  # came to point at a reference that ships in only one skill while this check stayed green.
  while IFS= read -r ref; do
    case "$ref" in ADS.md|SOURCES.md|CLAUDE.md|README.md|ISSUES.md) continue;; esac
    [ -n "$(find "$d" -name "$ref" -not -path '*/node_modules/*' -print -quit 2>/dev/null)" ] \
      || { bad "$n: missing $ref (referenced by bare filename)"; miss=1; }
  done < <(grep -rohE '(^|[^/A-Za-z0-9_->-])[A-Za-z0-9_-]+\.md' "$d/SKILL.md" "$d/references" "$d/templates" 2>/dev/null \
             | grep -v '<' | grep -oE '[A-Za-z0-9_][A-Za-z0-9_-]*\.md' | sort -u)
  [ $miss = 0 ] && ok "$n: every referenced file exists inside the skill"
done

# 4. Shared files are identical copies (project context template, publication gate)
for f in templates/ADS.md references/publication-gate.md references/synthetic-panel.md; do
  N=0; MISSING=""
  for s in skills/*/; do
    if [ -e "$s/$f" ]; then N=$((N+1)); else MISSING="$MISSING $(basename "$s")"; fi
  done
  TOTAL=$(ls -d skills/*/ | wc -l | tr -d ' ')
  C=$(for s in skills/*/; do [ -e "$s/$f" ] && shasum -a 256 "$s/$f" | cut -d' ' -f1; done | sort -u | wc -l | tr -d ' ')
  if [ "$N" != "$TOTAL" ]; then
    bad "$f missing from:$MISSING (a shared file must ship in every skill, or the skill does not work alone)"
  elif [ "$C" = 1 ]; then ok "$f identical in all $TOTAL skills"
  else bad "$f differs between skills"; fi
done

# 5. Unit tests (no network, no credits). Work files go to out/verify (or $VERIFY_DIR), not /tmp.
T=skills/video-ads/template
WORK="${VERIFY_DIR:-out/verify}"; mkdir -p "$WORK"
node --test $T/runway/test/rw.test.mjs >"$WORK/rw-test.log" 2>&1 && ok "rw.mjs tests ($(grep -c '^✔' "$WORK/rw-test.log") passed)" || { bad "rw.mjs tests"; tail -20 "$WORK/rw-test.log"; }
node --test skills/ad-test-loop/scripts/test/arms.test.mjs >"$WORK/arms-test.log" 2>&1 && ok "arms.mjs tests ($(grep -c '^✔' "$WORK/arms-test.log") passed)" || { bad "arms.mjs tests"; tail -20 "$WORK/arms-test.log"; }

# 6. Full stranger run
if [ "${1:-}" = "--full" ]; then
  W="$(pwd)/$WORK/stranger copy"; rm -rf "$W"; mkdir -p "$W" # absolute, with a space on purpose
  cp -R "$T" "$W/project" && rm -rf "$W/project/node_modules" "$W/project/out"
  (cd "$W/project" && npm ci --no-audit --no-fund >/dev/null 2>&1) && ok "npm ci in a fresh copy (path with spaces)" || bad "npm ci"
  (cd "$W/project" && npx tsc --noEmit -p . >/dev/null 2>&1) && ok "typecheck" || bad "typecheck"
  for id in Example ExampleNews ExampleNewsFootage ExampleStill-4x5 ExampleStill-9x16; do
    (cd "$W/project" && bash scripts/package.sh "$id" >"$W/$id.log" 2>&1) && ok "package.sh $id: all checks pass" || { bad "package.sh $id"; grep -E "FAIL|Error" "$W/$id.log" | head -5; }
  done
  (cd "$W/project" && npx remotion render src/index.ts Compare out/compare.mp4 --muted --log=error >/dev/null 2>&1) && ok "Compare renders" || bad "Compare render"
  echo "fresh copy kept at: $W"
fi

echo; [ $FAILS = 0 ] && echo "PACKAGE OK" || { echo "$FAILS FAILURE(S)"; exit 1; }
