import os
import subprocess

VENV_PATH = ".venv"


def main():
    pip_exec = (
        os.path.join(VENV_PATH, "Scripts", "pip.exe")
        if os.name == "nt"
        else os.path.join(VENV_PATH, "bin", "pip")
    )

    result = subprocess.run([pip_exec, "freeze"], capture_output=True, text=True)

    print("Installed packages:")
    print(result.stdout)

    with open("requirements.txt", "w") as f:
        f.write(result.stdout)

    print(f"\nSuccessfully froze dependencies to requirements.txt")


if __name__ == "__main__":
    main()
