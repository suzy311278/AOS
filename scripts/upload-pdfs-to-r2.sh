#!/bin/bash
# Upload all source PDFs to the greentryst-pdfs R2 bucket (parallelised).
# Key pattern in R2: <course>/<filename>.pdf

set -e
BUCKET="greentryst-pdfs"
PARALLEL=8

TMPFILE=$(mktemp)
trap "rm -f $TMPFILE" EXIT

find src/content -path '*/sources/*.pdf' -type f | while read -r pdf; do
  course=$(echo "$pdf" | awk -F'/' '{print $3}')
  filename=$(basename "$pdf")
  echo "${course}/${filename}|${pdf}" >> "$TMPFILE"
done

TOTAL=$(wc -l < "$TMPFILE" | tr -d ' ')
echo "Uploading $TOTAL PDFs with parallelism=$PARALLEL..."
echo ""

upload_one() {
  local line="$1"
  local key="${line%%|*}"
  local path="${line#*|}"
  if wrangler r2 object put "${BUCKET}/${key}" --file "$path" --remote >/dev/null 2>&1; then
    echo "OK  $key"
  else
    echo "FAIL $key"
  fi
}
export -f upload_one
export BUCKET

cat "$TMPFILE" | xargs -I {} -P $PARALLEL bash -c 'upload_one "{}"' | nl -ba

echo ""
echo "Upload complete."
