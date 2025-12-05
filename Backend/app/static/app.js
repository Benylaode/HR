async function uploadResume() {
    let file = document.getElementById("resumeFile").files[0];
    if (!file) {
        alert("Please select a PDF file.");
        return;
    }

    let formData = new FormData();
    formData.append("file", file);

    let res = await fetch("/screening/upload_resume", {
        method: "POST",
        body: formData
    });

    let data = await res.json();
    document.getElementById("uploadStatus").innerText =
        JSON.stringify(data, null, 2);
}


async function loadResumes() {
    let res = await fetch("/screening/resumes");
    let data = await res.json();

    let list = document.getElementById("resumeList");
    list.innerHTML = "";
    data.forEach(r => {
        let li = document.createElement("li");
        li.innerText = `${r.id} — ${r.filename} (${r.uploaded_at})`;
        list.appendChild(li);
    });
}


async function matchResume() {
    let resumeId = document.getElementById("resumeId").value;
    let jobDesc = document.getElementById("jobDesc").value;

    let resultBox = document.getElementById("result-box");
    resultBox.innerText = "⏳ Running matching...\nPlease wait...";

    let body = {
        resume_id: resumeId,
        job_description: jobDesc,
        top_k: 5
    };

    try {
        let res = await fetch("/screening/match_resume", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body)
        });

        let data = await res.json();

        if (data.verdict && data.verdict.result) {
            // console.log("Match result:", data.verdict.result);
            resultBox.innerText = data.verdict.result;
        } else {
            resultBox.innerText = "❌ Format response tidak sesuai.";
        }
    } catch (err) {
        resultBox.innerText = "❌ Error: " + err;
    }
}


async function extractName() {
    let id = document.getElementById("extractResumeId").value;
    let box = document.getElementById("extractResult");

    box.innerText = "⏳ Extracting name...";

    try {
        let res = await fetch(`/screening/extract_name/${id}`);
        let data = await res.json();
        box.innerText = JSON.stringify(data, null, 2);
    } catch (err) {
        box.innerText = "❌ Error: " + err;
    }
}


async function loadLeaderboard() {
    let box = document.getElementById("leaderboardBox");
    box.innerText = "⏳ Loading leaderboard...";

    try {
        let res = await fetch("/screening/leaderboard");
        let data = await res.json();
        box.innerText = JSON.stringify(data, null, 2);
    } catch (err) {
        box.innerText = "❌ Error: " + err;
    }
}
