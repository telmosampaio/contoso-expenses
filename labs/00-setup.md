# Setup guide (20 minutes)

When you finish, you have your own public copy of the lab repository, `<you>/contoso-expenses`, cloned in VS Code, with 8 backlog issues and a green CI run. Replace `<you>` with your GitHub login everywhere in these labs.

## How you work in these labs

- **You never type git commands.** For every git or GitHub CLI task you tell GitHub Copilot what you want, in plain language, using the built-in **Agent**. Copilot proposes the commands, you read them, and you approve them. Each lab gives you the exact prompt.
- **Prompt** blocks are typed into the Copilot Chat input exactly as shown, then sent with `Enter`.
- **Checkpoint** lines tell you what you should see before you continue.
- Agent output is non-deterministic. Your plan or code will differ from the reference; the checkpoints, tests and plan gate tell you whether it is acceptable.

## 1. Check your accounts

1. Sign in at [github.com](https://github.com) with the account you will use for the labs.
2. Open [github.com/settings/copilot](https://github.com/settings/copilot) and confirm Copilot is active (Free, Pro, Pro+, or a Business or Enterprise seat). A paid seat is strongly recommended: the labs make many agent requests.
3. If your Copilot seat comes from an organization, ask an owner to confirm these policies are enabled for you: **MCP servers in Copilot** and **Copilot cloud agent**. Without them, Lab 3 uses its local path.

## 2. Install the tools

| Tool | Version | Why |
| --- | --- | --- |
| [Visual Studio Code](https://code.visualstudio.com/download) | Latest stable | Editor, Copilot Chat |
| [Git](https://git-scm.com/downloads) | 2.40 or later | Copilot runs git for you |
| [Node.js](https://nodejs.org) | 22 or 24 LTS | Runs the app and the lab scripts |
| [GitHub CLI](https://cli.github.com) | 2.60 or later | Copilot uses it to open pull requests and create issues |

On Windows, accept the installers' defaults; Git for Windows also installs Git Bash.

## 3. Connect VS Code to Copilot

1. Start VS Code.
2. Select the **Accounts** icon (the person icon at the bottom of the Activity Bar on the far left) and choose **Sign in with GitHub to use GitHub Copilot**. Complete the sign-in in the browser and return to VS Code. If VS Code offers to install or enable **GitHub Copilot Chat**, accept.
3. Open the Chat view: menu **View > Chat** (or `Ctrl+Alt+I`, on macOS `Ctrl+Cmd+I`). It opens in the Secondary Side Bar on the right.
4. Look at the bottom of the chat input box. You will use three controls there in every lab:
   - **Session Target**: shows **Copilot** (the default harness).
   - **Agent picker**: shows **Agent**. Select it to see **Plan** and **Ask** too; your custom agents appear here from Lab 2.
   - **Model picker**: leave the default.
5. The **New Chat** button is the `+` at the top of the Chat view. A new chat starts with no memory of earlier chats.

**Checkpoint:** you can type in the chat input and the Session Target reads **Copilot**. If you only see **Local**, update VS Code (**Help > Check for Updates**).

## 4. Sign in to the GitHub CLI (one-time, typed by you)

This is the only command you type yourself, because it is interactive.

1. In VS Code, open a terminal: menu **Terminal > New Terminal**. It opens at the bottom of the window.
2. Type `gh auth login` and press `Enter`, then answer:
   - Where do you use GitHub? **GitHub.com**
   - Preferred protocol? **HTTPS**
   - Authenticate Git with your GitHub credentials? **Yes**
   - How would you like to authenticate? **Login with a web browser**
3. Copy the one-time code shown, press `Enter`, paste the code in the browser page that opens, and select **Authorize**.

**Checkpoint:** the terminal prints `Logged in as <you>`.

## 5. Create your copy of the lab repository

The starting repository is a template. Each student creates an independent copy with its own issues, Actions and settings.

1. In the browser open **https://github.com/telmosampaio/gh600-agentic-labs**.
2. Select the green **Use this template** button (top right of the file list), then **Create a new repository**.
3. Fill in the form:
   - **Owner**: your account
   - **Repository name**: `contoso-expenses`
   - **Visibility**: **Public** (rulesets, environments with reviewers and CodeQL are free on public repositories; never put real data or secrets in it)
   - Leave **Include all branches** cleared.
4. Select **Create repository**. GitHub opens your new repository.

## 6. Clone it in VS Code

1. In VS Code open the Command Palette: **View > Command Palette** (`Ctrl+Shift+P`, macOS `Cmd+Shift+P`).
2. Type `Git: Clone` and select it, then select **Clone from GitHub**. If VS Code asks to sign in to GitHub, allow it.
3. Pick `<you>/contoso-expenses` from the list (type its name to filter).
4. Choose a parent folder, for example a `labs` folder in your home directory, and select **Select as Repository Destination**.
5. When VS Code asks **Would you like to open the cloned repository?**, select **Open**.
6. When asked **Do you trust the authors of the files in this folder?**, select **Yes, I trust the authors**. Hooks and MCP servers only run in trusted workspaces.
7. If VS Code suggests the recommended extensions (bottom-right notification), select **Install**.

**Checkpoint:** the Explorer (top icon in the Activity Bar) shows `src`, `test`, `scripts`, `labs` and `docs`.

## 7. Run the tests and seed the backlog

1. Open a terminal (**Terminal > New Terminal**) and run:

```bash
npm ci
npm test
```

**Checkpoint:** the summary at the end shows `pass 20` and `fail 0`. (`npm ci` installs nothing; the project has no dependencies.)

2. In the Chat view select **New Chat** (`+`), choose the **Agent** agent, and send:

```text
Run node scripts/seed-issues.js to create the lab backlog issues in my GitHub repository, then list the issue numbers and titles it created.
```

3. Copilot shows the command with an **Allow** button (the label can also read **Continue** or **Run**). Read the command, then select **Allow**.

**Checkpoint:** Copilot reports issues #1 to #8: FEAT-1 is #1, BUG-7 is #7, DOCS-8 is #8. On github.com, the **Issues** tab of your repository lists the same 8 issues. The labs use these numbers; if yours differ, note the mapping.

## 8. Check the repository on github.com

1. Open your repository's **Actions** tab (top of the repository page). If GitHub asks you to enable workflows, select the button that enables them.
2. Select the **CI** workflow in the left list. If no run exists yet, select **Run workflow** (right side), keep branch `main`, and select the green **Run workflow** button. Wait for the run to show a green check.
3. Open **Settings** (last tab of the repository bar) > **General**, scroll to **Pull Requests**, and select **Automatically delete head branches**. It saves immediately.
4. Paid plans only: open **Issues > FEAT-1** (#1). In the right sidebar select **Assignees** and confirm **Copilot** appears in the list. Press `Esc` without assigning.

## 9. Smoke test Copilot

In a **New Chat** choose the **Ask** agent and send:

```text
What does this repository do? Answer in 3 bullets and name the files you read.
```

**Checkpoint:** the answer mentions `src/server.js`, `src/policy.js` and approval routing. You are ready for Lab 1.

## If you fall behind

Each lab has reference files in `solutions/lab-0N/`. In a **New Chat** with **Agent**, send:

```text
Create a branch named catch-up/lab-<N>, run node scripts/catch-up.js <N> --owner <you>, show me git status, then commit everything with the message "Catch up to lab <N>", push the branch and open a pull request with the GitHub CLI.
```

Then merge the pull request as described at the end of each lab.
