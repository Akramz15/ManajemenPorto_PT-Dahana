import sys
import os
import json
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from app.services.supabase_service import SupabaseService

svc = SupabaseService()
try:
    data = svc.get_chart_data("dic", None)
    print(data["data_json"]["data"].keys())
    print(json.dumps(data["data_json"]["data"]["neraca"][:1], indent=2))
except Exception as e:
    import traceback
    traceback.print_exc()
