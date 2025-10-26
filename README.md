# hacknotts-cli

![demo](docs/assests/show.gif)

> An interactive AI-powered command-line interface for HackNotts 2025 - Chat with multiple AI providers through an elegant terminal interface.

## Overview

**hacknotts-cli** is a sophisticated AI interaction tool that brings multiple AI providers to your terminal. Built with React and Ink, it provides a beautiful, interactive chat experience with support for 10+ AI providers, an extensible plugin system, and MCP (Model Context Protocol) integration.

## Features

- **Multi-Provider Support** - Seamlessly switch between OpenAI, Anthropic, Google, xAI, DeepSeek, Azure, and more
- **Interactive Terminal UI** - Beautiful React-based interface powered by Ink with animations and streaming responses
- **Extensible Plugin System** - Pre/post hook architecture for custom functionality
- **Built-in Commands** - `/help`, `/provider`, `/export`, `/model`, and more
- **Chat History Export** - Save conversations to JSON or Markdown
- **MCP Integration** - Built-in tools for fetch, filesystem, memory, and time operations
- **Provider Dashboard** - Visual provider status and easy switching
- **Streaming Responses** - Real-time message streaming from AI models
- **Configuration Persistence** - Save your preferences and default provider
- **Full TypeScript Support** - Type-safe development experience

## Installation

```bash
git clone https://github.com/Pleasurecruise/hacknotts-cli.git
cd hacknotts-cli
npm install
npm run build
```

The CLI will be installed globally as `hacknotts` command.

## Quick Start

1. **Configure your API keys** - Create a `.env` file in the project root:

```env
# OpenAI
OPENAI_API_KEY=your-openai-api-key
OPENAI_MODEL=gpt-4

# Anthropic
ANTHROPIC_API_KEY=your-anthropic-api-key
ANTHROPIC_MODEL=claude-3-5-sonnet-20241022

# Google
GOOGLE_API_KEY=your-google-api-key
GOOGLE_MODEL=gemini-1.5-pro

# DeepSeek
DEEPSEEK_API_KEY=your-deepseek-api-key
DEEPSEEK_MODEL=deepseek-chat

# Add other providers as needed
```

2. **Run the CLI**:

```bash
hacknotts
```

3. **Start chatting**:

```
Welcome to the HackNotts 2025 CLI!

> hi
Hello! How can I assist you with your HackNotts 2025 project submission today?

> /help
Available commands:
  /help (h, ?)          - Show this help message
  /provider (p)         - Switch AI provider
  /model (m)            - Switch model
  /export (save)        - Export chat history
  /clear (cls, c)       - Clear chat
  /exit (quit, q)       - Exit application
```

## Available Commands

| Command | Aliases | Description |
|---------|---------|-------------|
| `/help` | `h`, `?` | Show available commands |
| `/provider` | `p`, `providers` | Open provider dashboard to switch providers |
| `/model <name>` | `m` | Temporarily switch to a specific model |
| `/export [format]` | `save`, `download` | Export chat history (json or markdown) |
| `/clear` | `cls`, `c` | Clear chat history |
| `/cd <path>` | `chdir` | Change working directory |
| `/exit` | `quit`, `q` | Exit the application |

## Supported AI Providers

hacknotts-cli supports the following AI providers:

- **OpenAI** - GPT-4, GPT-3.5, and custom models
- **Anthropic** - Claude 3.5 Sonnet, Claude 3 Opus/Haiku
- **Google** - Gemini 1.5 Pro/Flash
- **xAI** - Grok models
- **DeepSeek** - DeepSeek Chat
- **Azure OpenAI** - Azure-hosted OpenAI models
- **OpenRouter** - Access to multiple models through OpenRouter
- **OpenAI Compatible** - Custom endpoints compatible with OpenAI API

Each provider can be configured with:
- API keys
- Custom base URLs
- Default models
- Provider-specific options

## Configuration

### Environment Variables

Configure providers through `.env` file:

```env
# Provider API Keys
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_API_KEY=...
XAI_API_KEY=...
DEEPSEEK_API_KEY=...
AZURE_OPENAI_API_KEY=...

# Custom Models (optional)
OPENAI_MODEL=gpt-4
ANTHROPIC_MODEL=claude-3-5-sonnet-20241022
GOOGLE_MODEL=gemini-1.5-pro

# Custom Endpoints (optional)
OPENAI_BASE_URL=https://api.openai.com/v1
```

### User Configuration

User preferences are stored in `~/.hacknotts-cli/config.json`:

```json
{
  "defaultProvider": "openai",
  "defaultModel": "gpt-4",
  "theme": "default"
}
```

## Plugin System

hacknotts-cli features an extensible plugin architecture:

### Plugin Hooks

Plugins can implement various hooks:

- **First-Hook** - `resolveModel`, `loadTemplate` (returns first valid result)
- **Sequential-Hook** - `configureContext`, `transformParams`, `transformResult` (chain transformations)
- **Parallel-Hook** - `onRequestStart`, `onRequestEnd`, `onError` (side effects)
- **Stream-Hook** - `transformStream` (stream processing)

### MCP Integration

Built-in MCP tools for extended functionality:

- **Fetch Tool** - Make HTTP requests with custom headers
- **Filesystem Tool** - Read, write, and list files
- **Memory Tool** - Persistent key-value storage
- **Time Tool** - Get current time and timezone info
- **Sequential Thinking Tool** - Multi-step reasoning with memory

## Export Functionality

Export your chat history in multiple formats:

```bash
# Export to JSON
> /export json

# Export to Markdown
> /export markdown

# Default export (JSON)
> /export
```

Exported files include:
- Full message history
- Timestamps
- Role indicators
- Message metadata

## Development

### Project Structure

```
hacknotts-cli/
├── packages/
│   ├── cli/              # Main CLI application
│   │   ├── src/
│   │   │   ├── index.tsx # Entry point
│   │   │   ├── app.tsx   # Main app component
│   │   │   ├── components/
│   │   │   └── services/
│   ├── aiCore/           # AI provider and plugin system
│   │   ├── src/
│   │   │   ├── core/
│   │   │   │   ├── providers/
│   │   │   │   ├── plugins/
│   │   │   │   └── runtime/
│   └── toolkit/          # MCP utilities
│       └── src/
│           ├── manager.ts
│           └── plugin.ts
├── docs/
├── .env                  # Provider configuration
└── package.json
```

### Build Commands

```bash
# Development with watch mode
npm run dev

# Production build
npm run build

# Run tests
npm test

# Lint and format
npm run lint
npm run format
```

### Testing

```bash
# Run tests once
npm test

# Watch mode
npm run test:watch
```

## Requirements

- Node.js >= 22.12.0
- npm or yarn

## Contributing

Contributions are welcome! This project was created for HackNotts 2025.

### Authors

- **Pleasurecruise** - [GitHub](https://github.com/Pleasurecruise)
- **IvanHanloth** - [GitHub](https://github.com/IvanHanloth)

## License

MIT License - see [LICENSE](LICENSE) file for details

## References

- [Cherry Studio](https://github.com/CherryHQ/cherry-studio) - Inspiration for the AI core architecture
- [Vercel AI SDK](https://sdk.vercel.ai/) - Underlying AI SDK
- [Ink](https://github.com/vadimdemedes/ink) - React for terminal interfaces
- [Model Context Protocol](https://modelcontextprotocol.io/) - MCP specification

## Acknowledgments

Created for **HackNotts 2025** - A hackathon project demonstrating advanced AI integration in CLI applications.

---

**Happy Hacking!** 🚀