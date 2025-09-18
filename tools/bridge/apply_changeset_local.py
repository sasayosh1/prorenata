#!/usr/bin/env python3
"""
Local changeset application script for bridge workflow.
Applies downloaded changeset to local repository.
"""

import os
import sys
import json
import shutil
import argparse
from pathlib import Path

def load_manifest(changeset_dir):
    """Load changeset manifest."""
    manifest_path = Path(changeset_dir) / "manifest.json"

    if not manifest_path.exists():
        print(f"❌ No manifest.json found in {changeset_dir}")
        return None

    try:
        with open(manifest_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception as e:
        print(f"❌ Error loading manifest: {e}")
        return None

def load_deleted_files(changeset_dir):
    """Load list of files to delete."""
    deleted_path = Path(changeset_dir) / "deleted.txt"

    if not deleted_path.exists():
        return []

    try:
        with open(deleted_path, 'r', encoding='utf-8') as f:
            return [line.strip() for line in f if line.strip()]
    except Exception as e:
        print(f"Warning: Error loading deleted.txt: {e}")
        return []

def apply_changeset(changeset_dir, dry_run=False):
    """Apply changeset to current directory."""

    changeset_path = Path(changeset_dir)
    if not changeset_path.exists():
        print(f"❌ Changeset directory not found: {changeset_dir}")
        return False

    # Load manifest
    manifest = load_manifest(changeset_dir)
    if not manifest:
        return False

    # Load deleted files
    deleted_files = load_deleted_files(changeset_dir) + manifest.get("deleted", [])

    files_dir = changeset_path / "files"
    repo_root = Path.cwd()

    print(f"{'🔍 DRY RUN: ' if dry_run else '🚀 '}Applying changeset from: {changeset_dir}")
    print(f"Target repository: {repo_root}")

    # Validate we're in a git repository
    if not (repo_root / ".git").exists():
        print("❌ Current directory is not a git repository")
        return False

    changes_applied = 0
    files_deleted = 0
    errors = []

    # Apply file changes
    for file_info in manifest.get("files", []):
        file_path = file_info["path"]
        source_path = files_dir / file_path
        target_path = repo_root / file_path

        if not source_path.exists():
            errors.append(f"Source file not found: {source_path}")
            continue

        try:
            if dry_run:
                action = file_info.get("status", "modified")
                print(f"  Would {action}: {file_path}")
            else:
                # Ensure target directory exists
                target_path.parent.mkdir(parents=True, exist_ok=True)

                # Copy file
                shutil.copy2(source_path, target_path)

                # Set file mode if specified
                if "mode" in file_info:
                    try:
                        mode = int(file_info["mode"], 8)
                        os.chmod(target_path, mode)
                    except Exception as e:
                        print(f"Warning: Could not set mode for {file_path}: {e}")

                action = file_info.get("status", "modified")
                print(f"  ✅ {action.capitalize()}: {file_path}")

            changes_applied += 1

        except Exception as e:
            error_msg = f"Error applying {file_path}: {e}"
            errors.append(error_msg)
            print(f"  ❌ {error_msg}")

    # Delete files
    for file_path in deleted_files:
        target_path = repo_root / file_path

        if target_path.exists():
            try:
                if dry_run:
                    print(f"  Would delete: {file_path}")
                else:
                    target_path.unlink()
                    print(f"  🗑️  Deleted: {file_path}")

                files_deleted += 1

            except Exception as e:
                error_msg = f"Error deleting {file_path}: {e}"
                errors.append(error_msg)
                print(f"  ❌ {error_msg}")
        else:
            if not dry_run:
                print(f"  ℹ️  Already deleted: {file_path}")

    # Summary
    expected_files = len(manifest.get("files", []))
    expected_deletions = len(deleted_files)

    print(f"\n📊 Summary:")
    print(f"   Files processed: {changes_applied}/{expected_files}")
    print(f"   Files deleted: {files_deleted}/{expected_deletions}")

    if errors:
        print(f"   Errors: {len(errors)}")
        for error in errors[:5]:  # Show first 5 errors
            print(f"     - {error}")
        if len(errors) > 5:
            print(f"     ... and {len(errors) - 5} more errors")

    if manifest.get("skippedLargeFiles"):
        print(f"   Skipped large files: {len(manifest['skippedLargeFiles'])}")

    # Validation
    success = (changes_applied == expected_files and
               files_deleted == expected_deletions and
               len(errors) == 0)

    if dry_run:
        print(f"\n{'✅' if success else '⚠️'} Dry run completed")
    else:
        print(f"\n{'✅' if success else '⚠️'} Changeset {'applied successfully' if success else 'applied with issues'}")

    if not dry_run and success:
        print("\n💡 Next steps:")
        print("   git add -A")
        print("   git commit -m 'Apply Codex changeset'")
        print("   git push")

    return success

def main():
    parser = argparse.ArgumentParser(description="Apply Codex changeset to local repository")
    parser.add_argument("changeset_dir", help="Path to changeset directory")
    parser.add_argument("--dry-run", action="store_true", help="Show what would be changed without applying")

    args = parser.parse_args()

    success = apply_changeset(args.changeset_dir, args.dry_run)
    sys.exit(0 if success else 1)

if __name__ == "__main__":
    main()