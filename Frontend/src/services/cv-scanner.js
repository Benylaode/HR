// CV Scanner Service
const API_BASE_URL = "http://localhost:5000"; 

class CVScanner {
    constructor() {
        this.candidates = [];
        this.availablePositions = [
            {
                id: 1,
                title: 'Frontend Developer',
                department: 'Engineering',
                requirements: ['React', 'JavaScript', 'TypeScript', 'CSS', 'HTML'],
                skills: ['Frontend', 'UI/UX', 'Web Development'],
                experience: '2+ years',
                salary: '8-15M',
                level: 'Mid-Senior'
            },
            {
                id: 2,
                title: 'Backend Developer',
                department: 'Engineering',
                requirements: ['Node.js', 'Python', 'Database', 'API', 'REST'],
                skills: ['Backend', 'Database', 'API Development'],
                experience: '3+ years',
                salary: '10-20M',
                level: 'Mid-Senior'
            },
            {
                id: 3,
                title: 'Full Stack Developer',
                department: 'Engineering',
                requirements: ['JavaScript', 'React', 'Node.js', 'Database', 'API'],
                skills: ['Full Stack', 'Frontend', 'Backend'],
                experience: '4+ years',
                salary: '12-25M',
                level: 'Senior'
            },
            {
                id: 4,
                title: 'Data Scientist',
                department: 'Data',
                requirements: ['Python', 'Machine Learning', 'Statistics', 'SQL', 'Data Analysis'],
                skills: ['Data Science', 'ML', 'Analytics'],
                experience: '3+ years',
                salary: '15-30M',
                level: 'Senior'
            },
            {
                id: 5,
                title: 'Product Manager',
                department: 'Product',
                requirements: ['Product Strategy', 'Agile', 'Analytics', 'Leadership', 'Communication'],
                skills: ['Product Management', 'Strategy', 'Leadership'],
                experience: '5+ years',
                salary: '20-35M',
                level: 'Senior'
            },
            {
                id: 6,
                title: 'UI/UX Designer',
                department: 'Design',
                requirements: ['Figma', 'Adobe XD', 'Design Thinking', 'Prototyping', 'User Research'],
                skills: ['UI Design', 'UX Design', 'Prototyping'],
                experience: '2+ years',
                salary: '7-12M',
                level: 'Mid'
            },
            {
                id: 7,
                title: 'DevOps Engineer',
                department: 'Engineering',
                requirements: ['Docker', 'Kubernetes', 'AWS', 'CI/CD', 'Linux'],
                skills: ['DevOps', 'Cloud', 'Infrastructure'],
                experience: '3+ years',
                salary: '12-22M',
                level: 'Senior'
            },
            {
                id: 8,
                title: 'Business Analyst',
                department: 'Business',
                requirements: ['SQL', 'Excel', 'Business Analysis', 'Communication', 'Problem Solving'],
                skills: ['Business Analysis', 'Data Analysis', 'Requirements Gathering'],
                experience: '2+ years',
                salary: '8-15M',
                level: 'Mid'
            }
        ];
        this.processing = false;
    }

    initialize() {
        this.setupEventListeners();
        this.loadPositionFilters();
        this.updateStatistics();
        this.loadCandidatesFromDB();
        // this.loadLeaderboard(5);
    }

    setupEventListeners() {
        const uploadArea = document.getElementById('uploadArea');
        const fileInput = document.getElementById('fileInput');
        const searchInput = document.getElementById('searchInput');
        const positionFilter = document.getElementById('positionFilter');
        const scoreFilter = document.getElementById('scoreFilter');

        // Drag & Drop
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('dragover');
        });

        uploadArea.addEventListener('dragleave', () => {
            uploadArea.classList.remove('dragover');
        });

        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
            const files = Array.from(e.dataTransfer.files).filter(file => file.type === 'application/pdf');
            if (files.length > 0) {
                this.processFiles(files);
            }
        });

        // File Input
        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                this.processFiles(Array.from(e.target.files));
            }
        });

        // Filters
        searchInput.addEventListener('input', () => this.filterResults());
        positionFilter.addEventListener('change', () => this.filterResults());
        scoreFilter.addEventListener('change', () => this.filterResults());
    }

    // Load Position Filters
    loadPositionFilters() {
        const positionFilter = document.getElementById('positionFilter');
        this.availablePositions.forEach(position => {
            const option = document.createElement('option');
            option.value = position.title;
            option.textContent = position.title;
            positionFilter.appendChild(option);
        });
    }

    // Process Files
    async processFiles(files) {
        this.processing = true;
        this.showProcessing(true);
        this.candidates = [];

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            this.updateProcessingText(`Processing ${file.name} (${i + 1}/${files.length})`);

            // Simulate processing delay
            await this.delay(1000);

            const candidate = await this.analyzeCV(file);
            this.candidates.push(candidate);

            // Update UI incrementally
            if (i === 0 || i === files.length - 1) {
                this.renderResults();
            }
        }

        this.processing = false;
        this.showProcessing(false);
        this.updateStatistics();
        this.renderResults();
    }

    // Load Leaderboard from Backend
    // async loadLeaderboard(limit = 5) {
    //     try {
    //         const res = await fetch(`${API_BASE_URL}/screening/leaderboard?limit=${limit}`);
    //         if (!res.ok) {
    //             throw new Error("Failed to fetch leaderboard");
    //         }

    //         const data = await res.json();
    //         this.renderLeaderboard(data.leaderboard);

    //     } catch (err) {
    //         console.error("Leaderboard error:", err);
    //     }
    // }
    // renderLeaderboard(leaderboardData) {
    //     const container = document.getElementById("leaderboardSection");
    //     if (!container) return;

    //     container.innerHTML = "";

    //     Object.entries(leaderboardData).forEach(([position, candidates]) => {
    //         if (candidates.length === 0) return;

    //         const section = document.createElement("div");
    //         section.className = "bg-white rounded-xl shadow-sm p-6 mb-6";

    //         section.innerHTML = `
    //             <h3 class="text-lg font-semibold text-gray-900 mb-4">
    //                 🏆 Leaderboard – ${position}
    //             </h3>
    //             <div class="space-y-3">
    //                 ${candidates.map((c, idx) => `
    //                     <div class="flex items-center justify-between p-3 rounded-lg ${
    //                         idx === 0 ? "bg-green-50 border border-green-200" : "bg-gray-50"
    //                     }">
    //                         <div>
    //                             <p class="font-medium text-gray-900">
    //                                 ${idx + 1}. ${c.name}
    //                             </p>
    //                             <p class="text-xs text-gray-600">
    //                                 ${c.education || "-"} • ${c.experience || "-"}
    //                             </p>
    //                         </div>
    //                         <div class="text-right">
    //                             <div class="text-lg font-bold ${
    //                                 idx === 0 ? "text-green-600" : "text-gray-700"
    //                             }">
    //                                 ${c.match_score}%
    //                             </div>
    //                             <p class="text-xs text-gray-500">Match</p>
    //                         </div>
    //                     </div>
    //                 `).join("")}
    //             </div>
    //         `;

    //         container.appendChild(section);
    //     });
    // }


    // Load candidates from backend database
    async loadCandidatesFromDB() {
        try {
            const res = await fetch(`${API_BASE_URL}/screening/candidates`);
            if (!res.ok) {
                throw new Error("Failed to fetch candidates");
            }

            const data = await res.json();

            // Normalisasi agar kompatibel dengan UI yang sudah ada
            this.candidates = data.map(c => ({
                id: String(c.resume_id),
                name: c.name || "Unknown",
                email: c.email || "-",
                phone: c.phone || "-",
                education: c.education || "-",
                experience: c.experience || "-",
                skills: Array.isArray(c.skills) ? c.skills : [],
                matches: [
                    {
                        position: {
                            title: c.top_position,
                            department: "-",
                            salary: "-",
                            level: "-"
                        },
                        matchScore: c.match_score,
                        skillMatch: Math.min(100, c.match_score + 5),
                        experienceMatch: Math.max(40, c.match_score - 10),
                        reasons: c.verdict ? [c.verdict] : []
                    }
                ],
                topMatch: {
                    position: {
                        title: c.top_position,
                        department: "-",
                        salary: "-",
                        level: "-"
                    },
                    matchScore: c.match_score,
                    skillMatch: Math.min(100, c.match_score + 5),
                    experienceMatch: Math.max(40, c.match_score - 10),
                    reasons: c.verdict ? [c.verdict] : []
                },
                fileName: "-",
                processedAt: c.created_at
            }));

            this.renderResults();
            this.updateStatistics();

        } catch (err) {
            console.error("Load candidates error:", err);
        }
    }

    // Analyze CV (Automated Analysis)
    async analyzeCV(file) {
        // 1️⃣ Upload CV
        const formData = new FormData();
        formData.append("file", file);

        const uploadRes = await fetch(`${API_BASE_URL}/screening/upload_resume`, {
            method: "POST",
            body: formData
        });

        if (!uploadRes.ok) {
            throw new Error("Upload resume failed");
        }

        const uploadData = await uploadRes.json();
        const resumeId = uploadData.id;

        // 2️⃣ Match CV dengan JD (bisa kamu ganti dinamis)
        const jobDescription = `
            Software engineer with experience in web development,
            backend systems, APIs, databases, and teamwork.
        `;

        const matchRes = await fetch(`${API_BASE_URL}/screening/match_resume`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                resume_id: resumeId,
                job_description: jobDescription,
                top_k: 5
            })
        });

        if (!matchRes.ok) {
            throw new Error("Resume matching failed");
        }

        const candidate = await matchRes.json();

        // 3️⃣ NORMALISASI DATA (ATS SAFE)
        return {
            id: String(candidate.id), // UUID string
            name: candidate.name || "Unknown",
            email: candidate.email || "-",
            phone: candidate.phone || "-",
            education: candidate.education || "-",
            experience: candidate.experience || "-",
            skills: Array.isArray(candidate.skills) ? candidate.skills : [],
            matches: Array.isArray(candidate.matches) ? candidate.matches : [],
            topMatch: candidate.topMatch || candidate.matches?.[0],
            fileName: file.name,
            processedAt: new Date().toISOString()
        };
    }



    // Calculate Skill Match
    calculateSkillMatch(candidateSkills, positionRequirements) {
        const matches = candidateSkills.filter(skill =>
            positionRequirements.some(req =>
                skill.toLowerCase().includes(req.toLowerCase()) ||
                req.toLowerCase().includes(skill.toLowerCase())
            )
        ).length;

        return Math.min(100, (matches / positionRequirements.length) * 100 + Math.random() * 20);
    }

    // Calculate Experience Match
    calculateExperienceMatch(candidateExp, positionExp) {
        const candidateYears = parseInt(candidateExp);
        const requiredYears = parseInt(positionExp);

        if (candidateYears >= requiredYears) {
            return Math.min(100, 80 + Math.random() * 20);
        } else {
            return Math.max(0, (candidateYears / requiredYears) * 70 + Math.random() * 10);
        }
    }

    // Generate Match Reasons
    generateMatchReasons(skills, position, skillMatch, experienceMatch) {
        const reasons = [];

        if (skillMatch > 70) {
            const matchingSkills = skills.filter(skill =>
                position.requirements.some(req =>
                    skill.toLowerCase().includes(req.toLowerCase())
                )
            );
            reasons.push(`Strong match with required skills: ${matchingSkills.slice(0, 3).join(', ')}`);
        }

        if (skillMatch > 50 && skillMatch <= 70) {
            reasons.push('Partial skill match, additional training may be needed');
        }

        if (experienceMatch > 70) {
            reasons.push('Experience level meets or exceeds requirements');
        } else if (experienceMatch > 40) {
            reasons.push('Experience level is close to requirements');
        }

        if (reasons.length === 0) {
            reasons.push('Candidate shows potential but needs significant skill development');
        }

        return reasons;
    }

    // Render Results
    renderResults() {
        const resultsSection = document.getElementById('resultsSection');
        const cvResults = document.getElementById('cvResults');

        if (this.candidates.length === 0) {
            resultsSection.classList.add('hidden');
            return;
        }

        resultsSection.classList.remove('hidden');
        cvResults.innerHTML = '';

        this.candidates.forEach(candidate => {
            const card = this.createCandidateCard(candidate);
            cvResults.appendChild(card);
        });

        // Reinitialize icons
        lucide.createIcons();
    }

    // Create Candidate Card
    createCandidateCard(candidate) {
        const card = document.createElement('div');
        card.className = 'bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow';
        card.innerHTML = `
            <div class="p-6">
                <!-- Header -->
                <div class="flex items-start justify-between mb-4">
                    <div>
                        <h3 class="text-lg font-semibold text-gray-900">${candidate.name}</h3>
                        <p class="text-sm text-gray-600">${candidate.email}</p>
                        <p class="text-sm text-gray-600">${candidate.phone}</p>
                    </div>
                    <div class="text-right">
                        <div class="match-score text-white px-3 py-1 rounded-full text-sm font-medium">
                            ${candidate.topMatch.matchScore}% Match
                        </div>
                    </div>
                </div>

                <!-- Info -->
                <div class="grid grid-cols-2 gap-4 mb-4">
                    <div>
                        <p class="text-xs text-gray-500">Education</p>
                        <p class="text-sm font-medium">${candidate.education}</p>
                    </div>
                    <div>
                        <p class="text-xs text-gray-500">Experience</p>
                        <p class="text-sm font-medium">${candidate.experience}</p>
                    </div>
                </div>

                <!-- Skills -->
                <div class="mb-4">
                    <p class="text-xs text-gray-500 mb-2">Skills</p>
                    <div class="flex flex-wrap gap-1">
                        ${candidate.skills.slice(0, 6).map(skill =>
                            `<span class="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-full">${skill}</span>`
                        ).join('')}
                        ${candidate.skills.length > 6 ? `<span class="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">+${candidate.skills.length - 6}</span>` : ''}
                    </div>
                </div>

                <!-- Top Position Match -->
                <div class="border-t pt-4">
                    <div class="flex items-center justify-between mb-2">
                        <p class="text-sm font-medium text-gray-900">Best Match: ${candidate.topMatch.position.title}</p>
                        <span class="text-xs text-gray-500">${candidate.topMatch.position.level} • ${candidate.topMatch.position.salary}</span>
                    </div>
                    <div class="space-y-1">
                        <div class="flex justify-between text-xs">
                            <span class="text-gray-600">Skill Match</span>
                            <span class="font-medium">${candidate.topMatch.skillMatch}%</span>
                        </div>
                        <div class="flex justify-between text-xs">
                            <span class="text-gray-600">Experience Match</span>
                            <span class="font-medium">${candidate.topMatch.experienceMatch}%</span>
                        </div>
                    </div>
                    <div class="mt-3">
                        ${candidate.topMatch.reasons.map(reason =>
                            `<p class="text-xs text-green-700 bg-green-50 px-2 py-1 rounded">✓ ${reason}</p>`
                        ).join('')}
                    </div>
                </div>

                <!-- Actions -->
                <div class="flex gap-2 mt-4">
                    <button onclick="cvScanner.viewDetails('${candidate.id}')"
                            class="flex-1 px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors">
                        View Details
                    </button>
                    <button onclick="cvScheduler.scheduleInterview('${candidate.id}')"
                            class="flex-1 px-3 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors">
                        Schedule Interview
                    </button>
                </div>
            </div>
        `;
        return card;
    }

    // View Candidate Details
    viewDetails(candidateId) {
        const candidate = this.candidates.find(
            c => String(c.id) === String(candidateId)
        );

        // Create modal
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4';
        modal.onclick = (e) => {
            if (e.target === modal) {
                document.body.removeChild(modal);
            }
        };

        modal.innerHTML = `
            <div class="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                <div class="p-6">
                    <div class="flex justify-between items-start mb-6">
                        <div>
                            <h2 class="text-2xl font-bold text-gray-900">${candidate.name}</h2>
                            <p class="text-gray-600">${candidate.email} • ${candidate.phone}</p>
                        </div>
                        <button onclick="this.closest('.fixed').remove()"
                                class="text-gray-400 hover:text-gray-600">
                            <i data-lucide="x" class="w-6 h-6"></i>
                        </button>
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <!-- Profile Info -->
                        <div class="md:col-span-1 space-y-4">
                            <div class="bg-gray-50 rounded-lg p-4">
                                <h3 class="font-semibold text-gray-900 mb-3">Profile Information</h3>
                                <div class="space-y-2">
                                    <div>
                                        <p class="text-xs text-gray-500">Education</p>
                                        <p class="text-sm font-medium">${candidate.education}</p>
                                    </div>
                                    <div>
                                        <p class="text-xs text-gray-500">Experience</p>
                                        <p class="text-sm font-medium">${candidate.experience}</p>
                                    </div>
                                    <div>
                                        <p class="text-xs text-gray-500">CV File</p>
                                        <p class="text-sm font-medium text-blue-600">${candidate.fileName}</p>
                                    </div>
                                </div>
                            </div>

                            <div class="bg-gray-50 rounded-lg p-4">
                                <h3 class="font-semibold text-gray-900 mb-3">All Skills</h3>
                                <div class="flex flex-wrap gap-1">
                                    ${candidate.skills.map(skill =>
                                        `<span class="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-full">${skill}</span>`
                                    ).join('')}
                                </div>
                            </div>
                        </div>

                        <!-- Position Matches -->
                        <div class="md:col-span-2">
                            <h3 class="font-semibold text-gray-900 mb-4">Position Matches</h3>
                            <div class="space-y-4">
                                ${candidate.matches.map((match, index) => `
                                    <div class="border rounded-lg p-4 ${index === 0 ? 'border-green-200 bg-green-50' : 'border-gray-200'}">
                                        <div class="flex justify-between items-start mb-3">
                                            <div>
                                                <h4 class="font-semibold text-gray-900">${match.position.title}</h4>
                                                <p class="text-sm text-gray-600">${match.position.department} • ${match.position.level}</p>
                                                <p class="text-sm text-gray-600">${match.position.salary}</p>
                                            </div>
                                            <div class="text-right">
                                                <div class="text-2xl font-bold ${index === 0 ? 'text-green-600' : 'text-gray-700'}">${match.matchScore}%</div>
                                                <div class="text-xs text-gray-500">Match</div>
                                            </div>
                                        </div>

                                        <div class="grid grid-cols-2 gap-4 mb-3">
                                            <div>
                                                <div class="flex justify-between text-sm mb-1">
                                                    <span>Skill Match</span>
                                                    <span>${match.skillMatch}%</span>
                                                </div>
                                                <div class="w-full bg-gray-200 rounded-full h-2">
                                                    <div class="bg-blue-600 h-2 rounded-full" style="width: ${match.skillMatch}%"></div>
                                                </div>
                                            </div>
                                            <div>
                                                <div class="flex justify-between text-sm mb-1">
                                                    <span>Experience Match</span>
                                                    <span>${match.experienceMatch}%</span>
                                                </div>
                                                <div class="w-full bg-gray-200 rounded-full h-2">
                                                    <div class="bg-green-600 h-2 rounded-full" style="width: ${match.experienceMatch}%"></div>
                                                </div>
                                            </div>
                                        </div>

                                        <div class="space-y-1">
                                            ${match.reasons.map(reason =>
                                                `<p class="text-xs ${index === 0 ? 'text-green-700' : 'text-gray-600'} ${index === 0 ? 'bg-green-100' : 'bg-gray-100'} px-2 py-1 rounded">
                                                    ✓ ${reason}
                                                </p>`
                                            ).join('')}
                                        </div>
                                        ${index === 0 ? `
                                            <div class="mt-3 flex gap-2">
                                                <button onclick="cvScheduler.scheduleInterview('${candidate.id}')"
                                                        class="flex-1 px-3 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700">
                                                    Schedule Interview
                                                </button>
                                                <button onclick="cvScanner.moveToNextStep('${candidate.id}')"
                                                        class="flex-1 px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">
                                                    Move to Next Step
                                                </button>
                                            </div>
                                        ` : ''}
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        lucide.createIcons();
    }

    // Filter Results
    filterResults() {
        const searchTerm = document.getElementById('searchInput').value.toLowerCase();
        const positionFilter = document.getElementById('positionFilter').value;
        const scoreFilter = document.getElementById('scoreFilter').value;

        let filtered = [...this.candidates];

        // Name search
        if (searchTerm) {
            filtered = filtered.filter(c =>
                c.name.toLowerCase().includes(searchTerm) ||
                c.email.toLowerCase().includes(searchTerm)
            );
        }

        // Position filter
        if (positionFilter) {
            filtered = filtered.filter(c =>
                c.topMatch.position.title === positionFilter
            );
        }

        // Score filter
        if (scoreFilter) {
            if (scoreFilter === 'high') {
                filtered = filtered.filter(c => c.topMatch.matchScore >= 80);
            } else if (scoreFilter === 'medium') {
                filtered = filtered.filter(c => c.topMatch.matchScore >= 60 && c.topMatch.matchScore < 80);
            } else if (scoreFilter === 'low') {
                filtered = filtered.filter(c => c.topMatch.matchScore < 60);
            }
        }

        // Re-render filtered results
        const cvResults = document.getElementById('cvResults');
        cvResults.innerHTML = '';

        filtered.forEach(candidate => {
            const card = this.createCandidateCard(candidate);
            cvResults.appendChild(card);
        });

        lucide.createIcons();
        this.updateStatistics(filtered);
    }

    // Update Statistics
    updateStatistics(candidates = this.candidates) {
        document.getElementById('totalCV').textContent = candidates.length;
        document.getElementById('processedCV').textContent = candidates.length;
        document.getElementById('highMatch').textContent = candidates.filter(c => c.topMatch.matchScore >= 80).length;

        const uniquePositions = new Set(candidates.map(c => c.topMatch.position.title));
        document.getElementById('totalPositions').textContent = uniquePositions.size;
    }

    // Show/Hide Processing
    showProcessing(show) {
        const processingStatus = document.getElementById('processingStatus');
        if (show) {
            processingStatus.classList.remove('hidden');
        } else {
            processingStatus.classList.add('hidden');
        }
    }

    // Update Processing Text
    updateProcessingText(text) {
        document.getElementById('processingText').textContent = text;
    }

    // Clear All
    clearAll() {
        if (confirm('Are you sure you want to clear all results?')) {
            this.candidates = [];
            document.getElementById('resultsSection').classList.add('hidden');
            document.getElementById('fileInput').value = '';
            this.updateStatistics();
        }
    }

    // Export Results
    exportResults() {
        if (this.candidates.length === 0) {
            alert('No results to export');
            return;
        }

        const csvContent = this.generateCSV();
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `cv-scan-results-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
    }

    // Generate CSV
    generateCSV() {
        const headers = ['Name', 'Email', 'Phone', 'Education', 'Experience', 'Top Position', 'Match Score', 'Skill Match', 'Experience Match', 'Salary Range'];
        const rows = this.candidates.map(c => [
            c.name,
            c.email,
            c.phone,
            c.education,
            c.experience,
            c.topMatch.position.title,
            `${c.topMatch.matchScore}%`,
            `${c.topMatch.skillMatch}%`,
            `${c.topMatch.experienceMatch}%`,
            c.topMatch.position.salary
        ]);

        return [headers, ...rows].map(row => row.join(',')).join('\n');
    }

    // Utility: Delay
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Initialize CV Scanner
const cvScanner = new CVScanner();

function initializeCVScanner() {
    cvScanner.initialize();
}

// Global functions for inline handlers
function clearAll() {
    cvScanner.clearAll();
}

function exportResults() {
    cvScanner.exportResults();
}