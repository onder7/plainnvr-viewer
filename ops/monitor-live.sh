#!/bin/sh
set -eu

PROJECT_DIR="/mnt/DATA/nv1/plainnvr-viewer"
SESSION="plainnvr-monitor"

if tmux has-session -t "$SESSION" 2>/dev/null; then
  echo "Monitor session already running: $SESSION"
  echo "Attach with: tmux attach -t $SESSION"
  exit 0
fi

tmux new-session -d -s "$SESSION" -n live "cd '$PROJECT_DIR' && docker compose logs -f --tail=100 backend frontend"
tmux split-window -v -t "$SESSION:live" "watch -n 5 'docker stats --no-stream --format \"table {{.Name}}\\t{{.CPUPerc}}\\t{{.MemUsage}}\\t{{.NetIO}}\" plainnvr-viewer-backend plainnvr-viewer-frontend'"
tmux select-pane -t "$SESSION:live.0"
tmux set-option -t "$SESSION" status-left " PlainNVR monitor "
tmux set-option -t "$SESSION" status-right " Ctrl-b d: detach | Ctrl-b w: windows "

echo "Live monitor started: $SESSION"
echo "Attach with: tmux attach -t $SESSION"
