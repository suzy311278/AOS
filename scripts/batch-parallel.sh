#!/bin/bash
# Run batch indexing in parallel across 3 LLM providers
# Each provider gets every 3rd PDF (interleaved, not chunked)
# Logs go to data/page-indexes/batch-{provider}.log

set -e
cd "$(dirname "$0")/.."

echo "Starting parallel batch indexing..."
echo "  Claude (Sonnet 4.6):  slice 0/3"
echo "  Gemini (2.5 Pro):     slice 1/3"
echo "  Codex (GPT-5):        slice 2/3"
echo ""

PYTHONUNBUFFERED=1 python3 scripts/build-page-index.py --batch --provider claude --batch-slice 0/3 \
  > data/page-indexes/batch-claude.log 2>&1 &
PID_C=$!

PYTHONUNBUFFERED=1 python3 scripts/build-page-index.py --batch --provider gemini --batch-slice 1/3 \
  > data/page-indexes/batch-gemini.log 2>&1 &
PID_G=$!

# Skip codex for now - output parsing is unreliable for long prompts
# PYTHONUNBUFFERED=1 python3 scripts/build-page-index.py --batch --provider codex --batch-slice 2/3 \
#   > data/page-indexes/batch-codex.log 2>&1 &
# PID_X=$!

echo "Running:"
echo "  Claude PID: $PID_C"
echo "  Gemini PID: $PID_G"
echo ""
echo "Monitor progress:"
echo "  tail -5 data/page-indexes/batch-claude.log"
echo "  tail -5 data/page-indexes/batch-gemini.log"
echo ""
echo "Check completed counts:"
echo "  grep -c '^Done!' data/page-indexes/batch-claude.log data/page-indexes/batch-gemini.log"

wait
echo "All batch workers finished."
