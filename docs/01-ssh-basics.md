# 1. SSH Basics

[← Back to Index](./index.md) | [Next: Client Configuration (macOS & Linux) →](./02-client-configuration.md)

---

## What is SSH?

**Secure Shell (SSH)** is a cryptographic network protocol for securely operating network services over an unsecured network. It is most commonly used for:

- Logging into remote Linux/macOS/Windows servers (`ssh`)
- Securely transferring files (`scp`, `sftp`, `rsync`)
- Authenticating with Git providers (GitHub, GitLab, Bitbucket)
- Creating encrypted tunnels and port forwards

By default, SSH listens on **TCP port 22**.

---

## How Public-Key Authentication Works

Instead of typing a password every time you connect (which is vulnerable to brute-force attacks and phishing), SSH uses **asymmetric cryptography** with a **key pair**:

| Key | Example Filename | Where It Lives | Who Sees It |
|-----|------------------|----------------|-------------|
| **Private Key** | `~/.ssh/id_ed25519` | Your local machine only | **Only you — never share it** |
| **Public Key** | `~/.ssh/id_ed25519.pub` | Copied to remote servers (`~/.ssh/authorized_keys`) or Git hosts | Safe to share |

When you connect to a server:
1. The server checks if your public key is listed in `~/.ssh/authorized_keys`.
2. The server sends a cryptographic challenge encrypted with your public key.
3. Your local SSH client proves it owns the matching private key by signing/solving the challenge — without ever sending the private key over the network.

---

## Making Your First Connection

The basic syntax for connecting to a remote server is:

```bash
ssh <username>@<hostname-or-ip>
```

Example:

```bash
ssh alice@server.example.com
```

If the server runs SSH on a non-standard port (for example, `2222`):

```bash
ssh -p 2222 alice@server.example.com
```

### Host Key Verification (`known_hosts`)

The first time you connect to a new server, you will see a prompt like:

```text
The authenticity of host 'server.example.com (203.0.113.10)' can't be established.
ED25519 key fingerprint is SHA256:xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx.
Are you sure you want to continue connecting (yes/no/[fingerprint])?
```

- Typing `yes` saves the server's public host key into `~/.ssh/known_hosts`.
- On future connections, SSH compares the server's key against `known_hosts` to protect you from **Man-in-the-Middle (MitM)** attacks.

---

## Generating an SSH Key Pair

### Recommended: Ed25519

**Ed25519** is the modern standard: it is faster, produces shorter keys, and is more secure than legacy RSA keys.

```bash
ssh-keygen -t ed25519 -C "your_email@example.com"
```

When prompted:
1. **File location:** Press `Enter` to accept the default (`~/.ssh/id_ed25519`), or specify a custom path like `~/.ssh/id_ed25519_work` if you manage multiple identities.
2. **Passphrase:** Enter a strong passphrase. This encrypts your private key on disk so that even if someone steals the file, they cannot use it without the passphrase.

### Legacy Fallback: RSA (4096-bit)

Only use RSA if you must connect to an older system or network appliance that does not support Ed25519:

```bash
ssh-keygen -t rsa -b 4096 -C "your_email@example.com"
```

### Changing a Key's Passphrase Later

You can add or change a passphrase on an existing private key without regenerating the key:

```bash
ssh-keygen -p -f ~/.ssh/id_ed25519
```

---

## Copying Your Public Key to a Remote Server

### Method 1: `ssh-copy-id` (Recommended — macOS & Linux)

`ssh-copy-id` automatically appends your public key to the remote server's `~/.ssh/authorized_keys` and sets the correct permissions:

```bash
ssh-copy-id -i ~/.ssh/id_ed25519.pub <username>@<hostname>
```

### Method 2: Manual Copy (Works Everywhere, Including Windows)

If `ssh-copy-id` is not available, pipe your public key over SSH:

```bash
cat ~/.ssh/id_ed25519.pub | ssh <username>@<hostname> \
  "mkdir -p ~/.ssh && chmod 700 ~/.ssh && cat >> ~/.ssh/authorized_keys && chmod 600 ~/.ssh/authorized_keys"
```

> [!TIP]
> For GitHub, GitLab, or cloud providers, print your public key with `cat ~/.ssh/id_ed25519.pub` and paste the entire single-line output into their SSH Keys settings page.

---

## Managing Keys with `ssh-agent`

Typing your key's passphrase on every connection gets tedious. `ssh-agent` holds your decrypted private key in memory for your session.

### Linux

```bash
# Start the agent if it isn't already running
eval "$(ssh-agent -s)"

# Add your private key
ssh-add ~/.ssh/id_ed25519

# List loaded keys
ssh-add -l
```

### macOS (with Keychain Integration)

macOS integrates `ssh-agent` with Apple Keychain so your passphrase persists across reboots:

```bash
ssh-add --apple-use-keychain ~/.ssh/id_ed25519
```

*(Combine this with `UseKeychain yes` and `AddKeysToAgent yes` in `~/.ssh/config` — covered in [Client Configuration](./02-client-configuration.md).)*

### Windows

See [Windows SSH Clients](./03-windows-clients.md) for enabling the native Windows `ssh-agent` service, MobaXterm's MobAgent, or PuTTY's Pageant.

---

## Required File & Directory Permissions

OpenSSH **strictly enforces** file permissions on Linux and macOS. If your private key or `~/.ssh` directory is readable by other users, SSH will refuse to use it.

| Path | Permission | Octal | Purpose |
|------|------------|-------|---------|
| `~/.ssh` | `drwx------` | `700` | SSH directory (owner only) |
| `~/.ssh/id_ed25519` | `-rw-------` | `600` | Private key (owner read/write only) |
| `~/.ssh/id_ed25519.pub` | `-rw-r--r--` | `644` | Public key |
| `~/.ssh/config` | `-rw-------` | `600` | Client configuration |
| `~/.ssh/authorized_keys` | `-rw-------` | `600` | Allowed public keys (on remote server) |
| `~/.ssh/known_hosts` | `-rw-r--r--` | `644` | Verified host fingerprints |

To fix permissions on your local machine in one go:

```bash
chmod 700 ~/.ssh
chmod 600 ~/.ssh/config ~/.ssh/id_ed25519
chmod 644 ~/.ssh/id_ed25519.pub ~/.ssh/known_hosts
```

---

[← Back to Index](./index.md) | [Next: Client Configuration (macOS & Linux) →](./02-client-configuration.md)
