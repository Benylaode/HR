import sys
import os
import pytest
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service 
from webdriver_manager.chrome import ChromeDriverManager
from app import create_app, db as _db

# Fix path import app
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

@pytest.fixture(scope="session")
def app():
    app = create_app(testing=True)
    with app.app_context():
        yield app

@pytest.fixture(scope="session")
def client(app):
    return app.test_client()

@pytest.fixture(scope="session")
def driver():
    """Setup Chrome Driver Selenium dengan opsi Headless yang benar."""
    options = Options()
    # Opsi penting untuk environment CI/CD atau Server
    options.add_argument("--headless=new") # Gunakan mode headless baru yang lebih stabil
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    options.add_argument("--window-size=1920,1080")
    options.add_argument("--disable-gpu")
    
    # Otomatis install driver yang cocok dengan Chrome yang terinstall
    try:
        service = Service(ChromeDriverManager().install())
        driver = webdriver.Chrome(service=service, options=options)
        yield driver
        driver.quit()
    except Exception as e:
        pytest.fail(f"Gagal inisialisasi Selenium Driver. Pastikan Chrome terinstall. Error: {e}")
import os
import pytest
from selenium import webdriver
# [UBAH 1] Import Options khusus Firefox
from selenium.webdriver.firefox.options import Options
from selenium.webdriver.firefox.service import Service 
# [UBAH 2] Import GeckoDriverManager (Manager untuk Firefox)
from webdriver_manager.firefox import GeckoDriverManager
from app import create_app, db as _db

# Fix path import app
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

@pytest.fixture(scope="session")
def app():
    app = create_app(testing=True)
    with app.app_context():
        yield app

@pytest.fixture(scope="session")
def client(app):
    return app.test_client()

@pytest.fixture(scope="session")
def driver():
    """Setup Mozilla Firefox Driver (GeckoDriver) dengan opsi Headless."""
    options = Options()
    
    # [UBAH 3] Konfigurasi Opsi Firefox
    # Gunakan --headless agar browser tidak muncul secara fisik (penting untuk CI/CD)
    options.add_argument("--headless") 
    options.add_argument("--width=1920")
    options.add_argument("--height=1080")
    
    # Opsional: Jika ingin melihat browser saat test lokal, comment baris headless di atas
    
    try:
        # [UBAH 4] Inisialisasi menggunakan GeckoDriverManager
        print("\n[INFO] Menginstall GeckoDriver untuk Firefox...")
        service = Service(GeckoDriverManager().install())
        driver = webdriver.Firefox(service=service, options=options)
        
        yield driver
        driver.quit()
        
    except Exception as e:
        pytest.fail(f"Gagal inisialisasi Firefox Driver. Pastikan browser Firefox terinstall. Error: {e}")