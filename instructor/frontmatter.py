import sys, glob, yaml, os

errors = []
seen = 0
names = {}
for root in sys.argv[1:]:
    files = glob.glob(f"{root}/**/.github/agents/*.agent.md", recursive=True) + \
            glob.glob(f"{root}/.github/agents/*.agent.md") + \
            glob.glob(f"{root}/**/.github/instructions/*.instructions.md", recursive=True) + \
            glob.glob(f"{root}/.github/instructions/*.instructions.md") + \
            glob.glob(f"{root}/**/docs/agents-retired/*.md", recursive=True)
    for f in sorted(set(files)):
        text = open(f).read()
        body = text.split("\n", 1)[1] if text.startswith("<!--") else text
        if not body.startswith("---\n"):
            errors.append(f"{f}: no frontmatter"); continue
        fm = yaml.safe_load(body.split("---\n")[1])
        seen += 1
        if f.endswith(".agent.md"):
            for k in ("name", "description", "tools"):
                if k not in fm: errors.append(f"{f}: missing {k}")
            if not isinstance(fm.get("tools"), list): errors.append(f"{f}: tools must be a list")
            names[fm["name"]] = f
            if fm.get("agents") and "agent" not in fm["tools"]:
                errors.append(f"{f}: lists agents but lacks the agent tool")
            for h in fm.get("handoffs", []) or []:
                for k in ("label", "agent", "prompt"):
                    if k not in h: errors.append(f"{f}: handoff missing {k}")
        else:
            if "applyTo" not in fm: errors.append(f"{f}: missing applyTo")
# cross references: handoff targets and orchestrator agents exist in the final repo
final = sys.argv[1]
final_names = {}
for f in glob.glob(f"{final}/.github/agents/*.agent.md"):
    fm = yaml.safe_load(open(f).read().split("---\n")[1]); final_names[fm["name"]] = fm
for n, fm in final_names.items():
    for h in fm.get("handoffs", []) or []:
        if h["agent"] not in final_names: errors.append(f"final repo: {n} hands off to missing agent {h['agent']}")
    for a in fm.get("agents", []) or []:
        if a not in final_names: errors.append(f"final repo: {n} lists missing subagent {a}")
print(f"checked {seen} frontmatter blocks; final agents: {sorted(final_names)}")
for e in errors: print("ERROR", e)
sys.exit(1 if errors else 0)
