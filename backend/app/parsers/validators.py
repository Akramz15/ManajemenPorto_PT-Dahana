import io
import openpyxl

MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024


def validate_excel_file(file_bytes: io.BytesIO, filename: str) -> None:
    file_bytes.seek(0, 2)
    size = file_bytes.tell()
    file_bytes.seek(0)

    if size > MAX_FILE_SIZE_BYTES:
        raise ValueError(
            f"Ukuran file ({size // 1024 // 1024} MB) melebihi batas 20 MB"
        )

    if not filename.lower().endswith((".xlsx", ".xls")):
        raise ValueError("Format file harus .xlsx atau .xls")

    try:
        wb = openpyxl.load_workbook(file_bytes, read_only=True, data_only=True)
        if not wb.sheetnames:
            raise ValueError("File Excel tidak memiliki sheet")
        file_bytes.seek(0)
    except ValueError:
        raise
    except Exception as e:
        raise ValueError(f"File Excel tidak dapat dibaca: {str(e)}")
