# 4. Advanced SSH Techniques

**Guide 4 of 5** · [← Windows SSH Clients](./03-windows-clients.md) · [Home](./index.md) · [Next: Troubleshooting & Cheat Sheet →](./05-troubleshooting-and-cheatsheet.md)

---

## 1. Connection Multiplexing (Instant Reconnects)

Opening a new SSH connection normally requires a full TCP + SSH handshake every time. **Multiplexing** reuses a single background master connection for all subsequent `ssh`, `scp`, `sftp`, and `rsync` calls to the same host — making them nearly instantaneous.

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

    subgraph LocalTools["Local Commands"]
        direction TB
        C1["ssh dev-app<br/>(Initial Handshake)"]:::edge
        C2["scp ./app.tar.gz dev-app:/tmp/"]:::edge
        C3["rsync -avz ./build/ dev-app:/var/www/"]:::edge
    end

    subgraph SocketLayer["Local ControlMaster Socket"]
        direction TB
        SOCK["~/.ssh/sockets/user@host-22<br/>ControlPersist 10m"]:::identity
    end

    subgraph RemoteHost["Remote Server"]
        direction TB
        SSHD["Single Persistent<br/>SSH Connection (dev-app)"]:::data
    end

    C1 -->|"Creates master"| SOCK
    C2 -->|"Instant reuse"| SOCK
    C3 -->|"Instant reuse"| SOCK
    SOCK -->|"Multiplexed Channels<br/>(Zero Extra Handshakes)"| SSHD
```

Add this to `~/.ssh/config` (macOS & Linux):

```sshconfig
Host *
    ControlMaster auto
    ControlPath ~/.ssh/sockets/%r@%h-%p
    ControlPersist 10m
```

Create the sockets directory first:

```bash
mkdir -p ~/.ssh/sockets
chmod 700 ~/.ssh/sockets
```

- `ControlMaster auto`: Creates a master connection if none exists, or reuses an existing one.
- `ControlPath`: Socket file location (`%r` = remote user, `%h` = host, `%p` = port).
- `ControlPersist 10m`: Keeps the master connection open in the background for 10 minutes after your last session closes.

To manually check or close a master connection:

```bash
ssh -O check dev-app
ssh -O exit dev-app
```

> [!NOTE]
> Connection multiplexing relies on UNIX domain sockets and is supported on **macOS and Linux** (and WSL on Windows), not in native Win32 OpenSSH.

---

## 2. Port Forwarding & Tunneling

SSH can securely tunnel TCP traffic between your local machine and remote networks.

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

    subgraph LocalFwd["Local Forward (-L): Reach Internal DB"]
        direction LR
        L_CLI["Local DB Client"]:::edge
        L_PORT["localhost:5432"]:::identity
        L_SSH["bastion<br/>(SSH Tunnel)"]:::service
        L_DB["db.internal:5432"]:::data
        L_CLI --> L_PORT -->|"Encrypted"| L_SSH --> L_DB
    end

    subgraph RemoteFwd["Remote Forward (-R): Expose Local Dev App"]
        direction LR
        R_EXT["Remote Caller"]:::edge
        R_SSH["bastion:8080<br/>(SSH Tunnel)"]:::service
        R_APP["localhost:3000<br/>(Your Laptop)"]:::data
        R_EXT --> R_SSH -->|"Encrypted"| R_APP
    end

    subgraph DynamicFwd["Dynamic Forward (-D): SOCKS5 Proxy"]
        direction LR
        D_BR["Browser / curl"]:::edge
        D_SOCKS["localhost:1080<br/>(SOCKS5)"]:::identity
        D_SSH["bastion<br/>(SSH Tunnel)"]:::service
        D_ANY["Any Internal Host<br/>&amp; Port"]:::obs
        D_BR --> D_SOCKS -->|"Encrypted"| D_SSH --> D_ANY
    end
```

### Local Port Forwarding (`-L`)

Access a service on a remote/internal network (such as a database or internal web UI) from your local machine:

```bash
# Syntax: ssh -L <local_port>:<target_host>:<target_port> <ssh_host>
ssh -L 5432:db.internal.example.com:5432 bastion
```

Now connecting your local DB client to `localhost:5432` securely tunnels through `bastion` to `db.internal.example.com:5432`.

### Remote Port Forwarding (`-R`)

Expose a service running on your **local** machine to a **remote** server (useful for testing webhooks or demos):

```bash
# Syntax: ssh -R <remote_port>:<local_host>:<local_port> <ssh_host>
ssh -R 8080:localhost:3000 bastion
```

Traffic hitting port `8080` on `bastion` is forwarded to `localhost:3000` on your laptop.

### Dynamic Port Forwarding / SOCKS5 Proxy (`-D`)

Turn an SSH server into an encrypted SOCKS5 proxy for your browser or CLI tools:

```bash
ssh -D 1080 -f -N bastion
```

Configure your browser or `curl --socks5-hostname localhost:1080 https://internal.example.com` to route traffic through `bastion`.

> [!TIP]
> **Useful Tunnel Flags:**
> - `-N`: Do not execute a remote shell/command (just forward ports).
> - `-f`: Go to the background after authenticating.
> - `-L` / `-R` / `-D` can also be saved permanently in `~/.ssh/config` using `LocalForward`, `RemoteForward`, and `DynamicForward`.

---

## 3. Secure File Transfers (`scp` & `rsync`)

### `scp` (Quick Single Files or Directories)

```bash
# Copy local file to remote server (uses ~/.ssh/config aliases automatically)
scp ./app.tar.gz dev-app:/tmp/

# Copy directory recursively from remote server to local
scp -r dev-app:/var/log/nginx ./nginx-logs/

# Copy through a jump host without a config entry
scp -J <username>@bastion.example.com ./file.txt <username>@10.0.10.42:/tmp/
```

### `rsync` over SSH (Large Transfers, Resumable, Incremental)

`rsync` only transfers changed bytes, supports compression (`-z`), preserves permissions (`-a`), and shows progress:

```bash
rsync -avz --progress ./build/ dev-app:/var/www/app/
```

---

## 4. Modular Configs (`Include`) & Conditional Logic (`Match`)

### Splitting Large Configs with `Include`

Keep work, personal, and client configs separate by placing `Include` at the **top** of `~/.ssh/config`:

```sshconfig
Include ~/.ssh/config.d/*
```

Then organize files like:
- `~/.ssh/config.d/work.conf`
- `~/.ssh/config.d/personal.conf`
- `~/.ssh/config.d/cloud.conf`

### Conditional Rules with `Match`

`Match` lets you apply settings dynamically based on hostname, user, or even the output of a local command:

```sshconfig
# Only use ProxyJump when NOT already on the corporate VPN/network
Match host *.internal.example.com !exec "ping -c 1 -W 1 10.0.0.1 >/dev/null 2>&1"
    ProxyJump bastion
```

---

## 5. Security Hardening

### Hardware Security Keys (FIDO2 / YubiKey)

OpenSSH 8.2+ natively supports FIDO2 hardware keys (`ed25519-sk`). The private key material never leaves the physical USB key and requires a physical touch to authenticate:

```bash
ssh-keygen -t ed25519-sk -C "yubikey-work"
```

### Host Key Checking

> [!CAUTION]
> **Avoid `StrictHostKeyChecking no` in persistent configs** — it silently disables Man-in-the-Middle protection. Keep `StrictHostKeyChecking ask` (the default) or `yes` for production automation.

### SSH Certificates (Team Scale)

For large teams, instead of distributing `authorized_keys` to hundreds of servers, consider **SSH Certificate Authorities (CAs)** (e.g., HashiCorp Vault, Smallstep `step-ca`, or AWS/Teleport). Users receive short-lived signed certificates (e.g., valid for 8 hours), eliminating stale keys and manual offboarding.

---

## 6. Interactive Escape Sequences

If a remote session freezes or you need to add a port forward on the fly, type **`Enter`** followed by an escape sequence:

| Sequence | Action |
|----------|--------|
| `~.` | **Immediately terminate** a hung SSH session |
| `~C` | Open the interactive SSH command line (e.g., type `-L 8080:localhost:80` to add a port forward without reconnecting) |
| `~^Z` | Suspend the SSH session to the background (`fg` to resume) |
| `~?` | List all supported escape sequences |

---

**Guide 4 of 5** · [← Windows SSH Clients](./03-windows-clients.md) · [Home](./index.md) · [Next: Troubleshooting & Cheat Sheet →](./05-troubleshooting-and-cheatsheet.md)
