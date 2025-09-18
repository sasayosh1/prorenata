#!/usr/bin/env python3
"""
Baseline creation script for bridge workflow.
Creates a SHA256 manifest of tracked files for change detection.
"""

import os
import json
import hashlib
import glob
from pathlib import Path
from datetime import datetime

def get_file_hash(file_path):
    """Calculate SHA256 hash of a file."""
    try:
        hasher = hashlib.sha256()
        with open(file_path, 'rb') as f:
            for chunk in iter(lambda: f.read(4096), b""):
                hasher.update(chunk)
        return hasher.hexdigest()
    except Exception as e:
        print(f"Error hashing {file_path}: {e}")
        return None

def should_include_file(file_path, include_patterns, exclude_patterns):
    """Check if file should be included based on patterns."""
    file_path = file_path.replace(os.sep, '/')

    # Check excludes first
    for pattern in exclude_patterns:
        if glob.fnmatch.fnmatch(file_path, pattern):
            return False

    # Check includes
    for pattern in include_patterns:
        if glob.fnmatch.fnmatch(file_path, pattern):
            return True

    return False

def create_baseline():
    """Create baseline manifest of current repository state."""

    # Configuration
    include_patterns = [
        "src/**/*",
        "schemas/**/*",
        "public/**/*",
        "tools/**/*",
        "app/**/*",
        "pages/**/*",
        "lib/**/*",
        "components/**/*",
        "package.json",
        "package-lock.json",
        "pnpm-lock.yaml",
        "yarn.lock",
        "next.config.*",
        "sanity.config.*",
        "tsconfig.*",
        ".env.example",
        "*.js",
        "*.ts",
        "*.jsx",
        "*.tsx",
        "*.md"
    ]

    exclude_patterns = [
        "node_modules/**/*",
        ".git/**/*",
        ".next/**/*",
        ".vercel/**/*",
        "snapshots/**/*",
        "outbox/**/*",
        "dist/**/*",
        "build/**/*",
        "*.log",
        "tools/bridge/.baseline.json",
        "generated-content/**/*",
        "sample-outputs/**/*",
        "*.tar.gz",
        "tsconfig.tsbuildinfo"
    ]

    repo_root = Path.cwd()
    baseline_path = repo_root / "tools" / "bridge" / ".baseline.json"

    print(f"Creating baseline from: {repo_root}")
    print(f"Output: {baseline_path}")

    # Collect all files
    files = []
    total_files = 0

    for root, dirs, filenames in os.walk(repo_root):
        # Skip excluded directories early
        dirs[:] = [d for d in dirs if not any(
            glob.fnmatch.fnmatch(f"{os.path.relpath(os.path.join(root, d), repo_root).replace(os.sep, '/')}", pattern)
            for pattern in exclude_patterns
        )]

        for filename in filenames:
            file_path = os.path.join(root, filename)
            rel_path = os.path.relpath(file_path, repo_root).replace(os.sep, '/')

            if should_include_file(rel_path, include_patterns, exclude_patterns):
                total_files += 1
                file_hash = get_file_hash(file_path)

                if file_hash:
                    try:
                        stat = os.stat(file_path)
                        files.append({
                            "path": rel_path,
                            "sha256": file_hash,
                            "size": stat.st_size,
                            "mode": oct(stat.st_mode)[-3:]
                        })
                    except Exception as e:
                        print(f"Error getting stats for {rel_path}: {e}")

    # Create manifest
    manifest = {
        "createdAt": datetime.utcnow().isoformat() + "Z",
        "repoRoot": str(repo_root),
        "totalFiles": len(files),
        "files": sorted(files, key=lambda x: x["path"]),
        "config": {
            "includePatterns": include_patterns,
            "excludePatterns": exclude_patterns
        }
    }

    # Ensure output directory exists
    baseline_path.parent.mkdir(parents=True, exist_ok=True)

    # Write baseline
    try:
        with open(baseline_path, 'w', encoding='utf-8') as f:
            json.dump(manifest, f, indent=2, ensure_ascii=False)

        print(f"✅ Baseline created: {len(files)} files tracked")
        print(f"📁 Saved to: {baseline_path}")

        return True

    except Exception as e:
        print(f"❌ Error writing baseline: {e}")
        return False

if __name__ == "__main__":
    success = create_baseline()
    exit(0 if success else 1)