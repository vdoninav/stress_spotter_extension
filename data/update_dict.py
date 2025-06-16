"""
update_dict.py  – добавляет новые ударённые формы из CSV-файла
в существующий dict.json.

* Формат dict.json: { "буква": "бУква", ... }
* Формат CSV (UTF-8, с заголовком):
    id,word_id,form_type,position,form,form_bare

Новую пару добавляем, **только если** её ещё нет в dict.json
и в form есть символ ударения ' (апостроф после ударной буквы).

Запуск:
    python update_dict.py forms.csv dict.json
"""

import argparse
import csv
import json
from pathlib import Path
from typing import Optional

VOWELS = "аеёиоуыэюяAEЁИОУЫЭЮЯ"

def accent_to_caps(token: str) -> Optional[str]:
    """
    Превращает «зна'ю» → «знаЮ», «говоря'» → «говорЯ».
    Возвращает None, если апострофа нет или он в невалидной позиции.
    """
    if "'" not in token:
        return None

    idx = token.find("'")
    if idx == 0:                 
        return None
    if token[idx - 1] not in VOWELS:
        return None              

    chars = list(token)
    del chars[idx]             
    chars[idx - 1] = chars[idx - 1].upper()
    return "".join(chars)


def main(csv_path: Path, dict_path: Path) -> None:
    if dict_path.exists():
        with dict_path.open("r", encoding="utf-8") as jf:
            stress_dict = json.load(jf)
    else:
        stress_dict = {}

    added = 0
    with csv_path.open("r", encoding="utf-8") as cf:
        reader = csv.DictReader(cf)
        for row in reader:
            word_raw = row["form"].strip()
            stressed = accent_to_caps(word_raw)
            if stressed is None:
                continue           

            key = stressed.lower()    
            if key not in stress_dict:
                stress_dict[key] = stressed
                added += 1


    with dict_path.open("w", encoding="utf-8") as jf:
        json.dump(stress_dict, jf, ensure_ascii=False, indent=2)

    print(f"Добавлено новых слов: {added}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Обновить словарь ударений из CSV."
    )
    parser.add_argument("csv_file", type=Path, help="Путь к forms.csv")
    parser.add_argument("dict_json", type=Path, help="Путь к dict.json")
    args = parser.parse_args()

    main(args.csv_file, args.dict_json)
