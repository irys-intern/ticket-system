import subprocess
import os
import shutil

commands = [
    "cd backend && npm run dev",
    "cd frontend && npm run dev",
    "cd nlp_service && uvicorn main:app --host 0.0.0.0 --port 8000"
]

def open_in_windows_terminal(commands, cwd=None):
    cwd = os.path.abspath(cwd) if cwd else os.getcwd()
    args = ['wt']
    for i, command in enumerate(commands):
        pane_cmd = ['cmd', '/k', f'cd /d "{cwd}" && {command}']
        if i == 0:
            args += ['-w', '0', 'new-tab'] + pane_cmd
        else:
            args += [';', 'split-pane'] + pane_cmd
    subprocess.Popen(args, shell=True)

def open_in_new_terminal(command, cwd=None):
    # Windows: open new cmd window and run command, keep it open
    if os.name == 'nt':
        # ensure cwd is absolute
        cwd = os.path.abspath(cwd) if cwd else os.getcwd()
        # use cd /d to change drive if needed, then run command and keep window
        cmd_str = f'cd /d "{cwd}" && {command}'
        subprocess.Popen(f'start cmd /k "{cmd_str}"', shell=True)
    else:
        # For Unix-like systems, try gnome-terminal, xterm, or fall back to running in background
        cwd = os.path.abspath(cwd) if cwd else os.getcwd()
        if shutil.which('gnome-terminal'):
            subprocess.Popen(['gnome-terminal', '--', 'bash', '-c', f'cd "{cwd}" && {command}; exec bash'])
        elif shutil.which('xterm'):
            subprocess.Popen(['xterm', '-e', f'bash -c "cd \"{cwd}\" && {command}; exec bash"'])
        else:
            # fallback: run in background
            subprocess.Popen(command, shell=True, cwd=cwd)

if os.name == 'nt' and shutil.which('wt'):
    open_in_windows_terminal(commands, cwd=os.getcwd())
else:
    for command in commands:
        open_in_new_terminal(command, cwd=os.getcwd())
