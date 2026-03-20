# AGENTS.md

## Agent Skills (Arcana)

Skills are located in `.agents/skills/`. Each skill folder contains a `SKILL.md` file.

**Skill discovery:** Enumerate all `.agents/skills/*/SKILL.md` files. Parse YAML front-matter to get name and description. Load full content only when the skill is invoked.

Available skills:
- agent-audit
- create-pr
- deep-review
- deploy-prep
- feature-audit
- find-unused
- generate-tests
- idea-audit
- import-skill
- persist-knowledge
- quick-review
- security-check
- skill-scout
- v0-design
