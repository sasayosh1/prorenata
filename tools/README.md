# ProReNata Tools & Maintenance

This directory contains utility scripts and shared libraries used for maintaining the ProReNata site and its content.

## Structure

- **[cli.js](cli.js)**: The unified entry point for maintenance tasks.
- **[lib/](lib/)**: Shared libraries and utility functions.
  - `maintenance/`: Core logic for post processing, affiliate links, and category mapping.
- **[generation/](generation/)**: Scripts for generating new content or metadata.
- **[maintenance/](maintenance/)**: Scripts for cleaning, fixing, and syncing Sanity content.
- **[debug/](debug/)**: One-off verification and debugging tools.
- **[legacy/](legacy/)**: Older Python scripts and utilities kept for historical reference.

## Usage

You can run maintenance tasks via the CLI:

```bash
# General help
npm run maintenance -- --help

# Generate a site status report
npm run maintenance:report
```

Or run individual scripts:

```bash
node tools/maintenance/check-existing-posts.js
```

## Guidelines for Adding New Tools

1. **Shared Logic**: If your script needs logic for Sanity posts or affiliate links, import it from `tools/lib/maintenance/`.
2. **Categorization**: Place your script in the appropriate subdirectory (`generation`, `maintenance`, or `debug`).
3. **Environment**: Ensure all necessary environment variables are set in `.env.local` or `.env.private`.
