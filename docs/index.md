# SSH Learnings

Welcome to **SSH Learnings** — a comprehensive, cross-platform guide to Secure Shell (SSH) for both beginners and experienced engineers.

## Guides

1. **[SSH Basics](./01-ssh-basics.md)**
   Learn how SSH public-key authentication works, generate modern `ed25519` keys, deploy them to remote servers, manage passphrases with `ssh-agent`, and set secure file permissions.
2. **[Client Configuration (macOS & Linux)](./02-client-configuration.md)**
   Configure `~/.ssh/config` with safe cross-platform defaults, host aliases, per-host keys, and single- or multi-hop jump servers using `ProxyJump`.
3. **[Windows SSH Clients](./03-windows-clients.md)**
   Step-by-step instructions for **Native Windows OpenSSH**, **MobaXterm** (including SSH Gateways and MobAgent), and **PuTTY / PuTTYgen / Pageant**.
4. **[Advanced SSH Techniques](./04-advanced-ssh.md)**
   Speed up workflows with connection multiplexing, tunnel traffic with Local/Remote/SOCKS port forwarding, transfer files with `scp`/`rsync`, modularize configs with `Include` and `Match`, and harden your setup with FIDO2 hardware keys.
5. **[Troubleshooting & Cheat Sheet](./05-troubleshooting-and-cheatsheet.md)**
   Diagnose connection failures with `ssh -vvv`, resolve the most common SSH errors, and keep a copy-pasteable cheat sheet handy.
