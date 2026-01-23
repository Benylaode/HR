import io
import pytest
from app import create_app, db
from app.models import ATARequest, JobPosition

# =========================
# FIXTURES
# =========================

@pytest.fixture(scope="module")
def app():
    app = create_app(testing=True)
    with app.app_context():
        yield app

@pytest.fixture(scope="module")
def client(app):
    return app.test_client()

# =========================
# TEST CREATE ATA
# =========================

def test_create_ata_request_with_file(client):
    data = {
        "requester_name": "Manager IT",
        "title": "DevOps Engineer",
        "department": "IT",
        "level": "Senior",
        "location": "Jakarta",
        "employment_type": "Fulltime",
        "salary_min": "15000000",
        "salary_max": "25000000",
        "justification": "Urgent replacement",
        "file": (io.BytesIO(b"%PDF dummy"), "approval.pdf")
    }

    res = client.post(
        "/ata",
        data=data,
        content_type="multipart/form-data"
    )

    assert res.status_code == 201
    json_data = res.get_json()
    assert "REQ-" in json_data["id"]
    assert json_data["attachment"] is not None

    # Verifikasi DB
    req = ATARequest.query.get(json_data["id"])
    assert req is not None
    assert req.title == "DevOps Engineer"


# =========================
# TEST FULL APPROVAL FLOW
# =========================

def test_full_ata_approval_flow(client):
    # 1. Buat Request
    res = client.post("/ata", data={
        "requester_name": "VP Eng",
        "title": "Backend Engineer",
        "department": "Engineering",
        "level": "Mid",
        "location": "Remote",
        "employment_type": "Fulltime",
        "salary_min": "10000000",
        "salary_max": "20000000"
    }, content_type="multipart/form-data")
    
    req_id = res.get_json()["id"]

    # 2. HR APPROVE
    res = client.post(f"/ata/{req_id}/approve", json={
        "role": "HR",
        "decision": "Approved"
    })
    assert res.status_code == 200

    # 3. KTT APPROVE
    res = client.post(f"/ata/{req_id}/approve", json={
        "role": "KTT",
        "decision": "Approved"
    })
    assert res.status_code == 200

    # 4. HO APPROVE (FINAL)
    res = client.post(f"/ata/{req_id}/approve", json={
        "role": "HO",
        "decision": "Approved"
    })

    assert res.status_code == 200
    data = res.get_json()

    assert data["status"] == "Approved"

    # Verifikasi Job Terbuat
    job = db.session.get(JobPosition, data["job_id"])
    assert job is not None
    assert job.title == "Backend Engineer"


# =========================
# TEST REJECTION FLOW (YANG ERROR SEBELUMNYA)
# =========================

def test_ata_rejected_by_ktt(client):
    """
    Test scenario where KTT rejects the request.
    FIX: Added mandatory fields (level, location, employment_type)
    """
    res = client.post("/ata", data={
        "requester_name": "HR Manager",
        "title": "Intern Admin",
        "department": "HR",
        
        # [PERBAIKAN] Field wajib ini sebelumnya tidak ada, makanya error
        "level": "Intern",
        "location": "Jakarta Head Office",
        "employment_type": "Internship"
        
    }, content_type="multipart/form-data")

    # Debug print jika masih gagal
    if res.status_code != 201:
        print(f"\n[DEBUG ERROR] Response: {res.get_json()}")

    assert res.status_code == 201
    req_id = res.get_json()["id"]

    # HR APPROVE
    client.post(f"/ata/{req_id}/approve", json={
        "role": "HR",
        "decision": "Approved"
    })

    # KTT REJECT
    res = client.post(f"/ata/{req_id}/approve", json={
        "role": "KTT",
        "decision": "Rejected",
        "notes": "Budget limitation"
    })

    assert res.status_code == 200
    assert res.get_json()["status"] == "Rejected"

    req = ATARequest.query.get(req_id)
    assert req.status == "Rejected"
    assert req.job_id is None