import re
import json

def parse_questions(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Split by separator
    # The separator is a long line of underscores.
    # However, scanning line by line might be safer.
    
    lines = content.split('\n')
    
    questions = []
    current_question = None
    
    # We'll use a simple state machine or regex
    # Regex for question start: r"^\d+\)\s+(.*)"
    # Regex for option: r"•\s+☐\s+(.*)"
    
    # Also need to handle multi-line questions or options if they exist.
    # Looking at the file, it seems mostly single line, but let's be robust.
    
    header_pattern = re.compile(r"^\d+\)\s+(.*)")
    option_pattern = re.compile(r"^[•·]\s+☐\s+(.*)")
    separator_pattern = re.compile(r"^_{5,}$")
    
    # Reset
    current_q_obj = None
    
    for line in lines:
        line = line.strip()
        if not line:
            continue
            
        if line.startswith("Canevas"):
            continue
            
        # Check if it's a separator
        if separator_pattern.match(line):
            if current_q_obj:
                questions.append(current_q_obj)
                current_q_obj = None
            continue
            
        # Check if it's a question
        match_q = header_pattern.match(line)
        if match_q:
            # If we had a previous question not closed by separator (last one maybe)
            # Actually separator often comes BEFORE the next question number in some formats,
            # but here it comes AFTER options.
            # Example:
            # 7: ________________________________________
            # 8: 2) ...
            # So separator closes the previous one.
            
            # Wait, line 2 is "1) ...", line 7 is separator.
            # So if we hit a question start, we usually just start a new object.
            # But the separator logic should handle the push.
            # Let's rely on "new question number" or "separator" to push.
            # BUT, the separator is at the END of the question block.
            
            if current_q_obj:
                # If we forgot to push (e.g. no separator between - unlikely based on file)
                # But let's fail safe: if we see a new question and have one pending, push it.
                questions.append(current_q_obj)
            
            q_text = match_q.group(1)
            # Extract ID from the start of line manually since we matched parsed it
            q_id = line.split(')')[0]
            
            current_q_obj = {
                "id": int(q_id),
                "question": q_text,
                "options": [],
                "answer": [] # No answers provided
            }
            continue
            
        # Check if it's an option
        match_opt = option_pattern.match(line)
        if match_opt:
            if current_q_obj:
                current_q_obj["options"].append(match_opt.group(1))
            continue
            
        # If it's just text and we have a question, it might be continuation of question or option
        # For simplicity, if we have an option, append to last option?
        # If no options yet, append to question?
        if current_q_obj:
            if current_q_obj["options"]:
                # Append to last option
                current_q_obj["options"][-1] += " " + line
            else:
                # Append to question
                current_q_obj["question"] += " " + line

    # Add the last one if not added
    if current_q_obj:
        questions.append(current_q_obj)
        
    return questions

questions = parse_questions('questions.txt')

# Write to json
with open('qcm-app/src/assets/questions.json', 'w', encoding='utf-8') as f:
    json.dump(questions, f, indent=2, ensure_ascii=False)

print(f"Extracted {len(questions)} questions.")
