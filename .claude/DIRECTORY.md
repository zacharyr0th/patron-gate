# .claude Directory Structure

Complete documentation of all components in the `.claude` directory.

**Last Updated:** 2025-11-17

---

## Table of Contents

1. [Overview](#overview)
2. [Skills](#skills)
3. [Commands](#commands)
4. [Hooks](#hooks)
5. [Utils](#utils)
6. [Docs](#docs)
7. [Configuration](#configuration)

---

## Overview

The `.claude` directory contains all Claude Code configuration, skills, commands, hooks, utilities, and documentation for the **claude-starter** repository.

**Purpose:** Production-ready template for building your own Claude Code toolkit with built-in TOON format support for 30-60% token optimization on tabular data.

**Directory Tree:**
```
.claude/
├── commands/          # Slash commands (manual invocation)
├── docs/             # Documentation and guides
├── hooks/            # Auto-run scripts on tool use
├── skills/           # Auto-invoked knowledge domains
├── utils/            # Utilities and helpers (TOON format tools)
├── settings.json     # Active configuration
├── settings.json.example  # Example settings
└── settings.local.json    # Local overrides
```

---

## Skills

**Location:** `.claude/skills/`

Skills are auto-invoked when users mention specific keywords. Claude Code automatically activates relevant skills based on conversation context.

### Total Skills: 23

### AI Skills (2)

#### 1. Anthropic Expert
**Path:** `skills/ai/anthropic/skill.md`
**Triggers:** Claude API, Anthropic API, Messages API, embeddings, prompt caching
**Purpose:** Expert guidance on Anthropic Claude API integration
**Documentation:** `skills/ai/anthropic/docs_anthropic/` (60+ files)

#### 2. Claude Code Expert
**Path:** `skills/ai/claude-code/skill.md`
**Triggers:** Claude Code, claude-code, skills, commands, hooks, MCP
**Purpose:** Expert on Claude Code CLI, configuration, and best practices
**Documentation:** Fetches from https://code.claude.com/docs/

### API Skills (2)

#### 3. Plaid Expert
**Path:** `skills/api/plaid/skill.md`
**Triggers:** Plaid API, bank connection, financial data, transactions
**Purpose:** Expert on Plaid API for financial data integration
**Documentation:** `skills/api/plaid/docs_plaid/` (600+ files)

#### 4. Stripe Expert
**Path:** `skills/api/stripe/skill.md`
**Triggers:** Stripe API, payments, subscriptions, checkout
**Purpose:** Expert on Stripe payment processing and subscriptions
**Documentation:** `skills/api/stripe/docs_stripe/` (400+ files)

### Backend Skills (1)

#### 5. Supabase Expert
**Path:** `skills/backend/supabase/skill.md`
**Triggers:** Supabase, PostgreSQL, auth, realtime, storage
**Purpose:** Expert on Supabase backend-as-a-service platform
**Documentation:** `skills/backend/supabase/docs_supabase/` (300+ files)

### Blockchain Skills (11)

#### Aptos Blockchain (4)

##### 6. Aptos Expert
**Path:** `skills/blockchain/aptos/skill.md`
**Triggers:** Aptos blockchain, Move language, Aptos SDK, transactions
**Purpose:** Expert on Aptos blockchain development and Move smart contracts
**Documentation:** `skills/blockchain/aptos/docs_aptos/` (150+ files)

##### 7. Aptos DApp Integration
**Path:** `skills/blockchain/aptos/dapp-integration/skill.md`
**Triggers:** Aptos dApp, Petra wallet, Aptos wallet, web3 integration
**Purpose:** Building decentralized applications on Aptos

##### 8. Aptos Move Testing
**Path:** `skills/blockchain/aptos/move-testing/skill.md`
**Triggers:** Move testing, unit tests, integration tests, test coverage
**Purpose:** Testing Move smart contracts on Aptos

##### 9. Aptos Token Standards
**Path:** `skills/blockchain/aptos/token-standards/skill.md`
**Triggers:** Aptos token, NFT, fungible asset, digital asset
**Purpose:** Token standards and asset management on Aptos

#### Shelby Protocol (7)

**Documentation Source:** `skills/blockchain/aptos/docs_shelby/` (52 files)

##### 10. Shelby SDK Developer
**Path:** `skills/blockchain/shelby/sdk-developer/skill.md`
**Triggers:** ShelbyNodeClient, ShelbyClient, @shelby-protocol/sdk, Shelby upload, Shelby download
**Purpose:** TypeScript SDK for decentralized blob storage on Aptos
**Coverage:**
- Upload/download workflows
- Session management & micropayment channels
- Multipart uploads for large files
- Token economics (APT + ShelbyUSD)
- Error handling & best practices

##### 11. Shelby Protocol Expert
**Path:** `skills/blockchain/shelby/protocol-expert/skill.md`
**Triggers:** Shelby Protocol, erasure coding, Clay Codes, placement groups, chunking
**Purpose:** System architecture and protocol design
**Coverage:**
- Erasure coding (Clay Codes) - 10 data + 6 parity chunks
- Placement groups and chunk distribution
- Read/write procedures
- Token economics & auditing
- Why Aptos & Jump Crypto

##### 12. Shelby CLI Assistant
**Path:** `skills/blockchain/shelby/cli-assistant/skill.md`
**Triggers:** shelby cli, shelby upload, shelby download, shelby init, shelby account
**Purpose:** Command-line tool for blob storage operations
**Coverage:**
- CLI installation & setup
- Account management (create, list, switch, delete)
- Upload/download commands with all flags
- Context switching (networks)
- Funding accounts (APT & ShelbyUSD)
- Troubleshooting common issues

##### 13. Shelby Smart Contracts
**Path:** `skills/blockchain/shelby/smart-contracts/skill.md`
**Triggers:** Shelby smart contract, blob metadata, micropayment channel, Shelby auditing
**Purpose:** Smart contract layer on Aptos blockchain
**Coverage:**
- Blob metadata management
- Micropayment channels for efficient payments
- Auditing system (cryptographic proofs)
- Storage commitments
- Move smart contract patterns
- Transaction workflows

##### 14. Shelby Storage Integration
**Path:** `skills/blockchain/shelby/storage-integration/skill.md`
**Triggers:** integrate Shelby, video streaming, AI training data, data analytics, migration
**Purpose:** Integrating Shelby into applications
**Coverage:**
- Use case evaluation (video streaming, AI/ML, analytics)
- Architecture patterns (direct, caching, async, hybrid)
- Migration strategies from S3/GCS
- Cost optimization techniques
- Performance tuning
- Monitoring & observability

##### 15. Shelby Network & RPC Expert
**Path:** `skills/blockchain/shelby/network-rpc/skill.md`
**Triggers:** Shelby RPC, storage provider, Cavalier, tile architecture, private network
**Purpose:** Network infrastructure and performance
**Coverage:**
- RPC server architecture
- Storage provider (Cavalier) implementation in C
- Tile architecture & workspaces
- DoubleZero private fiber network
- Performance optimizations (streaming, connection pooling)
- Request hedging & scalability

##### 16. Shelby DApp Builder
**Path:** `skills/blockchain/shelby/dapp-builder/skill.md`
**Triggers:** Shelby dApp, Petra wallet, React Shelby, Vue Shelby, browser storage
**Purpose:** Building decentralized applications with Shelby storage
**Coverage:**
- Wallet integration (Petra)
- Browser SDK usage
- React & Vue components
- File upload/download UIs
- Complete dApp examples (gallery, video platform, file sharing)
- Best practices for UX, performance, security

##### 17. Shelby (Legacy)
**Path:** `skills/blockchain/shelby/skill.md`
**Note:** Original generic Shelby skill, now superseded by specialized skills above

### Data Skills (1)

#### 18. TOON Formatter
**Path:** `skills/data/toon-formatter/skill.md`
**Triggers:** data, array, table, JSON, API response, log, metrics, benchmark
**Purpose:** Auto-applies TOON format for 30-60% token optimization
**Coverage:**
- Detects when TOON is beneficial (≥5 items, ≥60% uniformity)
- Shows token savings automatically
- Aggressive mode: applies by default when criteria met
- Format conversion and validation

### Dev Skills (5)

#### 19. Claude Command Builder
**Path:** `skills/dev/claude-command-builder/skill.md`
**Triggers:** create command, slash command, build command, new workflow
**Purpose:** Build custom slash commands for Claude Code

#### 20. Claude Hook Builder
**Path:** `skills/dev/claude-hook-builder/skill.md`
**Triggers:** create hook, build hook, post-tool validation, hook configuration
**Purpose:** Build custom hooks for Claude Code automation

#### 21. Claude MCP Expert
**Path:** `skills/dev/claude-mcp-expert/skill.md`
**Triggers:** MCP, Model Context Protocol, MCP server, context server
**Purpose:** Expert on MCP for extending Claude Code capabilities

#### 22. Claude Settings Expert
**Path:** `skills/dev/claude-settings-expert/skill.md`
**Triggers:** settings.json, configuration, Claude Code config, customize
**Purpose:** Expert on Claude Code configuration and settings

#### 23. Claude Skill Builder
**Path:** `skills/dev/claude-skill-builder/skill.md`
**Triggers:** create skill, build skill, new skill, skill development
**Purpose:** Build custom skills for Claude Code

---

## Commands

**Location:** `.claude/commands/`

Commands are slash commands that users invoke manually (e.g., `/convert-to-toon`).

### Total Commands: 5 (All TOON-related)

#### 1. `/analyze-tokens`
**File:** `commands/analyze-tokens.md`
**Purpose:** Analyze and compare token usage between JSON and TOON formats
**Usage:** `/analyze-tokens <file>`
**Features:**
- Compares JSON vs TOON token counts
- Shows percentage savings
- Estimates API cost reduction
- Identifies optimization opportunities
- No file modification (analysis only)

#### 2. `/convert-to-toon`
**File:** `commands/convert-to-toon.md`
**Purpose:** Convert JSON files to TOON format with full analysis
**Usage:** `/convert-to-toon <file>`
**Features:**
- Full conversion workflow
- Token usage comparison
- Creates .toon output file
- Validates conversion
- Shows savings metrics

#### 3. `/toon-decode`
**File:** `commands/toon-decode.md`
**Purpose:** Decode TOON format back to JSON
**Usage:** `/toon-decode <file>`
**Features:**
- Converts .toon → .json
- Uses compiled Zig decoder
- Validates output
- Preserves data integrity

#### 4. `/toon-encode`
**File:** `commands/toon-encode.md`
**Purpose:** Encode JSON to TOON format
**Usage:** `/toon-encode <file>`
**Features:**
- Converts .json → .toon
- Uses compiled Zig encoder
- Optimizes for token efficiency
- Validates encoding

#### 5. `/toon-validate`
**File:** `commands/toon-validate.md`
**Purpose:** Validate TOON format syntax and structure
**Usage:** `/toon-validate <file>`
**Features:**
- Checks TOON syntax
- Validates structure
- Reports errors with line numbers
- Ensures spec compliance

---

## Hooks

**Location:** `.claude/hooks/`

Hooks run automatically after tool use (e.g., after Edit, Write operations). Currently **disabled by default** in settings.json.

### Total Hooks: 5

#### 1. File Size Monitor
**File:** `hooks/file-size-monitor.sh`
**Type:** Post-tool validation
**Triggers on:** Edit, Write
**Purpose:** Monitor and warn about large files
**Features:**
- Checks file size after edits/writes
- Warns if file exceeds threshold (default: 1MB)
- Suggests optimization strategies
- Non-blocking (warning level)

#### 2. Markdown Formatter
**File:** `hooks/markdown-formatter.sh`
**Type:** Post-tool formatting
**Triggers on:** Write, Edit (*.md files)
**Purpose:** Auto-format markdown files
**Features:**
- Formats markdown for consistency
- Fixes common markdown issues
- Ensures proper line breaks
- Validates markdown syntax

#### 3. Secret Scanner
**File:** `hooks/secret-scanner.sh`
**Type:** Post-tool security
**Triggers on:** Write, Edit
**Purpose:** Detect accidentally committed secrets
**Features:**
- Scans for API keys, tokens, passwords
- Checks common secret patterns
- Blocks commits with detected secrets (error level)
- Protects sensitive data

#### 4. Settings Backup
**File:** `hooks/settings-backup.sh`
**Type:** Post-tool backup
**Triggers on:** Edit, Write (settings.json)
**Purpose:** Backup settings.json before changes
**Features:**
- Creates timestamped backups
- Prevents configuration loss
- Keeps last 5 backups
- Easy rollback capability

#### 5. TOON Validator
**File:** `hooks/toon-validator.sh`
**Type:** Post-tool validation
**Triggers on:** Write, Edit (*.toon files)
**Purpose:** Validate TOON format syntax
**Features:**
- Validates TOON syntax after edits
- Uses compiled Zig validator
- Reports errors with line numbers
- Ensures format compliance

### Hook Configuration

**Enable hooks in `settings.json`:**
```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          {
            "type": "command",
            "command": "$CLAUDE_PROJECT_DIR/.claude/hooks/file-size-monitor.sh"
          }
        ]
      }
    ]
  }
}
```

**See:** `hooks/README.md` for detailed documentation

---

## Utils

**Location:** `.claude/utils/`

Utilities and helper tools. Currently contains TOON format implementation.

### TOON Format Tools

**Path:** `utils/toon/`

Complete TOON v2.0 implementation with Zig encoder/decoder for 30-60% token savings on tabular data.

#### Binary

**Compiled Zig Binary:**
```
utils/toon/zig-out/bin/toon
```

**Commands:**
```bash
# Encode JSON to TOON
toon encode input.json -o output.toon

# Decode TOON to JSON
toon decode input.toon -o output.json

# Validate TOON file
toon validate data.toon
```

#### Documentation

**Main Files:**
- `README.md` - TOON format specification and usage
- `README_ZIG.md` - Zig implementation details
- `INSTALL.md` - Installation and build instructions
- `VERSION.md` - Version history and changelog

**Guides:** `utils/toon/guides/`
- `encoding.md` - Encoding strategies
- `configuration.md` - Configuration options
- `optimization.md` - Performance optimization
- `migration-v1-to-v2.md` - Migration guide

**Examples:** `utils/toon/examples/`
- `basic-tabular.md` - Basic tabular data
- `nested-objects.md` - Nested structures
- `inline-arrays.md` - Inline array syntax
- `expanded-lists.md` - Expanded list format
- `escape-sequences.md` - Escaping special characters
- `quoting-rules.md` - Quoting conventions
- `delimiters.md` - Custom delimiters
- `key-folding.md` - Key folding optimization
- `strict-mode.md` - Strict validation mode

**References:** `utils/toon/references/`
- `abnf-grammar.md` - Formal ABNF grammar
- `test-cases.md` - Test suite
- `compliance-matrix.md` - Spec compliance
- `v2-changelog.md` - Version 2.0 changes

#### Source Code

**Files:**
- `toon.zig` - Complete Zig implementation (encoder + decoder)
- `build.zig` - Zig build configuration
- `test-runner.sh` - Automated test runner
- `enforce-toon.sh` - Enforcement script

**Test Fixtures:** `utils/toon/test-fixtures/`
- Sample TOON and JSON files for testing

#### What is TOON?

**Token-Oriented Object Notation** reduces token consumption by 30-60% for tabular data.

**When to Use:**
- ✅ Arrays with ≥5 items
- ✅ Objects with ≥60% field uniformity
- ✅ API responses, logs, metrics, benchmarks
- ✅ Database query results

**When NOT to Use:**
- ❌ Deeply nested objects
- ❌ Small arrays (<5 items)
- ❌ Non-uniform data (<60% same fields)

**Example:**
```toon
// JSON: ~120 tokens
[
  {"method": "GET", "path": "/api/users", "auth": "required"},
  {"method": "POST", "path": "/api/users", "auth": "required"}
]

// TOON: ~70 tokens (40% savings)
[2]{method,path,auth}:
  GET,/api/users,required
  POST,/api/users,required
```

---

## Docs

**Location:** `.claude/docs/`

Documentation, guides, and reference materials.

### Core Documentation (5 files)

#### 1. README.md
**Purpose:** Documentation hub and navigation
**Content:**
- Quick start guide
- Component overview
- TOON format introduction
- Links to all documentation

#### 2. FAQ.md
**Purpose:** Frequently asked questions
**Content:**
- Common questions about skills, commands, hooks
- TOON format FAQ
- Troubleshooting tips
- Best practices

#### 3. creating-components.md
**Purpose:** Guide to creating skills, commands, and hooks
**Content:**
- Component structure and templates
- Naming conventions
- Best practices
- Size guidelines
- Testing strategies

#### 4. examples.md
**Purpose:** Copy-paste templates for components
**Content:**
- Complete skill examples (Next.js, Auth, Testing)
- Command examples (Git, Deployment)
- Hook examples (Linting, Security, Formatting)
- Ready-to-use templates

#### 5. toon-guide.md
**Purpose:** Complete TOON format reference
**Content:**
- Format specification
- Encoding/decoding rules
- Token estimation formulas
- Use cases and examples
- Migration guide

### External Documentation

#### Coinbase
**Path:** `docs/coinbase/`
**Index:** `docs/coinbase/INDEX.md`
**Content:** Coinbase API documentation (fetched)

#### Google
**Path:** `docs/google/`
**Subdirs:**
- `android/` - Android development docs
- `chrome/` - Chrome extension docs

---

## Configuration

**Location:** `.claude/`

### settings.json
**Current active configuration**

**Default Configuration:**
```json
{
  "hooks": {
    "PostToolUse": []
  },
  "comment": "Hooks are disabled by default."
}
```

**Features:**
- Hooks disabled by default (empty array)
- Minimal configuration
- Easy to customize

### settings.json.example
**Example configuration template**

Shows how to enable hooks and configure Claude Code features.

### settings.local.json
**Local development overrides**

**Purpose:**
- Override settings for local development
- Not committed to version control
- Personal preferences

---

## Usage

### Getting Started

1. **Clone or copy `.claude/` directory:**
   ```bash
   git clone <repo-url>
   # Or copy to your project:
   cp -r .claude /your-project/
   ```

2. **Try TOON commands:**
   ```bash
   /convert-to-toon data.json
   /analyze-tokens api-response.json
   ```

3. **Let skills auto-activate:**
   - Mention "Shelby Protocol" → Shelby skills activate
   - Mention "Stripe API" → Stripe skill activates
   - Mention "data array" → TOON formatter activates

4. **Build your own:**
   - Add skills to `skills/`
   - Create commands in `commands/`
   - Enable hooks in `settings.json`

### Key Features

**✅ Auto-invoked Skills (23)**
- AI: Claude, Anthropic APIs
- APIs: Stripe, Plaid
- Backend: Supabase
- Blockchain: Aptos (4 skills), Shelby (7 skills)
- Data: TOON formatter
- Dev: Claude Code tools (5 skills)

**✅ TOON Format Integration**
- 30-60% token savings on tabular data
- Compiled Zig encoder/decoder
- 5 slash commands
- Auto-detection skill
- Complete documentation

**✅ Production Ready**
- Comprehensive documentation
- Example templates
- Best practices built-in
- Tested and validated

---

## Statistics

- **Total Skills:** 23
- **Total Commands:** 5
- **Total Hooks:** 5 (disabled by default)
- **Total Utils:** 1 (TOON format tools)
- **Documentation Files:**
  - Core: 5
  - TOON: 20+
  - External: 1000+ (Coinbase, Google, Plaid, Stripe, etc.)

---

## Contributing

This is a starter template. Build on top:

1. **Add Skills** for your frameworks/libraries
2. **Create Commands** for your workflows
3. **Enable Hooks** for your quality standards (optional)
4. **Add Documentation** for your team
5. **Use TOON format** in your docs to save tokens

**Zero dependencies required** - everything works through instructions!

---

## Resources

### Claude Code
- **Documentation:** https://code.claude.com/docs
- **This Template:** See `docs/README.md`

### TOON Format
- **Specification:** `utils/toon/README.md`
- **Official Repo:** https://github.com/toon-format/spec
- **Website:** https://toonformat.dev

---

**Template Version:** 2.0
**Last Updated:** 2025-11-17
**Repository:** claude-starter
