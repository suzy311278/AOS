#!/bin/bash
# Run all 7 competitor crawlers in parallel.
# Each crawler is a separate process with its own browser instance.

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
CONTENT_DIR="$SCRIPT_DIR/../content"
CRAWLER="$SCRIPT_DIR/crawl_site.py"

echo "=== Starting 7 competitor crawls in parallel ==="
echo ""

# 1. Sustainability Academy
python3 "$CRAWLER" "https://sustainability-academy.org/" "$CONTENT_DIR/sustainability-academy" 60 3 \
  > "$CONTENT_DIR/sustainability-academy/_crawl.log" 2>&1 &
PID1=$!
echo "[PID $PID1] sustainability-academy.org"

# 2. Persefoni Academy
python3 "$CRAWLER" "https://www.persefoni.com/insights/persefoni-academy" "$CONTENT_DIR/persefoni" 60 3 \
  > "$CONTENT_DIR/persefoni/_crawl.log" 2>&1 &
PID2=$!
echo "[PID $PID2] persefoni.com"

# 3. SDG Academy
python3 "$CRAWLER" "https://sdgacademy.org/" "$CONTENT_DIR/sdg-academy" 60 3 \
  > "$CONTENT_DIR/sdg-academy/_crawl.log" 2>&1 &
PID3=$!
echo "[PID $PID3] sdgacademy.org"

# 4. Verst Carbon
python3 "$CRAWLER" "https://verst.earth/e-learning/" "$CONTENT_DIR/verst-carbon" 60 3 \
  > "$CONTENT_DIR/verst-carbon/_crawl.log" 2>&1 &
PID4=$!
echo "[PID $PID4] verst.earth"

# 5. The ESG Institute
python3 "$CRAWLER" "https://www.the-esg-institute.org/" "$CONTENT_DIR/esg-institute" 60 3 \
  > "$CONTENT_DIR/esg-institute/_crawl.log" 2>&1 &
PID5=$!
echo "[PID $PID5] the-esg-institute.org"

# 6. KnowESG
python3 "$CRAWLER" "https://knowesg.com/courses" "$CONTENT_DIR/knowesg" 60 3 \
  > "$CONTENT_DIR/knowesg/_crawl.log" 2>&1 &
PID6=$!
echo "[PID $PID6] knowesg.com"

# 7. UNEP FI
python3 "$CRAWLER" "https://www.unepfi.org/learning-and-development-for-finance-professionals/" "$CONTENT_DIR/unep-fi" 60 3 \
  > "$CONTENT_DIR/unep-fi/_crawl.log" 2>&1 &
PID7=$!
echo "[PID $PID7] unepfi.org"

echo ""
echo "All 7 crawlers launched. Waiting for completion..."
echo ""

# Wait for all and report status
FAILED=0
for PID_NAME in "$PID1:sustainability-academy" "$PID2:persefoni" "$PID3:sdg-academy" "$PID4:verst-carbon" "$PID5:esg-institute" "$PID6:knowesg" "$PID7:unep-fi"; do
  PID="${PID_NAME%%:*}"
  NAME="${PID_NAME##*:}"
  if wait "$PID"; then
    echo "  OK  $NAME (PID $PID)"
  else
    echo "  FAIL $NAME (PID $PID) - check $CONTENT_DIR/$NAME/_crawl.log"
    FAILED=$((FAILED + 1))
  fi
done

echo ""
if [ "$FAILED" -eq 0 ]; then
  echo "=== All 7 crawls completed successfully ==="
else
  echo "=== $FAILED crawl(s) had errors. Check logs above. ==="
fi

# Print page counts
echo ""
echo "--- Pages crawled per site ---"
for DIR in sustainability-academy persefoni sdg-academy verst-carbon esg-institute knowesg unep-fi; do
  INDEX="$CONTENT_DIR/$DIR/_index.json"
  if [ -f "$INDEX" ]; then
    COUNT=$(python3 -c "import json; print(json.load(open('$INDEX'))['pages_crawled'])" 2>/dev/null || echo "?")
    echo "  $DIR: $COUNT pages"
  else
    echo "  $DIR: no index (crawl may have failed)"
  fi
done
