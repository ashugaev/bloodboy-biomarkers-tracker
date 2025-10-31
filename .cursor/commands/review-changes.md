# Code Style Review

Read all rule files from `.cursor/rules/` folder and create a complete checklist of all rules defined there.

Then systematically go through only the files that were modified by the you in the current session and check compliance with each rule from your checklist.

Return all violations found with:
- Description of the violation
- Reference to the specific rule file (e.g., `.cursor/rules/general.mdc`, `.cursor/rules/dexie-db.mdc`)
- File path where the violation occurs
- Line number (if applicable)

Format the output as a structured list grouped by rule file.

After identifying all violations, fix only the clear and obvious rule violations in the code.

