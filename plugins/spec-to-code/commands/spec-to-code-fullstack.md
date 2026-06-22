---
description: Coordinate a fullstack feature — agree the API contract, then run the backend and frontend specialists against it (no merged verification).
argument-hint: "[spec file/path/paste]"
---
Run the **spec-to-code-fullstack** skill on the spec below. It is a **thin orchestrator**, not a merged flow: ① resolve the shared **API contract** (endpoints, request/response, error codes) with the user; ② run **spec-to-code-backend** to build + verify the server against that contract; ③ run **spec-to-code-frontend** to build + verify the UI consuming that contract. Each half stays fully specialized; the contract is the handoff artifact.

Spec / target: $ARGUMENTS
