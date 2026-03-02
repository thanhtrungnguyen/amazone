#!/bin/bash
# PreToolUse hook for Edit|Write — enforce project coding standards
# Receives JSON on stdin with tool_name, tool_input.file_path, tool_input.content/new_string

INPUT=$(cat)

# Parse JSON using Node.js (portable — no jq dependency)
eval "$(node -e "
  const input = JSON.parse(process.argv[1]);
  const toolName = input.tool_name || '';
  const filePath = input.tool_input?.file_path || '';
  const content = toolName === 'Write'
    ? (input.tool_input?.content || '')
    : (input.tool_input?.new_string || '');
  console.log('TOOL_NAME=' + JSON.stringify(toolName));
  console.log('FILE_PATH=' + JSON.stringify(filePath));
  console.log('CONTENT=' + JSON.stringify(content));
" "$INPUT" 2>/dev/null)" || exit 0

# Rule 1: Block .env file writes (except .env.example)
if [[ "$FILE_PATH" == *.env ]] || [[ "$FILE_PATH" == *.env.local ]] || [[ "$FILE_PATH" == *.env.*.local ]]; then
  if [[ "$FILE_PATH" != *.env.example ]]; then
    echo "Blocked: Do not write .env files directly. Use .env.example for documentation. Create .env.local manually." >&2
    exit 2
  fi
fi

# Rule 2: Enforce package boundaries — packages must not import from apps/
if echo "$FILE_PATH" | grep -q '/packages/'; then
  if echo "$CONTENT" | grep -qE "from ['\"].*apps/|require\(['\"].*apps/"; then
    node -e "
      console.log(JSON.stringify({
        hookSpecificOutput: {
          hookEventName: 'PreToolUse',
          permissionDecision: 'deny',
          permissionDecisionReason: 'Package boundary violation: files in packages/ must not import from apps/. Packages are consumed by apps, not the reverse.'
        }
      }));
    "
    exit 0
  fi
fi

# Rule 3: Catch 'any' types in TypeScript files
if echo "$FILE_PATH" | grep -qE '\.(ts|tsx)$'; then
  if echo "$CONTENT" | grep -qE ':\s*any[^a-zA-Z]|:\s*any$|as\s+any[^a-zA-Z]|as\s+any$|<any>'; then
    node -e "
      console.log(JSON.stringify({
        hookSpecificOutput: {
          hookEventName: 'PreToolUse',
          permissionDecision: 'deny',
          permissionDecisionReason: 'TypeScript strict mode: do not use the \`any\` type. Use a specific type, a generic, or \`unknown\` instead.'
        }
      }));
    "
    exit 0
  fi
fi

# Rule 4: Catch console.log in production code (not test files)
if echo "$FILE_PATH" | grep -qE '\.(ts|tsx)$'; then
  if ! echo "$FILE_PATH" | grep -qE '\.test\.|\.spec\.|__tests__|/test/|/e2e/'; then
    if echo "$CONTENT" | grep -q 'console\.log'; then
      node -e "
        console.log(JSON.stringify({
          hookSpecificOutput: {
            hookEventName: 'PreToolUse',
            permissionDecision: 'deny',
            permissionDecisionReason: 'Remove console.log from production code. Use a structured logger or remove the statement. console.log is only allowed in test files.'
          }
        }));
      "
      exit 0
    fi
  fi
fi

# All checks passed
exit 0
