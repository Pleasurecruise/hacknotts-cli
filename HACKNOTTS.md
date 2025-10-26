# 🎯 HackNotts Project Context

## Project Overview
This is a HackNotts CLI project - an advanced AI-powered command-line interface tool that helps developers interact with multiple AI providers seamlessly. The CLI supports real-time chat, provider management, and export functionality.

## Technology Stack
- Language: TypeScript
- Framework: React (Ink for CLI)
- Key Libraries: 
  - Ink - React for CLI
  - Vitest - Testing framework
  - tsdown - Build tool
  - Multiple AI provider SDKs (OpenAI, Anthropic, etc.)

## Project Goals
1. Provide a unified interface for multiple AI providers
2. Enable seamless switching between different AI models
3. Support chat history export and session management
4. Offer extensible plugin system for custom functionality

## Current Status
### Completed
- ✅ Core CLI framework with Ink
- ✅ Multiple AI provider integration
- ✅ Command system (help, exit, clear, export, model, cd, init)
- ✅ Provider dashboard
- ✅ Chat interface with history
- ✅ Init command for project context
- ✅ Automatic HACKNOTTS.md context detection and injection

### In Progress
- 🔄 Testing coverage
- 🔄 Documentation improvements

### TODO
- ⏳ Additional AI providers
- ⏳ Plugin system enhancements
- ⏳ Configuration file support

## Important Notes
- The CLI uses a modular architecture with separate packages for aiCore, cli, and toolkit
- Commands are registered dynamically through the CommandRegistry system
- The HACKNOTTS.md file is **automatically detected** and injected as context in conversations
- Context is loaded at startup and when changing directories with `/cd`
- Context is invisibly added to the first message of each conversation
- Users don't see the context in chat history, but AI assistants can access it

## Team Members
- Development Team

---
*This file provides context for AI assistants to better understand your project.*
*Update it as your project evolves during the hackathon!*
