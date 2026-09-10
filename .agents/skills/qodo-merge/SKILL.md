---
name: qodo-merge
description: Automated code review guidelines for identifying race conditions, memory leaks, and breaking API changes.
---
# Qodo Merge Review Skill
- Review all pull requests and major code edits for concurrency race conditions.
- Flag missing error handling or missing transaction locks on database writes.
- Suggest concise inline fixes for identified anti-patterns.
