#!/usr/bin/env python3
"""
Quick validation script for skills - minimal version.

Adapted from anthropics/skills (skills/skill-creator/scripts/quick_validate.py).
Uses only the Python standard library (no pyyaml dependency).
"""

import sys
import os
import re
import json
from pathlib import Path


def parse_yaml_frontmatter(text):
    """
    Minimal YAML frontmatter parser for simple key: value and key: >- multiline strings.
    Sufficient for skill frontmatter; does not handle the full YAML spec.
    """
    result = {}
    lines = text.split('\n')
    i = 0
    while i < len(lines):
        line = lines[i]
        # Skip blank lines and comments
        if not line.strip() or line.strip().startswith('#'):
            i += 1
            continue
        # Match key: value
        m = re.match(r'^([a-z][a-z0-9_-]*)\s*:\s*(.*)', line)
        if not m:
            i += 1
            continue
        key = m.group(1)
        value = m.group(2).strip()
        # Multiline block scalar (>- or |-)
        if value in ('>-', '|-', '>', '|'):
            parts = []
            i += 1
            while i < len(lines):
                if lines[i].strip() == '' or not lines[i][0].isspace():
                    break
                parts.append(lines[i].strip())
                i += 1
            result[key] = ' '.join(parts) if value.startswith('>') else '\n'.join(parts)
            continue
        # Quoted or plain scalar
        if value.startswith('"') and value.endswith('"'):
            value = value[1:-1]
        elif value.startswith("'") and value.endswith("'"):
            value = value[1:-1]
        result[key] = value
        i += 1
    return result


def validate_skill(skill_path):
    """Basic validation of a skill."""
    skill_path = Path(skill_path)

    # Check SKILL.md exists
    skill_md = skill_path / 'SKILL.md'
    if not skill_md.exists():
        return False, "SKILL.md not found"

    # Read and validate frontmatter
    content = skill_md.read_text()
    if not content.startswith('---'):
        return False, "No YAML frontmatter found"

    # Extract frontmatter
    match = re.match(r'^---\n(.*?)\n---', content, re.DOTALL)
    if not match:
        return False, "Invalid frontmatter format"

    frontmatter_text = match.group(1)

    # Parse frontmatter
    try:
        frontmatter = parse_yaml_frontmatter(frontmatter_text)
        if not isinstance(frontmatter, dict):
            return False, "Frontmatter must be a YAML dictionary"
    except Exception as e:
        return False, f"Invalid frontmatter: {e}"

    # Define allowed properties
    ALLOWED_PROPERTIES = {'name', 'description', 'license', 'allowed-tools', 'metadata', 'compatibility', 'argument-hint', 'arguments', 'paths'}

    # Check for unexpected properties
    unexpected_keys = set(frontmatter.keys()) - ALLOWED_PROPERTIES
    if unexpected_keys:
        return False, (
            f"Unexpected key(s) in SKILL.md frontmatter: {', '.join(sorted(unexpected_keys))}. "
            f"Allowed properties are: {', '.join(sorted(ALLOWED_PROPERTIES))}"
        )

    # Check required fields
    if 'name' not in frontmatter:
        return False, "Missing 'name' in frontmatter"
    if 'description' not in frontmatter:
        return False, "Missing 'description' in frontmatter"

    # Validate name
    name = frontmatter.get('name', '')
    if not isinstance(name, str):
        return False, f"Name must be a string, got {type(name).__name__}"
    name = name.strip()
    if name:
        if not re.match(r'^[a-z0-9-]+$', name):
            return False, f"Name '{name}' should be kebab-case (lowercase letters, digits, and hyphens only)"
        if name.startswith('-') or name.endswith('-') or '--' in name:
            return False, f"Name '{name}' cannot start/end with hyphen or contain consecutive hyphens"
        if len(name) > 64:
            return False, f"Name is too long ({len(name)} characters). Maximum is 64 characters."

    # Validate description
    description = frontmatter.get('description', '')
    if not isinstance(description, str):
        return False, f"Description must be a string, got {type(description).__name__}"
    description = description.strip()
    if description:
        if '<' in description or '>' in description:
            return False, "Description cannot contain angle brackets (< or >)"
        if len(description) > 1024:
            return False, f"Description is too long ({len(description)} characters). Maximum is 1024 characters."

    # Validate compatibility field if present
    compatibility = frontmatter.get('compatibility', '')
    if compatibility:
        if not isinstance(compatibility, str):
            return False, f"Compatibility must be a string, got {type(compatibility).__name__}"
        if len(compatibility) > 500:
            return False, f"Compatibility is too long ({len(compatibility)} characters). Maximum is 500 characters."

    return True, "Skill is valid!"


def find_skills(root_path):
    """Find all skill directories under the given path (those containing SKILL.md)."""
    root = Path(root_path)
    return sorted(set(p.parent for p in root.rglob('SKILL.md')))


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python quick_validate.py <skill_directory_or_root> [--all]")
        sys.exit(1)

    target = sys.argv[1]
    run_all = '--all' in sys.argv

    if run_all:
        # Validate every skill under the target directory
        skill_dirs = find_skills(target)
        if not skill_dirs:
            print(f"No skills found under {target}")
            sys.exit(1)

        failed = []
        for skill_dir in skill_dirs:
            valid, message = validate_skill(skill_dir)
            status = "✓" if valid else "✗"
            print(f"  {status} {skill_dir.relative_to(target)}: {message}")
            if not valid:
                failed.append(skill_dir)

        print()
        print(f"Validated {len(skill_dirs)} skill(s): {len(skill_dirs) - len(failed)} passed, {len(failed)} failed")
        sys.exit(1 if failed else 0)
    else:
        valid, message = validate_skill(target)
        print(message)
        sys.exit(0 if valid else 1)
