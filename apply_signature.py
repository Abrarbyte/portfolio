import json
import sys
import os

def apply_signature(sig_data):
    if isinstance(sig_data, str):
        sig_data = json.loads(sig_data)
    
    js_path = r"c:\Abrar project\index_v2_enhanced\haoqi-design-mirror\_next\static\chunks\4d3f3b68dbbde33a.js"
    html_path = r"c:\Abrar project\index_v2_enhanced\haoqi-design-mirror\index.html"
    
    # 1. Update JS
    js_sig_str = f"let fx={json.dumps(sig_data)};"
    with open(js_path, 'r', encoding='utf-8') as f:
        js_content = f.read()
    
    import re
    # Replace fx=[...];
    new_js = re.sub(r'let fx=\[\{order:0,d:.*?\}\];', js_sig_str, js_content, flags=re.DOTALL)
    if new_js != js_content:
        with open(js_path, 'w', encoding='utf-8') as f:
            f.write(new_js)
        print("Updated JS file with new signature.")
    else:
        print("Warning: Could not find fx pattern in JS.")
        
    # 2. Update HTML
    paths_html = "".join([
        f'<path class="svg-sign__path" d="{item["d"]}" stroke="#C0FE04" stroke-width="{item.get("strokeWidth", 4)}" fill="none"></path>'
        for item in sig_data
    ])
    new_svg = f'<svg viewBox="0 0 320 154" fill="none" xmlns="http://www.w3.org/2000/svg" class="svg-sign -top-1/32 -left-1/12 absolute w-3/4 pointer-events-none" aria-hidden="true">{paths_html}</svg>'
    
    with open(html_path, 'r', encoding='utf-8') as f:
        html_content = f.read()
        
    new_html = re.sub(r'<svg viewBox="0 0 320 154".*?</svg>', new_svg, html_content, flags=re.DOTALL)
    if new_html != html_content:
        with open(html_path, 'w', encoding='utf-8') as f:
            f.write(new_html)
        print("Updated index.html with new signature.")
    else:
        print("Warning: Could not find SVG in index.html.")

if __name__ == "__main__":
    if len(sys.argv) > 1 and os.path.exists(sys.argv[1]):
        with open(sys.argv[1], 'r', encoding='utf-8') as f:
            apply_signature(f.read())
    else:
        print("Usage: python apply_signature.py [path_to_signature.json]")
