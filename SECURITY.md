# Security Policy

## Intellectual Property & Repository Separation

**ScheduleX** uses a split-repository architecture:
- **Public Showcase (`Dhiraj217/ScheduleX`)**: Frontend UI (`frontend/`), OpenAPI specification (`docs/openapi.json`), architecture documentation (`docs/`), and sample Excel import templates (`import_template*.xlsx`).
- **Private Core Repository**: Proprietary backend services, CP-SAT scheduling solver, AI/LLM pipelines, database models/migrations, and deployment configurations.

## Security Design Highlights

- **Authentication & RBAC**: JWT bearer authentication (`access_token` + `refresh_token`) with role-based access control (`super_admin`, `admin`, `hod`, `faculty`, `student`).
- **Multi-Tenant Isolation**: Academic records, schedules, and analytics queries are scoped strictly by `college_id` (and `dept_id` / `program_id` where applicable).
- **Read-Only AI Analytics Guardrails**: Natural-language SQL generation validates and restricts generated queries strictly to read-only `SELECT` statements.
- **Secret Management**: API keys, database credentials, and tokens are injected exclusively via runtime environment variables (`.env` is gitignored and never tracked).

## Reporting a Vulnerability

If you discover a security issue or credential exposure, please do **not** open a public issue with exploit details. Instead, report it privately via GitHub Security Advisories on the repository or contact **Dhiraj Rajai (DMR DEVELOPERS)** via `https://github.com/Dhiraj217`.
