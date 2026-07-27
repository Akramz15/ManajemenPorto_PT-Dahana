import asyncio
from app.core.database import SessionLocal
from sqlalchemy import text

async def main():
    async with SessionLocal() as db:
        result = await db.execute(text("SELECT id, nama_proyek FROM projects WHERE id IN ('50000000-0000-4000-a000-000000000001', '50000000-0000-4000-a000-000000000002')"))
        rows = result.fetchall()
        print("Found projects:", rows)
        
        if not rows:
            print("Projects not found! Let's create them bypassing RLS.")
            await db.execute(text("""
            INSERT INTO projects (id, nama_proyek, divisi, kategori, start_date, end_date, created_by)
            VALUES 
            ('50000000-0000-4000-a000-000000000001', 'Streamlining', 'lainnya', 'lainnya', '2024-01-01', '2024-12-31', 'system'),
            ('50000000-0000-4000-a000-000000000002', 'Akuisisi', 'lainnya', 'lainnya', '2024-01-01', '2024-12-31', 'system')
            ON CONFLICT (id) DO NOTHING;
            """))
            await db.commit()
            print("Projects inserted.")
            
asyncio.run(main())
