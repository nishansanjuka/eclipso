import os
import sys
import subprocess

VENV_PATH = ".venv"


def main():
    uvicorn_exec = (
        os.path.join(VENV_PATH, "Scripts", "uvicorn.exe")
        if os.name == "nt"
        else os.path.join(VENV_PATH, "bin", "uvicorn")
    )

    try:
        # Use subprocess.run to handle the process
        subprocess.run([uvicorn_exec, "main:app", "--reload"])
    except KeyboardInterrupt:
        # This catches Ctrl+C
        print("\n\n✓ Shutting down gracefully...")
    except Exception as e:
        print(f"\n\n✗ Error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
