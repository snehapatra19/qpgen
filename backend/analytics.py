import json, time
from pathlib import Path
from typing import List
import datetime

class Analytics:
    def __init__(self, data_file="analytics.json"):
        self.data_file = Path(data_file)
        self._load()

    def _load(self):
        if self.data_file.exists():
            with open(self.data_file) as f: self.data = json.load(f)
        else:
            self.data = {"sessions": [], "total_questions_generated": 0, "total_files_processed": 0,
                "total_processing_time": 0, "feedback_scores": [],
                "difficulty_counts": {"easy": 0, "medium": 0, "hard": 0}, "topic_frequency": {}, "daily_usage": {}}

    def _save(self):
        with open(self.data_file, "w") as f: json.dump(self.data, f, indent=2)

    def record_session(self, session_id, filename, num_questions, difficulty, processing_time, topics):
        today = datetime.date.today().isoformat()
        self.data["sessions"].append({"session_id": session_id, "filename": filename,
            "num_questions": num_questions, "difficulty": difficulty,
            "processing_time": round(processing_time, 2), "topics": topics, "timestamp": time.time(), "date": today})
        self.data["total_questions_generated"] += num_questions
        self.data["total_files_processed"] += 1
        self.data["total_processing_time"] += processing_time
        self.data["difficulty_counts"][difficulty] = self.data["difficulty_counts"].get(difficulty, 0) + 1
        self.data["daily_usage"][today] = self.data["daily_usage"].get(today, 0) + 1
        for topic in topics: self.data["topic_frequency"][topic] = self.data["topic_frequency"].get(topic, 0) + 1
        if len(self.data["sessions"]) > 100: self.data["sessions"] = self.data["sessions"][-100:]
        self._save()

    def record_feedback(self, rating):
        self.data["feedback_scores"].append(rating)
        if len(self.data["feedback_scores"]) > 500: self.data["feedback_scores"] = self.data["feedback_scores"][-500:]
        self._save()

    def get_stats(self):
        sessions = self.data["sessions"]
        scores = self.data["feedback_scores"]
        avg_rating = round(sum(scores)/len(scores), 1) if scores else 0
        avg_time = round(self.data["total_processing_time"] / max(self.data["total_files_processed"],1), 2)
        today = datetime.date.today()
        daily = [{"date": (today - datetime.timedelta(days=i)).isoformat(), "count": self.data["daily_usage"].get((today - datetime.timedelta(days=i)).isoformat(), 0)} for i in range(6,-1,-1)]
        recent = sorted(sessions, key=lambda x: x.get("timestamp",0), reverse=True)[:5]
        top_topics = sorted(self.data["topic_frequency"].items(), key=lambda x: x[1], reverse=True)[:8]
        return {"total_files": self.data["total_files_processed"], "total_questions": self.data["total_questions_generated"],
            "avg_processing_time": avg_time, "avg_rating": avg_rating,
            "difficulty_distribution": self.data["difficulty_counts"], "daily_usage": daily,
            "recent_sessions": recent, "top_topics": [{"topic": t, "count": c} for t, c in top_topics]}
