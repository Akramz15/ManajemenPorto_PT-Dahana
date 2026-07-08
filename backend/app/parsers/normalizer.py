import re
from decimal import Decimal, InvalidOperation


def normalize_indonesian_number(raw: str | int | float | None) -> float | None:
    if raw is None:
        return None
    if isinstance(raw, (int, float)):
        return float(raw)

    text = str(raw).strip()
    if not text or text in ("-", "–", "—", "N/A", "n/a", ""):
        return None

    text = re.sub(r"[Rp\s]", "", text)
    text = re.sub(r"[()]", "", text)

    comma_count = text.count(",")
    dot_count = text.count(".")

    if comma_count == 1 and dot_count > 0:
        last_comma = text.rfind(",")
        last_dot = text.rfind(".")
        if last_comma > last_dot:
            text = text.replace(".", "").replace(",", ".")
        else:
            text = text.replace(",", "")
    elif comma_count > 1:
        text = text.replace(",", "")
    elif comma_count == 1 and dot_count == 0:
        parts = text.split(",")
        if len(parts[1]) <= 2:
            text = text.replace(",", ".")
        else:
            text = text.replace(",", "")
    elif dot_count == 1 and comma_count == 0:
        parts = text.split(".")
        if len(parts[1]) == 3:
            text = text.replace(".", "")
    elif dot_count > 1:
        text = text.replace(".", "")

    try:
        return float(Decimal(text))
    except InvalidOperation:
        return None
