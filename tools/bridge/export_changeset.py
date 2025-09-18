#!/usr/bin/env python3
"""
Changeset export script for bridge workflow.
Compares current state against baseline and exports changes to outbox.
"""

import os
import json
import hashlib
import shutil
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

def load_baseline():
    """Load baseline manifest."""
    baseline_path = Path("tools/bridge/.baseline.json")

    if not baseline_path.exists():
        print("❌ No baseline found. Run 'npm run bridge:baseline' first.")
        return None

    try:
        with open(baseline_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception as e:
        print(f"❌ Error loading baseline: {e}")
        return None

def get_current_state(baseline_config):
    """Get current repository state."""
    include_patterns = baseline_config.get("includePatterns", [])
    exclude_patterns = baseline_config.get("excludePatterns", [])

    repo_root = Path.cwd()
    current_files = {}

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
                file_hash = get_file_hash(file_path)
                if file_hash:
                    try:
                        stat = os.stat(file_path)
                        current_files[rel_path] = {
                            "path": rel_path,
                            "sha256": file_hash,
                            "size": stat.st_size,
                            "mode": oct(stat.st_mode)[-3:]
                        }
                    except Exception as e:
                        print(f"Warning: Error getting stats for {rel_path}: {e}")

    return current_files

def export_changeset():
    """Export changeset based on baseline comparison."""

    # Load baseline
    baseline = load_baseline()
    if not baseline:
        return False

    print("🔍 Comparing against baseline...")

    # Create baseline lookup
    baseline_files = {f["path"]: f for f in baseline["files"]}

    # Get current state
    current_files = get_current_state(baseline["config"])

    # Detect changes
    added = []
    modified = []
    deleted = []
    skipped_large = []

    # Check for added/modified files
    for path, current_info in current_files.items():
        if path in baseline_files:
            baseline_info = baseline_files[path]
            if current_info["sha256"] != baseline_info["sha256"]:
                modified.append(current_info)
        else:
            added.append(current_info)

    # Check for deleted files
    for path in baseline_files:
        if path not in current_files:
            deleted.append(path)

    # Create changeset directory
    timestamp = datetime.now().strftime("%Y%m%d-%H%M")
    changeset_dir = Path("outbox") / f"changeset-{timestamp}"
    files_dir = changeset_dir / "files"

    try:
        changeset_dir.mkdir(parents=True, exist_ok=True)
        files_dir.mkdir(parents=True, exist_ok=True)
    except Exception as e:
        print(f"❌ Error creating changeset directory: {e}")
        return False

    # Copy changed files
    all_changes = added + modified
    copied_files = []

    for file_info in all_changes:
        source_path = Path(file_info["path"])
        target_path = files_dir / file_info["path"]

        # Skip large files
        if file_info["size"] > 1.5 * 1024 * 1024:  # 1.5MB
            skipped_large.append(file_info["path"])
            continue

        try:
            target_path.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(source_path, target_path)

            # Determine status
            status = "added" if file_info in added else "modified"
            copied_files.append({
                "path": file_info["path"],
                "sha256": file_info["sha256"],
                "status": status,
                "mode": file_info["mode"]
            })

        except Exception as e:
            print(f"Warning: Failed to copy {file_info['path']}: {e}")

    # Create manifest
    manifest = {
        "createdAt": datetime.utcnow().isoformat() + "Z",
        "baseInfo": {
            "note": "baseline snapshot",
            "paths": len(baseline["files"])
        },
        "files": copied_files,
        "deleted": deleted,
        "skippedLargeFiles": skipped_large,
        "notes": "Apply with tools/bridge/apply_changeset_local.py on your machine."
    }

    # Write manifest
    try:
        manifest_path = changeset_dir / "manifest.json"
        with open(manifest_path, 'w', encoding='utf-8') as f:
            json.dump(manifest, f, indent=2, ensure_ascii=False)

        # Write deleted files list
        if deleted:
            deleted_path = changeset_dir / "deleted.txt"
            with open(deleted_path, 'w', encoding='utf-8') as f:
                for path in deleted:
                    f.write(f"{path}\n")

        print(f"✅ Changeset exported to: {changeset_dir}")
        print(f"📊 Summary:")
        print(f"   Added: {len(added)}")
        print(f"   Modified: {len(modified)}")
        print(f"   Deleted: {len(deleted)}")
        if skipped_large:
            print(f"   Skipped (large): {len(skipped_large)}")

        if not (added or modified or deleted):
            print("🎉 No changes detected since baseline.")

        return True

    except Exception as e:
        print(f"❌ Error writing changeset: {e}")
        return False

if __name__ == "__main__":
    success = export_changeset()
    exit(0 if success else 1)