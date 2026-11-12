#!/usr/bin/env python3
"""Validate the code snippets in labs/*.md and compare them with the reference solutions.

Usage: python3 instructor/check-lab-snippets.py   (needs PyYAML; uses actionlint if installed)
"""
import glob, json, os, re, shutil, subprocess, sys, tempfile
import yaml

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
errors, checked = [], 0

# snippet -> reference file it must match (after normalising whitespace and the owner placeholder)
REFERENCE = {
    "Plan check": "solutions/lab-02/.github/workflows/plan-check.yml",
    "\"Copilot Setup Steps\"": "solutions/lab-03/.github/workflows/copilot-setup-steps.yml",
    "Agent evaluation": "solutions/lab-05/.github/workflows/eval.yml",
    "Deploy": "solutions/lab-06/.github/workflows/deploy.yml",
}
JSON_REFERENCE = {
    "github-readonly": "solutions/lab-03/.vscode/mcp.json",
    "chat.tools.terminal.autoApprove": "solutions/lab-03/.vscode/settings.json",
    "preToolUse": "solutions/lab-06/.github/hooks/policy.json",
    "denyCommands": "solutions/lab-06/config/agent-policy.json",
}

def strip_comments(text):
    return "\n".join(l for l in text.splitlines() if not l.strip().startswith("#")).strip()

for md in sorted(glob.glob(os.path.join(ROOT, "labs", "*.md"))):
    text = open(md, encoding="utf-8").read()
    for lang, body in re.findall(r"^```(\w*)\n(.*?)^```", text, flags=re.S | re.M):
        where = f"{os.path.basename(md)}: ```{lang} block starting '{body.splitlines()[0][:50] if body else ''}'"
        checked += 1
        try:
            if lang == "json":
                data = json.loads(body)
                for key, ref in JSON_REFERENCE.items():
                    if key in body and json.load(open(os.path.join(ROOT, ref))) != data:
                        errors.append(f"{where}: differs from {ref}")
            elif lang == "yaml" and re.search(r"^jobs:", body, re.M):
                data = yaml.safe_load(body)
                name = body.splitlines()[0].split("name:", 1)[1].strip()
                ref = REFERENCE.get(name)
                if ref and yaml.safe_load(open(os.path.join(ROOT, ref))) != data:
                    errors.append(f"{where}: differs from {ref}")
                if shutil.which("actionlint"):
                    with tempfile.TemporaryDirectory() as d:
                        os.makedirs(f"{d}/.github/workflows")
                        p = f"{d}/.github/workflows/snippet.yml"
                        open(p, "w").write(body)
                        r = subprocess.run(["actionlint", p], capture_output=True, text=True)
                        if r.returncode:
                            errors.append(f"{where}: actionlint: {r.stdout.strip()}")
            elif lang == "yaml":
                yaml.safe_load(body)
            elif lang == "markdown" and body.startswith("---\n"):
                fm = yaml.safe_load(body.split("---\n")[1])
                if "name" in fm:
                    for k in ("name", "description", "tools"):
                        if k not in fm:
                            errors.append(f"{where}: agent header missing {k}")
                    if fm.get("agents") and "agent" not in fm["tools"]:
                        errors.append(f"{where}: lists agents but lacks the agent tool")
                elif "applyTo" not in fm:
                    errors.append(f"{where}: instructions header missing applyTo")
        except Exception as e:  # noqa: BLE001
            errors.append(f"{where}: {type(e).__name__}: {str(e).splitlines()[0]}")

# Students never type git: no bash block in the labs may contain a git or gh command,
# except the one-time interactive "gh auth login" that the setup guide explains.
for md in sorted(glob.glob(os.path.join(ROOT, "labs", "*.md"))):
    text = open(md, encoding="utf-8").read()
    for body in re.findall(r"^```(?:bash|sh|powershell)\n(.*?)^```", text, flags=re.S | re.M):
        for line in body.splitlines():
            if re.match(r"\s*(git|gh)\s", line):
                errors.append(f"{os.path.basename(md)}: typed git/gh command in a shell block: {line.strip()}")

print(f"checked {checked} snippets")
for e in errors:
    print("ERROR", e)
sys.exit(1 if errors else 0)
