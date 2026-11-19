# SSH Learnings

A comprehensive, cross-platform reference and learning guide for **Secure Shell (SSH)** — designed to take you from your very first key pair to advanced jump hosts, port forwarding, multiplexing, and Windows tooling.

## Table of Contents

| # | Guide | Audience | Summary |
|---|-------|----------|---------|
| 1 | [SSH Basics](docs/01-ssh-basics.md) | Novice | How SSH works, generating modern `ed25519` keys, `ssh-copy-id`, `ssh-agent`, and required file permissions. |
| 2 | [Client Configuration (macOS & Linux)](docs/02-client-configuration.md) | Novice → Intermediate | Mastering `~/.ssh/config`, safe global defaults, host aliases, multiple identities, and `ProxyJump` bastions. |
| 3 | [Windows SSH Clients](docs/03-windows-clients.md) | Novice → Intermediate | Complete setup guides for **Native Windows OpenSSH**, **MobaXterm**, and **PuTTY / Pageant / Plink**. |
| 4 | [Advanced SSH Techniques](docs/04-advanced-ssh.md) | Advanced | Connection multiplexing, Local/Remote/Dynamic port forwarding, `scp`/`rsync`, `Include`/`Match` blocks, hardware keys, and escape sequences. |
| 5 | [Troubleshooting & Cheat Sheet](docs/05-troubleshooting-and-cheatsheet.md) | All Levels | Debugging with `ssh -vvv`, fixing common errors, and a quick-reference command & config table. |

---

## Viewing as a Website (GitHub Pages)

This repository is ready to be published as a static website using GitHub Pages via [`docs/index.md`](docs/index.md) and [`docs/_config.yml`](docs/_config.yml):

1. Open your repository on GitHub and go to **Settings → Pages**.
2. Under **Build and deployment**, set **Source** to **Deploy from a branch**.
3. Select your default branch (`trunk`) and the **`/docs`** folder, then click **Save**.
4. GitHub will build and publish the site automatically.
