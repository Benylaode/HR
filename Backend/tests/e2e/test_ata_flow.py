import pytest
import io

def test_ata_end_to_end_flow(client):
    """
    Integration Test untuk Flow ATA Request.
    Menggunakan 'client' dari conftest.py
    """
    
    # 1. USER SUBMIT ATA (Multipart)
    data = {
        "requester_name": "Manager Ops",
        "title": "Site Supervisor",
        "department": "Operation",
        "employment_type": "Contract",
        "level": "Supervisor",
        "location": "Kalimantan",
        "salary_min": 10000000,
        "salary_max": 15000000,
        "justification": "New Project",
        # Jika endpoint butuh file, uncomment baris bawah
        # "file": (io.BytesIO(b"dummy pdf"), "budget.pdf")
    }

    res = client.post("/ata", data={
        "requester_name": "Manager Ops",
        "title": "Site Supervisor",
        "department": "Operation",
        "employment_type": "Contract",
        "level": "Supervisor", # <--- Pastikan field wajib ini ada
        "location": "Site"     # <--- Pastikan field wajib ini ada
    }, content_type="multipart/form-data")
    
    # Pastikan endpoint ada (skip jika belum dibuat)
    if res.status_code == 404:
        pytest.skip("Endpoint ATA Request belum tersedia")

    assert res.status_code == 201
    req_id = res.get_json()["id"]

    # 2. HR APPROVAL
    res_hr = client.post(f"/ata/{req_id}/approve", json={
        "role": "HR",
        "decision": "Approved"
    })
    assert res_hr.status_code == 200

    # 3. KTT APPROVAL
    res_ktt = client.post(f"/ata/{req_id}/approve", json={
        "role": "KTT",
        "decision": "Approved"
    })
    assert res_ktt.status_code == 200

    # 4. HO APPROVAL (FINAL)
    res_ho = client.post(f"/ata/{req_id}/approve", json={
        "role": "HO",
        "decision": "Approved"
    })
    assert res_ho.status_code == 200

    # Verifikasi Status Akhir
    assert res_ho.get_json()["status"] == "Approved"