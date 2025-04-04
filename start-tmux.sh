#!/bin/bash

# Restart fresh session
tmux kill-session -t farmenv 2>/dev/null

# Start new session with proper shell init
tmux new-session -d -s farmenv 'bash -c "source ~/.bashrc && conda activate naturebreed && npm run dev; exec bash"'

tmux split-window -h 'bash -c "source ~/.bashrc && conda activate naturebreed && jupyter lab; exec bash"'

tmux split-window -v 'bash -c "source ~/.bashrc && conda activate naturebreed && exec bash"'

tmux select-layout tiled
tmux attach-session -t farmenv
