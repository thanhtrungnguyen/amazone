#!/bin/bash
# PreToolUse hook for Bash — enforce package manager and safety rules
# Receives JSON on stdin with tool_input.command

INPUT=$(cat)

# Parse JSON using Node.js (portable — no jq dependency)
COMMAND=$(node -e "
  const input = JSON.parse(process.argv[1]);
  console.log(input.tool_input?.command || '');
" "$INPUT" 2>/dev/null) || exit 0

# Rule 1: Block npm install/add/remove (npx is allowed via settings)
if echo "$COMMAND" | grep -qE '^\s*npm\s+(install|add|remove|uninstall|update|ci|run|start|build|test)'; then
  node -e "
    console.log(JSON.stringify({
      hookSpecificOutput: {
        hookEventName: 'PreToolUse',
        permissionDecision: 'deny',
        permissionDecisionReason: 'This project uses pnpm, not npm. Replace \`npm\` with \`pnpm\` in your command.'
      }
    }));
  "
  exit 0
fi

# Rule 2: Block yarn
if echo "$COMMAND" | grep -qE '^\s*yarn\s'; then
  node -e "
    console.log(JSON.stringify({
      hookSpecificOutput: {
        hookEventName: 'PreToolUse',
        permissionDecision: 'deny',
        permissionDecisionReason: 'This project uses pnpm, not yarn. Replace \`yarn\` with \`pnpm\` in your command.'
      }
    }));
  "
  exit 0
fi

# Rule 3: Block git push -f (shorthand for --force)
if echo "$COMMAND" | grep -qE 'git\s+push\s+.*\s-f(\s|$)'; then
  node -e "
    console.log(JSON.stringify({
      hookSpecificOutput: {
        hookEventName: 'PreToolUse',
        permissionDecision: 'deny',
        permissionDecisionReason: 'Force push is not allowed. Use \`git push --force-with-lease\` if you must, or resolve conflicts properly.'
      }
    }));
  "
  exit 0
fi

# Rule 4: Block docker compose down -v (destroys volumes/data)
if echo "$COMMAND" | grep -qE 'docker\s+compose\s+down\s+.*-v'; then
  node -e "
    console.log(JSON.stringify({
      hookSpecificOutput: {
        hookEventName: 'PreToolUse',
        permissionDecision: 'deny',
        permissionDecisionReason: 'docker compose down -v destroys database volumes. Use \`docker compose down\` without -v to preserve data, or \`docker compose stop\` to just stop services.'
      }
    }));
  "
  exit 0
fi

# Rule 5: Block docker compose rm
if echo "$COMMAND" | grep -qE 'docker\s+compose\s+rm'; then
  node -e "
    console.log(JSON.stringify({
      hookSpecificOutput: {
        hookEventName: 'PreToolUse',
        permissionDecision: 'deny',
        permissionDecisionReason: 'docker compose rm removes containers and their data. Use \`docker compose stop\` instead.'
      }
    }));
  "
  exit 0
fi

# Rule 6: Block rm .env*
if echo "$COMMAND" | grep -qE 'rm\s+.*\.env'; then
  node -e "
    console.log(JSON.stringify({
      hookSpecificOutput: {
        hookEventName: 'PreToolUse',
        permissionDecision: 'deny',
        permissionDecisionReason: 'Do not delete .env files. They contain local configuration. Recreate from .env.example if needed.'
      }
    }));
  "
  exit 0
fi

# All checks passed
exit 0
