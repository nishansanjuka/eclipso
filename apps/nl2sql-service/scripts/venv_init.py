import os
import subprocess
import sys
import json

# Paths
VENV_PATH = ".venv"
SERVICE_DIR = os.path.dirname(os.path.abspath(__file__))
REPO_ROOT = os.path.abspath(
    os.path.join(SERVICE_DIR, "..", "..")
)  # adjust if turborepo root is two levels up
ROOT_VSCODE_DIR = os.path.join(REPO_ROOT, ".vscode")
ROOT_SETTINGS_PATH = os.path.join(ROOT_VSCODE_DIR, "settings.json")


def create_venv():
    if not os.path.isdir(os.path.join(SERVICE_DIR, VENV_PATH)):
        print("Creating virtual environment...")
        subprocess.check_call(
            [sys.executable, "-m", "venv", os.path.join(SERVICE_DIR, VENV_PATH)]
        )


def install_requirements():
    pip_exec = (
        os.path.join(SERVICE_DIR, VENV_PATH, "Scripts", "pip.exe")
        if os.name == "nt"
        else os.path.join(SERVICE_DIR, VENV_PATH, "bin", "pip")
    )
    req_file = os.path.join(SERVICE_DIR, "requirements.txt")
    if os.path.exists(req_file):
        subprocess.check_call([pip_exec, "install", "-r", req_file])


def update_root_vscode_settings():
    os.makedirs(ROOT_VSCODE_DIR, exist_ok=True)

    python_path = (
        os.path.join(SERVICE_DIR, VENV_PATH, "Scripts", "python.exe")
        if os.name == "nt"
        else os.path.join(SERVICE_DIR, VENV_PATH, "bin", "python")
    )

    # Load existing settings if present
    if os.path.exists(ROOT_SETTINGS_PATH):
        with open(ROOT_SETTINGS_PATH, "r") as f:
            try:
                settings = json.load(f)
            except json.JSONDecodeError:
                settings = {}
    else:
        settings = {}

    # Update settings for this service
    settings.update(
        {
            "python.defaultInterpreterPath": python_path,
            "python.terminal.activateEnvironment": True,
        }
    )

    with open(ROOT_SETTINGS_PATH, "w") as f:
        json.dump(settings, f, indent=4)

    print(f"VS Code root settings updated -> {python_path}")
    print("Terminals in VS Code root will auto-activate this service venv.")


def main():
    create_venv()
    install_requirements()
    update_root_vscode_settings()


if __name__ == "__main__":
    main()
