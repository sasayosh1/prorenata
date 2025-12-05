import os
import re
import glob

# Configuration
CONTENT_DIRS = ['src/app', 'src/components', 'src/lib', '_posts'] # Adjust based on actual content location
IMAGE_DIRS = ['public/images']
EXTENSIONS = ['.md', '.mdx', '.tsx', '.ts', '.js', '.json']
IMAGE_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp']

def get_all_files(dirs, extensions):
    files = []
    for d in dirs:
        if not os.path.exists(d):
            continue
        for root, _, filenames in os.walk(d):
            for filename in filenames:
                if any(filename.endswith(ext) for ext in extensions):
                    files.append(os.path.join(root, filename))
    return files

def get_all_images(dirs):
    images = []
    for d in dirs:
        if not os.path.exists(d):
            continue
        for root, _, filenames in os.walk(d):
            for filename in filenames:
                if any(filename.lower().endswith(ext) for ext in IMAGE_EXTENSIONS):
                    # Store relative path from public/
                    # e.g. public/images/foo.png -> /images/foo.png
                    full_path = os.path.join(root, filename)
                    rel_path = os.path.relpath(full_path, 'public')
                    images.append({
                        'full_path': full_path,
                        'rel_path': '/' + rel_path, # Web path
                        'filename': filename
                    })
    return images

def find_references(content_files, images):
    referenced_images = set()
    
    # Pre-compile regex for performance
    # Matches: /images/..., 'images/...', "images/..."
    # We need to be careful about matching.
    
    print(f"Scanning {len(content_files)} content files for {len(images)} images...")
    
    for file_path in content_files:
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
                
                for img in images:
                    if img['full_path'] in referenced_images:
                        continue
                        
                    # Check for exact filename match (simplest, but might have false positives)
                    # Or check for relative path match
                    if img['rel_path'] in content or img['filename'] in content:
                        referenced_images.add(img['full_path'])
                        
        except Exception as e:
            print(f"Error reading {file_path}: {e}")

    return referenced_images

def main():
    content_files = get_all_files(CONTENT_DIRS, EXTENSIONS)
    all_images = get_all_images(IMAGE_DIRS)
    
    referenced = find_references(content_files, all_images)
    
    unused = [img for img in all_images if img['full_path'] not in referenced]
    
    print(f"Total Images: {len(all_images)}")
    print(f"Referenced: {len(referenced)}")
    print(f"Unused Candidates: {len(unused)}")
    
    if unused:
        print("\n--- Unused Images (Candidates) ---")
        for img in unused:
            print(img['full_path'])
        print("\nTo delete these files, verify them manually first, then run:")
        print("xargs rm < unused_images_list.txt")

if __name__ == "__main__":
    main()
