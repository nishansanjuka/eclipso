import os
import sys
import subprocess

VENV_PATH = ".venv"


def main():
    packages = sys.argv[1:]
    if not packages:
        print("No packages specified")
        sys.exit(1)

    pip_exec = (
        os.path.join(VENV_PATH, "Scripts", "pip.exe")
        if os.name == "nt"
        else os.path.join(VENV_PATH, "bin", "pip")
    )
    subprocess.check_call([pip_exec, "install"] + packages)
    print(f"Installed packages: {', '.join(packages)}")


if __name__ == "__main__":
    main()
