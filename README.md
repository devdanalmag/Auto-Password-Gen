# 🔐 PassForge — Smart Password Generator

A Chrome extension that automatically detects password fields on any website and fills them with smart, deterministic, domain-based passwords. No cloud. No storage. Just math.

---

## ✨ Features

- **Auto-Detection** — Finds password fields on any page, including dynamically loaded ones (React, Vue, Angular, etc.)
- **6 Built-in Methods** — Choose from multiple generation algorithms, each producing a unique password per site
- **Custom Templates** — Build your own pattern with 14 template variables
- **Site Overrides** — Assign specific generation methods to individual domains
- **Default Mode** — Use a single master password across all sites when preferred
- **One-Click Fill** — A floating key icon appears next to every password field
- **Copy to Clipboard** — Quickly copy the generated password without filling
- **Auto-Fill** — Optionally auto-fill passwords on page load
- **Live Preview** — See the generated password for the current site in real time
- **Zero Storage** — Passwords are generated on the fly from deterministic rules, never stored

---

## 🚀 Installation

### From Source (Developer Mode)

1. **Clone the repository**
   ```bash
   git clone https://github.com/devdanalmag/Auto-Password-Gen.git
   ```

2. **Open Chrome Extensions**
   - Navigate to `chrome://extensions/`
   - Enable **Developer mode** (top-right toggle)

3. **Load the extension**
   - Click **Load unpacked**
   - Select the cloned project folder

4. **Pin the extension** (optional)
   - Click the puzzle icon in the toolbar and pin **PassForge**

---

## 🔑 Password Generation Methods

PassForge generates passwords deterministically from the **domain name** and the **current year**. The same domain always produces the same password within a given year.

| Method | Name | Example (github) |
|:------:|:-----|:------------------|
| 1 | **Star-Domain-Year-Hash** | `*Github2026#` |
| 2 | **Reverse Domain** | `*buhtiG2026#` |
| 3 | **Domain-Split-Length** | `Git#6hub!26` |
| 4 | **Vowel Shift** | `*G1th5b2026#` |
| 5 | **Keyboard Shift** | `*Hotjiy2026#` |
| 6 | **Custom Template** | *(user-defined)* |

### Method Details

- **Method 1** — The original format: `*` + Capitalized domain + Year + `#`
- **Method 2** — Same as Method 1 but the domain is reversed
- **Method 3** — Splits the domain: first 3 chars + `#` + length + last 3 chars + `!` + short year
- **Method 4** — Vowels are replaced with symbols: `a→@`, `e→3`, `i→1`, `o→0`, `u→5`
- **Method 5** — Each letter is shifted one key to the right on a QWERTY keyboard
- **Method 6** — Fully customizable using a template string

---

## 🧩 Custom Template Variables

When using **Method 6**, you can craft your own password pattern using these variables:

| Variable | Description | Example (github) |
|:---------|:------------|:-----------------|
| `{domain}` | Lowercase domain | `github` |
| `{Domain}` | Capitalized domain | `Github` |
| `{DOMAIN}` | Uppercase domain | `GITHUB` |
| `{year}` | Full year | `2026` |
| `{yy}` | Short year | `26` |
| `{len}` | Domain length | `6` |
| `{rev}` | Reversed domain | `buhtig` |
| `{Rev}` | Reversed + capitalized | `Buhtig` |
| `{REV}` | Reversed + uppercase | `BUHTIG` |
| `{first3}` | First 3 characters | `git` |
| `{First3}` | First 3 capitalized | `Git` |
| `{last3}` | Last 3 characters | `hub` |
| `{Last3}` | Last 3 capitalized | `Hub` |
| `{vowel}` | Vowel-shifted domain | `G1th5b` |
| `{kbd}` | Keyboard-shifted domain | `Hotjiy` |

**Example template:** `@{Domain}_{yy}!` produces `@Github_26!`

---

## 🏗️ Project Structure

```
Password-Gen/
├── manifest.json        # Extension manifest (Manifest V3)
├── background.js        # Service worker — settings storage & message passing
├── generator.js         # Password generation engine (6 methods + templates)
├── content.js           # Content script — field detection, auto-fill, icon injection
├── content.css          # Styles for the injected fill/copy buttons & toast
├── popup.html           # Extension popup UI
├── popup.css            # Popup styles
├── popup.js             # Popup logic — settings management, live preview
└── icons/
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```

---

## ⚙️ How It Works

1. **Content script** (`content.js` + `generator.js`) is injected into every page
2. A `MutationObserver` watches for `<input type="password">` fields — including ones added dynamically
3. A floating **key icon** appears next to each detected field
4. Clicking the icon generates and fills the password using the active method for the current domain
5. Settings and site overrides are stored locally via `chrome.storage.local`
6. The **popup** provides a full settings UI with live preview, method selection, and override management

---

## 🛡️ Privacy & Security

- **No network requests** — Passwords are generated entirely on-device
- **No password storage** — Passwords are derived deterministically and never saved
- **Local settings only** — All preferences stay in `chrome.storage.local`
- **Minimal permissions** — Only `activeTab`, `storage`, and `scripting`

---

## 📄 License

MIT License. See [LICENSE](LICENSE) for details.

---

> Built with care by [devdanalmag](https://github.com/devdanalmag)
