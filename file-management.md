# File Management Document

## Purpose
This document defines how files are created, named, stored, reviewed, and retired within the security-compliance repository.

## Scope
Applies to all repository-managed artifacts, including documentation, configuration, evidence, and generated outputs.

## Naming conventions
- Use lowercase file names.
- Prefer hyphens between words.
- Include a descriptive suffix when needed, such as `-policy`, `-checklist`, or `-log`.
- Avoid spaces and special characters.

## Storage rules
- Store documents in the most specific relevant directory.
- Keep related files grouped together.
- Do not duplicate the same source of truth in multiple locations.
- Archive obsolete files rather than deleting them when historical retention is needed.

## Change control
- Review file additions and edits before committing.
- Keep changes small and focused.
- Update references when file names or locations change.
- Include a clear commit message describing the document change.

## Retention and cleanup
- Remove temporary files before merge.
- Archive superseded documents when they must be retained for audit purposes.
- Confirm that generated files are still needed before committing them.

## Ownership
- Each document should have an obvious maintainer or owning team.
- When ownership is unclear, record the responsible reviewer in the document or commit message.
