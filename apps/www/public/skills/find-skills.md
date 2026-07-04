---
title: Find Skills
tags: [skill, ai, process]
created: 2026-05-10
updated: 2026-05-10
summary: Discover and install agent skills from the open skills ecosystem at skills.sh using the npx skills CLI.
aliases: [skills-cli, discover-skills]
---

# Find Skills

When a user needs help with a task that might already exist as an installable skill, search the ecosystem before building from scratch.

## When to use

- User asks "how do I do X" where X sounds like a common, reusable task.
- User says "find a skill for X", "is there a skill that can…".
- User wants to extend agent capabilities in a specific domain.

## How to apply

1. Identify the domain and specific task from the user's request.
2. Run `npx skills find [query]` with a specific keyword (e.g. `react performance`, `pr review`, `changelog`).
3. Present matching skills with their name, what they do, and the install command.
4. If the user wants to install: `npx skills add <owner/repo@skill> -g -y` (`-g` = global, `-y` = skip prompts).

Browse the full registry at [skills.sh](https://skills.sh/).

## When no skill is found

Acknowledge the gap, help directly with general capabilities, and offer `npx skills init my-skill-name` if the task repeats often enough to warrant a custom skill.

## Output should feel like

- A clear match (or honest "none found") with the install command ready to copy.
- No guessing at skill names — always run the search command first.

## Related

- [[skills-index]] — vault catalog.
