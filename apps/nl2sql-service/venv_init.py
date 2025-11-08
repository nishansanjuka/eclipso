import os
import subprocess
import sys
import json

VENV_PATH = ".venv"
SETTINGS_DIR = ".vscode"
SETTINGS_PATH = os.path.join(SETTINGS_DIR, "settings.json")


def create_venv():
    if not os.path.isdir(VENV_PATH):
        print("Creating virtual environment...")
        subprocess.check_call([sys.executable, "-m", "venv", VENV_PATH])


def install_requirements():
    pip_exec = (
        os.path.join(VENV_PATH, "Scripts", "pip.exe")
        if os.name == "nt"
        else os.path.join(VENV_PATH, "bin", "pip")
    )
    subprocess.check_call([pip_exec, "install", "-r", "requirements.txt"])


def write_vscode_settings():
    # Ensure .vscode exists
    os.makedirs(SETTINGS_DIR, exist_ok=True)

    python_path = (
        os.path.join(VENV_PATH, "Scripts", "python.exe")
        if os.name == "nt"
        else os.path.join(VENV_PATH, "bin", "python")
    )

    settings = {
        "python.defaultInterpreterPath": python_path,
        "python.pythonPath": python_path,
    }

    with open(SETTINGS_PATH, "w") as f:
        json.dump(settings, f, indent=4)

    # Windows-safe print (ASCII only)
    print(f"VS Code environment set -> {python_path}")


def main():
    create_venv()
    install_requirements()
    write_vscode_settings()


if __name__ == "__main__":
    main()
