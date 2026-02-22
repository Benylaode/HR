from flask import Blueprint, jsonify, request, url_for
from flask_jwt_extended import get_jwt, get_jwt_identity, verify_jwt_in_request
from app import db
from app.models import (
    PapiQuestion, CfitQuestion, KraepelinConfig, 
    PapiScoringMap, CfitNorma, TestSubmission, TestLink, Candidate, Employee
)
from sqlalchemy.exc import IntegrityError
import numpy as np
import os
from datetime import datetime, timedelta
from werkzeug.utils import secure_filename
import uuid
from app.models import now_utc # Import now_utc untuk waktu expired link

# Blueprint untuk Manajemen (Admin)
mgmt_bp = Blueprint("management", __name__)

# Blueprint untuk Submission (Kandidat/Karyawan)
submit_bp = Blueprint("submit", __name__)

UPLOAD_FOLDER = 'app/static/uploads/cfit'
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}

if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER, exist_ok=True)

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


@mgmt_bp.route("/submissions", methods=["GET"])
def get_all_submissions():
    # Ubah cara query agar tidak hard-join ke Candidate saja
    results = db.session.query(TestSubmission, TestLink).join(
        TestLink, TestSubmission.link_id == TestLink.id
    ).order_by(TestSubmission.submitted_at.desc()).all()
    
    output = []
    for sub, link in results:
        scores_data = sub.scores if sub.scores else {}
        
        # Tentukan siapa pesertanya (Kandidat atau Karyawan)
        participant_name = "Unknown"
        participant_id = None
        participant_type = "Unknown"
        
        if link.candidate:
            participant_name = link.candidate.full_name
            participant_id = link.candidate_id
            participant_type = "Candidate"
        elif link.employee:
            participant_name = link.employee.full_name
            participant_id = link.employee_id
            participant_type = "Employee"
        
        output.append({
            "id": sub.id,
            "candidate_id": participant_id, # Tetap pakai key ini agar Frontend tidak error
            "participant_type": participant_type,
            "candidate_name": participant_name, 
            "test_type": sub.test_type,
            "scores": scores_data,
            "submitted_at": sub.submitted_at.isoformat() if sub.submitted_at else None
        })
    
    return jsonify(output)


@mgmt_bp.route("/generate-link", methods=["POST"])
def generate_link():
    data = request.get_json()

    candidate_id = data.get('candidate_id')
    employee_id = data.get('employee_id')
    
    if not candidate_id and not employee_id:
        return jsonify({"error": "Harus menyertakan candidate_id atau employee_id"}), 400
    
    # Cek user dan cari link existing
    user = None
    existing_link = None
    
    if candidate_id:
        user = Candidate.query.get(candidate_id)
        if not user: return jsonify({"error": "Kandidat tidak ditemukan"}), 404
        existing_link = TestLink.query.filter_by(candidate_id=candidate_id).first()
    else:
        user = Employee.query.get(employee_id)
        if not user: return jsonify({"error": "Karyawan tidak ditemukan"}), 404
        existing_link = TestLink.query.filter_by(employee_id=employee_id).first()

    # Hapus link lama jika ada
    if existing_link:
        db.session.delete(existing_link)
        db.session.commit()

    try:
        new_link = TestLink(
            candidate_id=candidate_id, 
            employee_id=employee_id,
            token=str(uuid.uuid4()),
            status='active',
            expires_at=now_utc() + timedelta(days=3) # Link expired dalam 3 hari
        )
        db.session.add(new_link)
        db.session.commit()

        # Gunakan full_name
        test_url = f"http://localhost:3000/test/{new_link.token}?name={user.full_name}"
        return jsonify({
            "link": test_url, 
            "token": new_link.token, 
            "assigned_to": user.full_name,
            "type": "Candidate" if candidate_id else "Employee"
        })
        
    except IntegrityError:
        db.session.rollback()
        return jsonify({"error": "Gagal membuat link (Constraint Error)"}), 500


@submit_bp.route("/check-token/<string:token>", methods=["GET"])
def check_token(token):
    link = TestLink.query.filter_by(token=token).first()
    if not link:
        return jsonify({"error": "Link tidak ditemukan"}), 404
    
    if link.status != 'active':
        return jsonify({"error": "Link sudah tidak aktif"}), 403
        
    # Validasi Expired
    if link.expires_at and now_utc() > link.expires_at:
        return jsonify({"error": "Link tes sudah kedaluwarsa"}), 403
        
    submissions = TestSubmission.query.filter_by(link_id=link.id).all()
    completed_tests = [sub.test_type for sub in submissions] 

    # Cek tipe peserta
    if link.candidate:
        participant_name = link.candidate.full_name
        participant_id = link.candidate_id
        participant_type = "Candidate"
    elif link.employee:
        participant_name = link.employee.full_name
        participant_id = link.employee_id
        participant_type = "Employee"
    else:
        return jsonify({"error": "Data pengguna tidak ditemukan"}), 404

    return jsonify({
        "candidate_id": participant_id, # Key dipertahankan untuk frontend
        "participant_type": participant_type,
        "candidate_name": participant_name,
        "status": link.status, 
        "completed_tests": completed_tests
    })


@mgmt_bp.route("/links", methods=["GET"])
def get_all_links():
    # Ambil semua link tanpa hard-join
    links = TestLink.query.order_by(TestLink.created_at.desc()).all()
    
    output = []
    for link in links:
        if link.candidate:
            participant_name = link.candidate.full_name
            participant_type = "Candidate"
        elif link.employee:
            participant_name = link.employee.full_name
            participant_type = "Employee"
        else:
            participant_name = "Unknown"
            participant_type = "Unknown"

        output.append({
            "id": link.id,
            "candidateName": participant_name,  # Key ini tetap agar tabel frontend tidak rusak
            "participantType": participant_type,
            "token": link.token,
            "status": link.status,
            "createdAt": link.created_at.isoformat() if link.created_at else None
        })
        
    return jsonify(output)


# ==========================================
# ENDPOINT SOAL & SUBMISSION BAWAAN (TIDAK BERUBAH)
# ==========================================

@mgmt_bp.route("/questions/papi", methods=["GET"])
def get_papi_questions():
    questions = PapiQuestion.query.order_by(PapiQuestion.id.asc()).all()
    return jsonify([{
        "id": q.id,
        "option_a": q.statement_a,
        "option_b": q.statement_b
    } for q in questions])

@mgmt_bp.route("/questions/papi", methods=["POST"])
def add_papi_question():
    data = request.get_json()
    option_a = data.get('option_a')
    option_b = data.get('option_b')

    if not option_a or not option_b:
        return jsonify({"error": "Kedua pernyataan harus diisi"}), 400

    try:
        new_q = PapiQuestion(
            statement_a=option_a, 
            statement_b=option_b
        )
        db.session.add(new_q)
        db.session.commit()
        return jsonify({"message": "Soal PAPI berhasil disimpan", "id": new_q.id}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500
    
@mgmt_bp.route("/questions/papi/<int:question_id>", methods=["DELETE"])
def delete_papi_question(question_id):
    question = PapiQuestion.query.get_or_404(question_id)
    try:
        db.session.delete(question)
        db.session.commit()
        return jsonify({"message": "Soal PAPI berhasil dihapus"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@submit_bp.route("/papi", methods=["POST"])
def submit_papi():
    data = request.get_json()
    token = data.get('token') 
    answers = data.get('answers') 

    link = TestLink.query.filter_by(token=token).first()
    if not link: 
        return jsonify({"error": "Token tidak valid atau tidak ditemukan"}), 404

    papi_scores = {
        key: 0 for key in ['G','L','I','T','V','S','R','D','C','E','N','A','P','X','B','O','Z','K','F','W']
    }

    scoring_maps = PapiScoringMap.query.all()

    for idx, ans_index in enumerate(answers):
        if ans_index is not None:
            choice_char = 'A' if ans_index == 0 else 'B'
            
            mapping = next((m for m in scoring_maps if m.question_id == idx + 1 and m.choice == choice_char), None)
            
            if mapping:
                papi_scores[mapping.aspect] += 1

    submission = TestSubmission(
        link_id=link.id, 
        test_type='papi',
        raw_answers=answers,
        scores=papi_scores 
    )
    db.session.add(submission)
    db.session.commit()

    return jsonify({"status": "success"})

@submit_bp.route("/finalize", methods=["POST"])
def finalize_test():
    data = request.get_json()
    token = data.get('token')
    
    link = TestLink.query.filter_by(token=token).first()
    if not link:
        return jsonify({"error": "Token tidak valid"}), 404
        
    link.status = 'completed'
    db.session.commit()
    
    return jsonify({"message": "Seluruh rangkaian tes telah diselesaikan dan dikunci."})

@mgmt_bp.route("/questions/cfit", methods=["GET"])
def get_cfit_questions():
    subtest = request.args.get('subtest', type=int)
    query = CfitQuestion.query
    if subtest:
        query = query.filter_by(subtest=subtest)
    
    questions = query.order_by(CfitQuestion.subtest.asc(), CfitQuestion.order.asc()).all()
    return jsonify([{
        "id": q.id,
        "subtest": q.subtest,
        "subtestName": q.subtest_name,
        "instruction": q.instruction,
        "question_image": q.image_url, 
        "options": q.options.split(",") if q.options else [],
        "correctAnswer": q.correct_answer
    } for q in questions])

@mgmt_bp.route("/questions/cfit", methods=["POST"])
def add_cfit_question():
    subtest = request.form.get('subtest', type=int)
    correct_answer = request.form.get('correctAnswer', type=int)
    instruction = request.form.get('instruction', "")
    options = request.form.get('options', "A,B,C,D,E,F")
    
    image_url = None

    if 'image' in request.files:
        file = request.files['image']
        if file and allowed_file(file.filename):
            filename = secure_filename(f"cfit_{subtest}_{uuid.uuid4().hex[:8]}_{file.filename}")
            file_path = os.path.join(UPLOAD_FOLDER, filename)
            file.save(file_path)
            image_url = f"/static/uploads/cfit/{filename}"

    try:
        new_q = CfitQuestion(
            subtest=subtest,
            subtest_name=f"Subtest {subtest}",
            instruction=instruction,
            image_url=image_url,
            options=options,
            correct_answer=correct_answer,
            order=CfitQuestion.query.filter_by(subtest=subtest).count() + 1
        )
        db.session.add(new_q)
        db.session.commit()
        return jsonify({"message": "Soal CFIT berhasil disimpan", "id": new_q.id}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 400
    
@mgmt_bp.route("/questions/cfit/<int:question_id>", methods=["DELETE"])
def delete_cfit_question(question_id):
    q = CfitQuestion.query.get_or_404(question_id)
    try:
        if q.image_url:
            full_path = os.path.join('app', q.image_url.lstrip('/'))
            if os.path.exists(full_path):
                os.remove(full_path)
        
        db.session.delete(q)
        db.session.commit()
        return jsonify({"message": "Soal berhasil dihapus"})
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@submit_bp.route("/cfit", methods=["POST"])
def submit_cfit():
    data = request.get_json()
    token = data.get('token') 
    answers = data.get('answers') 
    
    link = TestLink.query.filter_by(token=token).first()
    if not link: 
        return jsonify({"error": "Token tidak valid atau tidak ditemukan"}), 404

    questions = CfitQuestion.query.order_by(CfitQuestion.id).all()
    
    raw_score = 0
    details = []

    for idx, q in enumerate(questions):
        is_correct = False
        if idx < len(answers) and answers[idx] is not None:
            if answers[idx] == q.correct_answer:
                raw_score += 1
                is_correct = True
        
        details.append({
            "q_id": q.id,
            "user_ans": answers[idx],
            "correct": is_correct
        })

    norma = CfitNorma.query.filter_by(raw_score=raw_score).first()
    
    iq_score = norma.iq_score if norma else 0
    classification = norma.classification if norma else "Unclassified"

    submission = TestSubmission(
        link_id=link.id, 
        test_type='cfit',
        raw_answers=answers,
        scores={
            "raw_score": raw_score,
            "iq": iq_score,
            "classification": classification,
            "detail_breakdown": details
        }
    )
    db.session.add(submission)
    db.session.commit()

    return jsonify({"status": "success", "iq": iq_score})

@mgmt_bp.route("/config/kraepelin", methods=["GET", "PUT"])
def kraepelin_config_mgmt():
    config = KraepelinConfig.query.first()
    
    if config is None:
        config = KraepelinConfig(columns=50, rows=27, duration_per_column=15)
        db.session.add(config)
        db.session.commit()

    if request.method == "PUT":
        data = request.json
        config.columns = data.get('columns', config.columns)
        config.rows = data.get('rows', config.rows)
        config.duration_per_column = data.get('durationPerColumn', config.duration_per_column)
        db.session.commit()
        return jsonify({"message": "Config updated"})
    
    return jsonify({
        "columns": config.columns,
        "rows": config.rows,
        "durationPerColumn": config.duration_per_column
    })

@submit_bp.route("/kraepelin", methods=["POST"])
def submit_kraepelin():
    data = request.get_json()
    token = data.get('token')
    
    fe_results = data.get('results') 
    raw_answers = data.get('answers') 
    
    link = TestLink.query.filter_by(token=token).first()
    if not link: return jsonify({"error": "Unauthorized"}), 401

    submission = TestSubmission(
        link_id=link.id,
        test_type='kraepelin',
        raw_answers=raw_answers, 
        scores=fe_results       
    )
    db.session.add(submission)
    db.session.commit()
    
    return jsonify({"status": "success", "data": fe_results})


@mgmt_bp.route("/seed/cfit-norma", methods=["POST"])
def seed_cfit_norma():
    data = request.get_json() 
    
    try:
        CfitNorma.query.delete()
        
        for item in data:
            norma = CfitNorma(
                raw_score=item['rs'],
                iq_score=item['iq'],
                classification=item['class']
            )
            db.session.add(norma)
        
        db.session.commit()
        return jsonify({"message": f"Berhasil memasukkan {len(data)} data norma CFIT"}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@mgmt_bp.route("/seed/papi-map", methods=["POST"])
def seed_papi_map():
    data = request.get_json()
    
    try:
        PapiScoringMap.query.delete()
        
        for item in data:
            map_a = PapiScoringMap(question_id=item['q'], choice='A', aspect=item['a'])
            db.session.add(map_a)
            
            map_b = PapiScoringMap(question_id=item['q'], choice='B', aspect=item['b'])
            db.session.add(map_b)
            
        db.session.commit()
        return jsonify({"message": "Mapping Scoring PAPI berhasil disimpan"}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500
    
@mgmt_bp.route("/seed/papi-questions", methods=["POST"])
def seed_papi_questions():
    data = request.get_json() 
    
    try:
        for item in data:
            existing = PapiQuestion.query.get(item['id'])
            if not existing:
                q = PapiQuestion(
                    id=item['id'],
                    statement_a=item['a'],
                    statement_b=item['b']
                )
                db.session.add(q)
        
        db.session.commit()
        return jsonify({"message": f"Berhasil seed {len(data)} soal PAPI"}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


@mgmt_bp.route("/seed/cfit-questions", methods=["POST"])
def seed_cfit_questions():
    data = request.get_json()
    
    try:
        for item in data:
            img_path = f"/static/uploads/cfit/cfit_s{item['subtest']}_{item['order']}.jpg"
            
            q = CfitQuestion(
                subtest=item['subtest'],
                subtest_name=f"Subtest {item['subtest']}",
                instruction="Pilihlah jawaban yang paling tepat.", 
                image_url=img_path, 
                options=item.get('options', "A,B,C,D,E,F"),
                correct_answer=item['answer'],
                order=item['order']
            )
            db.session.add(q)
            
        db.session.commit()
        return jsonify({"message": f"Berhasil seed {len(data)} soal CFIT"}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500