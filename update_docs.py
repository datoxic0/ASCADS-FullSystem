import os
import glob

# 1. Append footer to Markdown docs
with open('MyFooter.md', 'r', encoding='utf-8') as f:
    footer = f.read()

docs = ['ASCADS_DEVELOPER_VISION.md', 'ENGIGRAPH_3D_MANUAL.md']
for doc in docs:
    if os.path.exists(doc):
        with open(doc, 'a', encoding='utf-8') as f:
            f.write('\n\n' + footer)
        print(f"Appended footer to {doc}")

# 2. Replace placeholders in Legal docs
replacements = {
    '[INSERT URL WHEN AVAILABLE]': 'https://github.com/datoxic0/ASCAD',
    '[INSERT MICROSOFT FORMS URL]': 'https://github.com/datoxic0/ASCAD/issues',
    '[INSERT GOOGLE FORMS URL]': 'https://github.com/datoxic0/ASCAD/issues',
    '[INSERT BANK NAME]': 'Bank details provided upon Commercial Invoice request',
    '[INSERT ACCOUNT NUMBER]': 'To Be Provided Upon Invoice',
    '[INSERT BRANCH CODE]': 'To Be Provided Upon Invoice',
    '[INSERT SWIFT CODE]': 'To Be Provided Upon Invoice',
    '[INSERT ACCOUNT HOLDER NAME FOR POOL]': 'ASCADS Contributor Pool Trust'
}

files_to_update = glob.glob('Legal/*.md') + ['Legal/LICENSE']
for filepath in files_to_update:
    if os.path.exists(filepath):
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        for key, val in replacements.items():
            content = content.replace(key, val)
            
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Updated placeholders in {filepath}")
