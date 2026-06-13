import database, models
import json

def seed():
    models.Base.metadata.create_all(bind=database.engine)
    db = database.SessionLocal()

    # Clear old data for demo
    db.query(models.JobRole).delete()
    db.query(models.QuizQuestion).delete()
    db.query(models.Skill).delete()
    db.query(models.StudyPlan).delete()
    
    jobs = [
        models.JobRole(company_name="Google", role_title="Software Engineer", required_skills="python, react, docker, git"),
        models.JobRole(company_name="Amazon", role_title="DevOps Engineer", required_skills="python, aws, docker, kubernetes, linux"),
        models.JobRole(company_name="Meta", role_title="Frontend Developer", required_skills="javascript, react, tailwind, git"),
        models.JobRole(company_name="Netflix", role_title="Backend Engineer", required_skills="java, python, aws, postgresql, fastapi"),
    ]
    
    questions = [
        # Google Software Engineer
        models.QuizQuestion(job_id=1, question="What does React primarily use to update the DOM efficiently?", options=json.dumps(["Virtual DOM", "Shadow DOM", "Real DOM", "Document Fragment"]), correct_answer="Virtual DOM"),
        models.QuizQuestion(job_id=1, question="Which data structure uses LIFO?", options=json.dumps(["Queue", "Stack", "Array", "Linked List"]), correct_answer="Stack"),
        
        # Amazon DevOps Engineer
        models.QuizQuestion(job_id=2, question="What command is used to build a Docker image?", options=json.dumps(["docker compile", "docker build", "docker make", "docker create"]), correct_answer="docker build"),
        models.QuizQuestion(job_id=2, question="In Kubernetes, what is the smallest deployable unit?", options=json.dumps(["Node", "Cluster", "Pod", "Container"]), correct_answer="Pod"),

        # Meta Frontend Developer
        models.QuizQuestion(job_id=3, question="What is a closure in JavaScript?", options=json.dumps(["A CSS framework", "Function bundled with its lexical environment", "Database query", "React hook"]), correct_answer="Function bundled with its lexical environment"),
        models.QuizQuestion(job_id=3, question="Which of these is a CSS framework?", options=json.dumps(["Tailwind", "React", "Node", "MongoDB"]), correct_answer="Tailwind"),

        # Netflix Backend Engineer
        models.QuizQuestion(job_id=4, question="Which of the following is used in FastAPI to define API parameters?", options=json.dumps(["Pydantic", "Marshmallow", "Django Forms", "SQLAlchemy"]), correct_answer="Pydantic"),
        models.QuizQuestion(job_id=4, question="What is the default port for PostgreSQL?", options=json.dumps(["3306", "8000", "5432", "27017"]), correct_answer="5432"),
    ]
    
    db.add_all(jobs)
    db.add_all(questions)
    db.commit()
    print("Database seeded successfully with dummy jobs and questions.")

if __name__ == "__main__":
    seed()
