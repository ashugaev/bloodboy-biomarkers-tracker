# Code Style Review

Read all rule files from `.cursor/rules/` folder and create a complete checklist of all rules defined there.

Then systematically go through only the files that were modified by you in the current session and check compliance with each rule from your checklist.

## Severity Levels

- **CRITICAL**: Breaks functionality, violates architecture patterns, or causes runtime errors
- **MAJOR**: Violates core conventions (naming, imports, file structure)
- **MINOR**: Style inconsistencies, formatting issues

## Output Format

### Violations (grouped by severity)

```
[SEVERITY] file:line - brief description (rule: .cursor/rules/xxx.mdc)
```

Example:
```
[CRITICAL] src/components/Button/Button.tsx:12 - Relative import used (rule: .cursor/rules/general.mdc)
[MAJOR] src/utils/format.ts:5 - File name uses kebab-case (rule: .cursor/rules/general.mdc)
[MINOR] src/components/Header/Header.tsx:23 - Extra whitespace (rule: .cursor/rules/react-component.mdc)
```

### Statistics Summary

After fixes:
```
Fixed: X critical, Y major, Z minor violations
Remaining: A critical, B major, C minor violations
```

## Rules

1. Report only violations found in files modified during current session
2. Fix all violations automatically unless fixing would break functionality
3. Output must be minimal - one line per violation
4. Group violations by severity (critical first, then major, then minor)
5. Include statistics summary after fixes

