import os
from dotenv import load_dotenv
import requests

load_dotenv("backend/.env")
URL = os.getenv("SUPABASE_URL")
KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

res = requests.get(f"{URL}/rest/v1/project_monthly_progress?limit=1", headers={
    "apikey": KEY,
    "Authorization": f"Bearer {KEY}"
})
print("project_monthly_progress:", res.json())
