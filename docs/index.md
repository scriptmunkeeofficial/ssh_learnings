# SSH Learnings

![Platforms](https://img.shields.io/badge/Platforms-macOS%20%7C%20Linux%20%7C%20Windows-3B4C68?style=flat-square)
![Cryptography](https://img.shields.io/badge/Standard-OpenSSH%20%C2%B7%20Ed25519-438B71?style=flat-square)
![Windows Clients](https://img.shields.io/badge/Windows-OpenSSH%20%C2%B7%20MobaXterm%20%C2%B7%20PuTTY-2D3A4F?style=flat-square)

Welcome to **SSH Learnings** — a comprehensive, cross-platform field guide to Secure Shell (SSH) for both beginners and experienced engineers.

> [!TIP]
> New to SSH? Start with **[1. SSH Basics](./01-ssh-basics.md)** and follow the progression below. Already comfortable with keys? Jump straight to **[ProxyJump](./02-client-configuration.md)**, **[Windows Clients](./03-windows-clients.md)**, or **[Advanced Tunneling](./04-advanced-ssh.md)**.

---

## Guide Roadmap

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

    subgraph Step1["Step 1: Keys"]
        direction TB
        N1["1. SSH Basics<br/>Key Pairs &amp; Permissions"]:::identity
    end

    subgraph Step2["Step 2: Clients"]
        direction TB
        N2["2. macOS &amp; Linux<br/>Config &amp; ProxyJump"]:::service
        N3["3. Windows Clients<br/>OpenSSH · MobaXterm · PuTTY"]:::service
    end

    subgraph Step3["Step 3: Production"]
        direction TB
        N4["4. Advanced SSH<br/>Multiplexing &amp; Tunnels"]:::data
        N5["5. Troubleshooting<br/>Diagnostics &amp; Cheat Sheet"]:::obs
    end

    N1 --> N2
    N1 --> N3
    N2 --> N4
    N3 --> N4
    N4 --> N5
```

---

## Guides

| # | Guide | Focus |
|---|-------|-------|
| 1 | **[SSH Basics](./01-ssh-basics.md)** | Public-key authentication handshake, generating modern `ed25519` keys, `ssh-copy-id`, `ssh-agent`, and file permissions. |
| 2 | **[Client Configuration (macOS & Linux)](./02-client-configuration.md)** | `~/.ssh/config` evaluation order, cross-platform defaults, multiple identities, and single/multi-hop `ProxyJump` bastions. |
| 3 | **[Windows SSH Clients](./03-windows-clients.md)** | Decision flowchart + step-by-step setup for **Native Windows OpenSSH**, **MobaXterm**, and **PuTTY / PuTTYgen / Pageant**. |
| 4 | **[Advanced SSH Techniques](./04-advanced-ssh.md)** | Connection multiplexing (`ControlMaster`), Local/Remote/SOCKS5 port forwarding, `scp`/`rsync`, `Include`/`Match`, FIDO2 keys, and escape sequences. |
| 5 | **[Troubleshooting & Cheat Sheet](./05-troubleshooting-and-cheatsheet.md)** | Diagnostic flowchart with `ssh -vvv` and `ssh -G`, common error fixes, and copy-pasteable reference tables. |
