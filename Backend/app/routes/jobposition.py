from flask import Blueprint, request, jsonify
from sqlalchemy.exc import IntegrityError
from app import db
from app.models import JobPosition
from datetime import datetime

jobposition_bp = Blueprint("jobposition", __name__, url_prefix="/job-positions")


def job_to_dict(job: JobPosition):
    return {
        "id": job.id,
        "title": job.title,
        "department": job.department,
        "level": job.level,
        "location": job.location,
        "employment_type": job.employment_type,
        "priority": job.priority,
        "status": job.status,
        "salary": {
            "min": job.salary_min,
            "max": job.salary_max,
            "currency": job.salary_currency
        },
        "job_description": job.job_description,
        "requirements": job.requirements or [],
        "required_skills": job.required_skills or [],
        "available": job.available,
        "created_at": job.created_at.isoformat(),
        "updated_at": job.updated_at.isoformat()
    }



@jobposition_bp.route("", methods=["POST"])
def create_job_position():
    data = request.get_json(force=True)

    try:
        job = JobPosition(
            title=data["title"],
            department=data["department"],
            level=data["level"],
            location=data["location"],
            employment_type=data["employment_type"],
            priority=data.get("priority", "medium"),
            status=data.get("status", "draft"),
            salary_min=data.get("salary", {}).get("min"),
            salary_max=data.get("salary", {}).get("max"),
            salary_currency=data.get("salary", {}).get("currency", "IDR"),
            job_description=data["job_description"],
            requirements=data.get("requirements", []),
            required_skills=data.get("required_skills", []),
            available=data.get("available", True),
        )

        db.session.add(job)
        db.session.commit()

        return jsonify({
            "message": "Job position created",
            "data": job_to_dict(job)
        }), 201

    except KeyError as e:
        return jsonify({"error": f"Missing field {str(e)}"}), 400

    except IntegrityError:
        db.session.rollback()
        return jsonify({"error": "Invalid data"}), 400


@jobposition_bp.route("", methods=["GET"])
def list_job_positions():
    status = request.args.get("status")
    department = request.args.get("department")
    available = request.args.get("available")

    query = JobPosition.query

    if status:
        query = query.filter_by(status=status)
    if department:
        query = query.filter_by(department=department)
    if available is not None:
        query = query.filter_by(available=available.lower() == "true")

    jobs = query.order_by(JobPosition.created_at.desc()).all()

    return jsonify([job_to_dict(job) for job in jobs])


@jobposition_bp.route("/<job_id>", methods=["GET"])
def get_job_position(job_id):
    job = JobPosition.query.get(job_id)
    if not job:
        return jsonify({"error": "Job position not found"}), 404

    return jsonify(job_to_dict(job))


@jobposition_bp.route("/<job_id>", methods=["PUT"])
def update_job_position(job_id):
    job = JobPosition.query.get(job_id)
    if not job:
        return jsonify({"error": "Job position not found"}), 404

    data = request.get_json(force=True)

    job.title = data.get("title", job.title)
    job.department = data.get("department", job.department)
    job.level = data.get("level", job.level)
    job.location = data.get("location", job.location)
    job.employment_type = data.get("employment_type", job.employment_type)
    job.priority = data.get("priority", job.priority)
    job.status = data.get("status", job.status)

    salary = data.get("salary", {})
    job.salary_min = salary.get("min", job.salary_min)
    job.salary_max = salary.get("max", job.salary_max)
    job.salary_currency = salary.get("currency", job.salary_currency)

    job.job_description = data.get("job_description", job.job_description)
    job.requirements = data.get("requirements", job.requirements)
    job.required_skills = data.get("required_skills", job.required_skills)
    job.available = data.get("available", job.available)
    job.updated_at = datetime.utcnow()

    db.session.commit()

    return jsonify({
        "message": "Job position updated",
        "data": job_to_dict(job)
    })


@jobposition_bp.route("/<job_id>", methods=["DELETE"])
def delete_job_position(job_id):
    job = JobPosition.query.get(job_id)
    if not job:
        return jsonify({"error": "Job position not found"}), 404

    db.session.delete(job)
    db.session.commit()

    return jsonify({"message": "Job position deleted"})
