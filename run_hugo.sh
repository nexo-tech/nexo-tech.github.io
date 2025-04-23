#!/bin/bash

RESTART_DELAY=0.2
HUGO_CMD="hugo server --buildDrafts"

echo "🔁 Starting Hugo in eternal loop mode..."

while true; do
  echo "[$(date)] 🚀 Launching Hugo server..." 
 
  $HUGO_CMD
  EXIT_CODE=$?

  echo "[$(date)] 💀 Hugo crashed (exit code: $EXIT_CODE)" 
  echo "[$(date)] ⏳ Restarting in $RESTART_DELAY seconds..." 
  sleep $RESTART_DELAY
done
