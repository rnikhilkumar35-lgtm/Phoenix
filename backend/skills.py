import re

# Comprehensive skill taxonomy
SKILL_TAXONOMY = {
    "Programming Languages": [
        "Python", "Java", "JavaScript", "TypeScript", "C++", "C#", "C",
        "Go", "Rust", "Ruby", "PHP", "Swift", "Kotlin", "R", "MATLAB",
        "Scala", "Perl", "Shell", "Bash", "PowerShell"
    ],
    "Web Technologies": [
        "HTML", "CSS", "React", "Angular", "Vue", "Node.js", "Express",
        "Django", "Flask", "FastAPI", "Spring", "REST", "GraphQL",
        "Bootstrap", "Tailwind", "Next.js", "Nuxt.js"
    ],
    "Data & ML": [
        "Machine Learning", "Deep Learning", "NLP", "Computer Vision",
        "TensorFlow", "PyTorch", "Keras", "scikit-learn", "Pandas",
        "NumPy", "Matplotlib", "Seaborn", "OpenCV", "NLTK", "spaCy",
        "Transformers", "BERT", "GPT", "LLM", "Data Science",
        "Data Analysis", "Statistics", "Reinforcement Learning",
        "Neural Networks", "XGBoost", "LightGBM", "Random Forest"
    ],
    "Databases": [
        "SQL", "MySQL", "PostgreSQL", "SQLite", "MongoDB", "Redis",
        "Cassandra", "Oracle", "DynamoDB", "Elasticsearch", "Neo4j",
        "Firebase", "Supabase"
    ],
    "Cloud & DevOps": [
        "AWS", "Azure", "GCP", "Docker", "Kubernetes", "Terraform",
        "CI/CD", "Jenkins", "GitHub Actions", "Ansible", "Linux",
        "Nginx", "Apache", "Git", "GitHub", "GitLab", "Bitbucket"
    ],
    "Data Engineering": [
        "Apache Spark", "Hadoop", "Kafka", "Airflow", "ETL", "Databricks",
        "Snowflake", "BigQuery", "dbt", "Hive"
    ],
    "Soft Skills": [
        "Leadership", "Communication", "Teamwork", "Problem Solving",
        "Agile", "Scrum", "Project Management", "Mentoring"
    ]
}

# Flatten skill list for quick lookup
ALL_SKILLS = []
SKILL_TO_CATEGORY = {}
for category, skills in SKILL_TAXONOMY.items():
    for skill in skills:
        ALL_SKILLS.append(skill)
        SKILL_TO_CATEGORY[skill.lower()] = category


def extract_skills(text: str) -> dict:
    """
    Extract skills from resume text.
    Returns: {"matched_skills": [...], "by_category": {...}}
    """
    text_lower = text.lower()
    matched = []
    by_category = {}

    for skill in ALL_SKILLS:
        # Use word boundary matching for accuracy
        pattern = r'\b' + re.escape(skill.lower()) + r'\b'
        if re.search(pattern, text_lower):
            matched.append(skill)
            cat = SKILL_TO_CATEGORY[skill.lower()]
            if cat not in by_category:
                by_category[cat] = []
            by_category[cat].append(skill)

    return {
        "matched_skills": matched,
        "by_category": by_category,
        "count": len(matched)
    }


def extract_contact_info(text: str) -> dict:
    """Extract basic contact information from resume text."""
    info = {}

    # Email
    email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
    emails = re.findall(email_pattern, text)
    info["email"] = emails[0] if emails else None

    # Phone
    phone_pattern = r'[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}'
    phones = re.findall(phone_pattern, text)
    info["phone"] = phones[0] if phones else None

    # LinkedIn
    linkedin_pattern = r'linkedin\.com/in/[\w-]+'
    linkedin = re.findall(linkedin_pattern, text.lower())
    info["linkedin"] = linkedin[0] if linkedin else None

    # GitHub
    github_pattern = r'github\.com/[\w-]+'
    github = re.findall(github_pattern, text.lower())
    info["github"] = github[0] if github else None

    return info
