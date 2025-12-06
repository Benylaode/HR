import './style.css'

// HR Recruitment System Main Entry Point
console.log('HR Recruitment System Frontend initialized')

const app = document.querySelector('#app')

// Available views
const views = [
  { name: 'Dashboard', path: '/views/dashboard.html', icon: '📊' },
  { name: 'Job Management', path: '/views/job-management.html', icon: '💼' },
  { name: 'Posisi', path: '/views/posisi.html', icon: '📋' },
  // { name: 'Candidate Management', path: '/views/candidate-management.html', icon: '👥' },
  { name: 'Kandidat', path: '/views/kandidat.html', icon: '👤' },
  { name: 'Test Management', path: '/views/test-management.html', icon: '📝' },
  { name: 'Test Admin', path: '/views/test-admin.html', icon: '⚙️' },
  { name: 'Test Interface', path: '/views/test.html', icon: '🖥️' },
  { name: 'Analytics', path: '/views/analytics.html', icon: '📈' },
  { name: 'Laporan', path: '/views/laporan.html', icon: '📄' },
  { name: 'Application Form', path: '/views/application-form.html', icon: '📝' },
  { name: 'Form Apply', path: '/views/form-apply.html', icon: '✍️' },
]

// Create index page
app.innerHTML = `
  <div style="min-height: 100vh; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
    <div style="max-width: 1200px; margin: 0 auto; padding: 3rem 1.5rem;">
      <div style="text-align: center; margin-bottom: 3rem;">
        <h1 style="color: white; font-size: 3rem; font-weight: 800; margin-bottom: 1rem; text-shadow: 0 2px 10px rgba(0,0,0,0.2);">
          HR Recruitment System
        </h1>
        <p style="color: rgba(255,255,255,0.9); font-size: 1.125rem;">
          Pilih halaman yang ingin Anda akses
        </p>
      </div>

      <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1.5rem;">
        ${views.map(view => `
          <a href="${view.path}" style="
            display: block;
            background: white;
            padding: 2rem;
            border-radius: 1rem;
            text-decoration: none;
            color: inherit;
            box-shadow: 0 10px 30px rgba(0,0,0,0.2);
            transition: all 0.3s ease;
            border: 2px solid transparent;
          "
          onmouseover="this.style.transform='translateY(-8px)'; this.style.boxShadow='0 20px 40px rgba(0,0,0,0.3)'; this.style.borderColor='#667eea';"
          onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 10px 30px rgba(0,0,0,0.2)'; this.style.borderColor='transparent';">
            <div style="font-size: 3rem; margin-bottom: 1rem;">${view.icon}</div>
            <h3 style="color: #1a202c; font-size: 1.25rem; font-weight: 700; margin-bottom: 0.5rem;">
              ${view.name}
            </h3>
            <p style="color: #718096; font-size: 0.875rem;">
              Klik untuk membuka
            </p>
          </a>
        `).join('')}
      </div>

      <div style="margin-top: 3rem; text-align: center;">
        <p style="color: rgba(255,255,255,0.8); font-size: 0.875rem;">
          💡 Tip: Setiap halaman akan terbuka dengan tampilan penuh yang sama persis dengan desain aslinya
        </p>
      </div>
    </div>
  </div>
`
