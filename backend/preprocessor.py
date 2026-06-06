import re
from collections import Counter
from typing import Dict, List, Any

STOPWORDS = set(["a","an","the","and","or","but","in","on","at","to","for","of","with","by","from","up",
    "about","into","through","during","before","after","is","are","was","were","be","been","being",
    "have","has","had","do","does","did","will","would","could","should","may","might","shall",
    "i","me","my","we","our","you","your","he","him","his","she","her","it","its","they","them",
    "their","this","that","these","those","which","who","whom","whose","what","when","where","why",
    "how","all","each","every","both","few","more","most","other","some","such","no","not","only",
    "same","so","than","too","very","just","also","as","if","then","because","while","although",
    "though","since","unless","until","however","therefore","thus","hence","moreover","furthermore"])

def preprocess_text(raw_text: str) -> Dict[str, Any]:
    clean = _clean_text(raw_text)
    tokens = _tokenize(clean)
    filtered = [t for t in tokens if t not in STOPWORDS and len(t) > 2]
    keywords = _extract_keywords(filtered, top_n=20)
    topics = _extract_topics(clean, keywords)
    sentences = _split_sentences(clean)
    return {"clean_text": clean, "tokens": filtered[:5000], "keywords": keywords,
            "topics": topics, "sentences": sentences[:200], "word_count": len(tokens), "char_count": len(clean)}

def _clean_text(text):
    text = "".join(c for c in text if c.isprintable() or c in "\n\t")
    text = re.sub(r'\t', ' ', text)
    text = re.sub(r' {2,}', ' ', text)
    text = re.sub(r'\n{3,}', '\n\n', text)
    text = re.sub(r'^\s*\d+\s*$', '', text, flags=re.MULTILINE)
    text = re.sub(r'http\S+|www\.\S+', '', text)
    text = re.sub(r'\S+@\S+', '', text)
    return text.strip()

def _tokenize(text):
    return re.findall(r'\b[a-z]+\b', text.lower())

def _extract_keywords(tokens, top_n=20):
    freq = Counter(tokens)
    filtered = {w: c for w, c in freq.items() if len(w) > 3 and c > 1}
    return sorted(filtered, key=filtered.get, reverse=True)[:top_n]

def _extract_topics(text, keywords):
    topics = []
    headings = re.findall(r'^(?:#{1,6}\s+)?([A-Z][A-Za-z\s]{3,50})$', text, re.MULTILINE)
    for h in headings:
        h = h.strip()
        if 3 < len(h.split()) < 8 and h not in topics:
            topics.append(h)
    for kw in keywords[:5]:
        cap = kw.capitalize()
        if cap not in topics: topics.append(cap)
    seen, unique = set(), []
    for t in topics:
        if t.lower() not in seen:
            seen.add(t.lower()); unique.append(t)
    return unique[:10] if unique else ["General Content"]

def _split_sentences(text):
    return [s.strip() for s in re.split(r'(?<=[.!?])\s+', text) if len(s.strip()) > 20]
