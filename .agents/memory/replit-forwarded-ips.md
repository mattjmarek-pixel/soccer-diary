---
name: Replit forwarded client IPs
description: Express rate limiting behind Replit's proxy needs forwarded client IPs to be trusted.
---

Express rate limiters use `req.ip`, which depends on Express trusting the forwarded client IP header. In this Replit project, rate-limit requests included `X-Forwarded-For`; with proxy trust disabled, express-rate-limit reported a validation error and could not reliably identify clients. A one-hop trust setting resolved it.

**Why:** Without the forwarded client IP, per-IP limits can collapse many users into one proxy address or trigger express-rate-limit validation errors.

**How to apply:** When adding Express per-IP limits in this project, preserve the one-hop trusted proxy configuration and verify startup logs contain no forwarded-header validation warning.
