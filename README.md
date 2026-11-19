# SSH Learnings

![Platforms](https://img.shields.io/badge/Platforms-macOS%20%7C%20Linux%20%7C%20Windows-3B4C68?style=flat-square)
![Cryptography](https://img.shields.io/badge/Standard-OpenSSH%20%C2%B7%20Ed25519-438B71?style=flat-square)
![Windows Clients](https://img.shields.io/badge/Windows-OpenSSH%20%C2%B7%20MobaXterm%20%C2%B7%20PuTTY-2D3A4F?style=flat-square)
![GitHub Pages](https://img.shields.io/badge/Docs-GitHub%20Pages%20Ready-B45309?style=flat-square)

A comprehensive, cross-platform reference and learning guide for **Secure Shell (SSH)** — designed to take you from your very first key pair to jump hosts, port forwarding, connection multiplexing, and Windows tooling.

> [!NOTE]
> Every guide renders natively on **GitHub** (including interactive Mermaid diagrams and callouts) and publishes as a custom-themed, light/dark **GitHub Pages** site from `/docs`.

---

## Learning Path

```mermaid
%%{init: {
  "theme": "base",
  "themeVariables": {
    "fontFamily": "JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
    "fontSize": "12px",
    "primaryColor": "#F0F4F8",
    "primaryTextColor": "#1E293B",
    "primaryBorderColor": "#3B4C68",
    "lineColor": "#475569",
    "secondaryColor": "#F8FAFC",
    "tertiaryColor": "#FFFFFF",
    "clusterBkg": "#F8FAFC",
    "clusterBorder": "#94A3B8"
  },
  "flowchart": {
    "curve": "basis",
    "nodeSpacing": 35,
    "rankSpacing": 55,
    "padding": 12
  }
}}%%
flowchart LR
    classDef edge fill:#FFFFFF,stroke:#475569,stroke-width:1.5px,color:#1E293B
    classDef identity fill:#FAF6F0,stroke:#D2BFA9,stroke-width:1.5px,color:#2D3A4F
    classDef service fill:#F0F4F8,stroke:#3B4C68,stroke-width:1.5px,color:#1E293B
    classDef data fill:#E1EFEA,stroke:#438B71,stroke-width:1.5px,color:#1E293B
    classDef obs fill:#FFFBEB,stroke:#B45309,stroke-width:1.5px,color:#1E293B
    classDef alertCrit fill:#FEF2F2,stroke:#B91C1C,stroke-width:1.5px,color:#B91C1C

    subgraph Foundations["Foundations"]
        direction TB
        G1["1. SSH Basics<br/>Ed25519 Keys &amp; ssh-agent"]:::identity
    end

    subgraph Setup["Client Setup"]
        direction TB
        G2["2. macOS &amp; Linux<br/>~/.ssh/config &amp; ProxyJump"]:::service
        G3["3. Windows Clients<br/>OpenSSH · MobaXterm · PuTTY"]:::service
    end

    subgraph Mastery["Mastery &amp; Ops"]
        direction TB
        G4["4. Advanced SSH<br/>Multiplexing &amp; Tunnels"]:::data
        G5["5. Troubleshooting<br/>Debug Flow &amp; Cheat Sheet"]:::obs
    end

    G1 --> G2
    G1 --> G3
    G2 --> G4
    G3 --> G4
    G4 --> G5
```

---

## Table of Contents

| # | Guide | Audience | Highlights |
|---|-------|----------|------------|
| 1 | [SSH Basics](docs/01-ssh-basics.md) | Novice | Public-key auth sequence diagram, `ed25519` keys, `ssh-copy-id`, `ssh-agent`, and permissions. |
| 2 | [Client Configuration (macOS & Linux)](docs/02-client-configuration.md) | Novice → Intermediate | `~/.ssh/config` rules, cross-platform `Host *` defaults, multiple identities, and `ProxyJump` architecture. |
| 3 | [Windows SSH Clients](docs/03-windows-clients.md) | Novice → Intermediate | Client decision tree + full setup for **Native OpenSSH**, **MobaXterm**, and **PuTTY / Pageant / Plink**. |
| 4 | [Advanced SSH Techniques](docs/04-advanced-ssh.md) | Advanced | Multiplexing & tunneling diagrams (`-L`, `-R`, `-D`), `scp`/`rsync`, `Include`/`Match`, FIDO2 keys, and escape sequences. |
| 5 | [Troubleshooting & Cheat Sheet](docs/05-troubleshooting-and-cheatsheet.md) | All Levels | Visual debugging decision tree (`ssh -vvv`), common error fixes, and quick-reference tables. |

---

## Viewing as a Website (GitHub Pages)

This repository includes a custom responsive Jekyll layout ([docs/_layouts/default.html](docs/_layouts/default.html)), Muted Shibui light/dark theme ([docs/assets/css/style.css](docs/assets/css/style.css)), and automatic Mermaid + callout rendering ([docs/assets/js/enhancements.js](docs/assets/js/enhancements.js)):

1. Open your repository on GitHub and go to **Settings → Pages**.
2. Under **Build and deployment**, set **Source** to **Deploy from a branch**.
3. Select your default branch (`trunk`) and the **`/docs`** folder, then click **Save**.
4. GitHub will build and publish the site automatically.

## Running Local Validation Tests

Verify Markdown links, Mermaid diagram standards, theme invariants, and client-side enhancements using Node's built-in test runner (Node 20+):

```bash
npm test
```
