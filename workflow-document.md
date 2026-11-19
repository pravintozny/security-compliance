# Workflow Document

## Purpose
This document describes the standard workflow for proposing, reviewing, approving, and recording changes in the security-compliance repository.

## Scope
Applies to all changes to repository-managed artifacts. File handling follows `file-management.md`.

## Roles
- **Author**: prepares the change and opens the pull request.
- **Reviewer**: checks the change for accuracy, scope, and conventions.
- **Sponsor**: approves the change request and any external communication.

## Workflow steps
1. **Request**: the sponsor records the requested change.
2. **Branch**: the author creates a branch from `main` using a descriptive prefix such as `feature/`.
3. **Prepare**: the author makes small, focused edits following `file-management.md`.
4. **Commit**: the author commits with a clear message describing the change.
5. **Pull request**: the author pushes the branch and opens a pull request against `main`.
6. **Review**: a reviewer checks the change and requests updates as needed.
7. **Approval**: the sponsor approves the change.
8. **Merge**: the merge happens only after approval, and is done by an authorized maintainer.
9. **Record**: update references and archive superseded documents when needed.

## Controls
- Never commit directly to `main`.
- Do not merge without review and sponsor approval.
- Remove temporary files before merge.
- Do not commit secrets or credentials.

## Ownership
Each change records its responsible reviewer in the pull request or commit message.
