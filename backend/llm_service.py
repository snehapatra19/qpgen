import json, re, os
from typing import List, Dict, Any, Optional

BLOOM_LEVELS = ["Remember", "Understand", "Apply", "Analyze", "Evaluate", "Create"]
DIFFICULTY_BLOOM_MAP = {
    "easy": ["Remember", "Understand"],
    "medium": ["Understand", "Apply", "Analyze"],
    "hard": ["Analyze", "Evaluate", "Create"]
}

def generate_questions_and_answers(text, keywords, topics, num_questions, difficulty, question_types, subject, api_key=None):
    key = api_key or os.environ.get("ANTHROPIC_API_KEY", "")
    if key and key.startswith("sk-"):
        try:
            return _generate_via_anthropic(text, keywords, topics, num_questions, difficulty, question_types, subject, key)
        except Exception as e:
            print(f"Anthropic API error: {e}, falling back to rule-based")
    return _generate_rule_based(text, keywords, topics, num_questions, difficulty, question_types, subject)

def _generate_via_anthropic(text, keywords, topics, num_questions, difficulty, question_types, subject, api_key):
    import anthropic
    client = anthropic.Anthropic(api_key=api_key)
    bloom_focus = DIFFICULTY_BLOOM_MAP.get(difficulty, DIFFICULTY_BLOOM_MAP["medium"])
    text_excerpt = text[:6000] if len(text) > 6000 else text
    prompt = f"""You are an expert academic question paper creator. Generate exactly {num_questions} questions from the provided study material.

SUBJECT: {subject or 'General'}
DIFFICULTY: {difficulty.upper()}
BLOOM'S TAXONOMY FOCUS: {', '.join(bloom_focus)}
QUESTION TYPES: {', '.join(question_types)}
KEY TOPICS: {', '.join(topics[:5]) if topics else 'General'}

STUDY MATERIAL:
{text_excerpt}

Return ONLY valid JSON:
{{
  "summary": "2-3 sentence summary",
  "questions": [
    {{
      "id": 1,
      "question": "Question text",
      "type": "mcq|short|long|true_false|fill_blank",
      "difficulty": "{difficulty}",
      "bloom_level": "Remember|Understand|Apply|Analyze|Evaluate|Create",
      "topic": "topic name",
      "options": ["A) opt1", "B) opt2", "C) opt3", "D) opt4"],
      "answer": "Full answer",
      "explanation": "Why this is correct",
      "marks": 1
    }}
  ],
  "bloom_distribution": {{"Remember":0,"Understand":0,"Apply":0,"Analyze":0,"Evaluate":0,"Create":0}}
}}
RULES: MCQ needs 4 options. true_false options: ["A) True","B) False"]. short/long use empty options []. Return ONLY JSON."""

    message = client.messages.create(model="claude-opus-4-5", max_tokens=4096,
        messages=[{"role": "user", "content": prompt}])
    response_text = re.sub(r'^```(?:json)?\s*', '', message.content[0].text.strip())
    response_text = re.sub(r'\s*```$', '', response_text)
    data = json.loads(response_text)
    if "bloom_distribution" not in data:
        data["bloom_distribution"] = {level: 0 for level in BLOOM_LEVELS}
    for q in data.get("questions", []):
        bl = q.get("bloom_level", "Understand")
        if bl in data["bloom_distribution"]: data["bloom_distribution"][bl] += 1
    return data

def _generate_rule_based(text, keywords, topics, num_questions, difficulty, question_types, subject):
    import re
    sentences = [s.strip() for s in re.split(r'(?<=[.!?])\s+', text) if len(s.strip()) > 40]
    questions = []
    bloom_dist = {level: 0 for level in BLOOM_LEVELS}
    bloom_focus = DIFFICULTY_BLOOM_MAP.get(difficulty, DIFFICULTY_BLOOM_MAP["medium"])
    type_cycle = question_types * ((num_questions // max(len(question_types),1)) + 1)

    for i in range(min(num_questions, max(len(sentences), num_questions))):
        if len(questions) >= num_questions: break
        sentence = sentences[i % max(len(sentences),1)] if sentences else "Key concept from the material."
        q_type = type_cycle[i % len(type_cycle)]
        bloom = bloom_focus[i % len(bloom_focus)]
        topic = topics[i % len(topics)] if topics else "General"
        kw = keywords[i % len(keywords)] if keywords else "concept"

        if q_type == "mcq":
            q = {"id": i+1, "question": f"Which best describes '{kw}' as discussed in the material?",
                "type": "mcq", "difficulty": difficulty, "bloom_level": bloom, "topic": topic,
                "options": [f"A) {sentence[:60].rstrip('.')}.", f"B) An unrelated concept about {keywords[(i+1)%max(len(keywords),1)] if keywords else 'theory'}", "C) A principle not covered in this material", "D) None of the above"],
                "answer": f"A) {sentence[:60].rstrip('.')}.", "explanation": f"Based on the material: {sentence[:100]}", "marks": 1}
        elif q_type == "true_false":
            q = {"id": i+1, "question": f"True or False: {sentence[:120].rstrip('.')}.", "type": "true_false",
                "difficulty": difficulty, "bloom_level": bloom, "topic": topic,
                "options": ["A) True", "B) False"], "answer": "A) True",
                "explanation": "This statement is directly supported by the study material.", "marks": 1}
        elif q_type == "fill_blank":
            q_text = sentence.replace(kw, "___", 1) if kw in sentence.lower() else f"The concept of ___ is central to this topic."
            q = {"id": i+1, "question": f"Fill in the blank: {q_text}", "type": "fill_blank",
                "difficulty": difficulty, "bloom_level": bloom, "topic": topic,
                "options": [], "answer": kw.capitalize(), "explanation": f"Context: {sentence[:150]}", "marks": 1}
        elif q_type == "short":
            q = {"id": i+1, "question": f"Briefly explain: \"{sentence[:100]}\"", "type": "short",
                "difficulty": difficulty, "bloom_level": bloom, "topic": topic, "options": [],
                "answer": f"{sentence} This relates to {topic}.", "explanation": "Demonstrate understanding with relevant details.", "marks": 3}
        else:
            q = {"id": i+1, "question": f"Discuss in detail: {topic}", "type": "long",
                "difficulty": difficulty, "bloom_level": bloom, "topic": topic, "options": [],
                "answer": f"A comprehensive answer should cover: {sentence[:400]}. Provide examples and analysis.",
                "explanation": "Requires structured response: intro, explanation, examples, conclusion.", "marks": 6}

        questions.append(q)
        bloom_dist[bloom] = bloom_dist.get(bloom, 0) + 1

    summary = f"This material covers {', '.join(topics[:3]) if topics else 'various topics'}. Key concepts: {', '.join(keywords[:5]) if keywords else 'provided content'}."
    return {"summary": summary, "questions": questions[:num_questions], "bloom_distribution": bloom_dist}
