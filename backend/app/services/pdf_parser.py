import io
import re
import pdfplumber
from typing import Dict, Optional, Tuple

# Updated to exactly match the 14 features from diagnosed_cbc_data_v4.csv
BIOMARKER_ALIASES = {
    "WBC": ["wbc", "total wbc", "white blood cell", "tlc", "leukocytes", "total leukocyte count"],
    "LYMp": ["lymphocytes %", "lymph %", "lymphocyte percent", "lymphocytes"],
    "NEUTp": ["neutrophils %", "neutrophil %", "polymorphs %", "neutrophils"],
    "LYMn": ["lymphocytes absolute", "absolute lymphocytes", "abs lymphocytes"],
    "NEUTn": ["neutrophils absolute", "absolute neutrophils", "abs neutrophils"],
    "RBC": ["rbc", "red blood cell", "red cell count", "total rbc"],
    "HGB": ["hgb", "hb", "hemoglobin", "haemoglobin"],
    "HCT": ["hct", "hematocrit", "haematocrit", "pcv", "packed cell volume"],
    "MCV": ["mcv", "mean corpuscular volume"],
    "MCH": ["mch", "mean corpuscular hgb", "mean corpuscular hemoglobin"],
    "MCHC": ["mchc", "mean corpuscular hgb concentration", "mean corpuscular hemoglobin concentration"],
    "PLT": ["plt", "platelet", "platelet count", "thrombocyte count"],
    "PDW": ["pdw", "platelet distribution width"],
    "PCT": ["pct", "plateletcrit"]
}

# Nephora Regex patterns
NUMERIC_RE = re.compile(r'^\d+(\.\d+)?(?:[\*HhLl])?$')
RANGE_RE = re.compile(r'(\d+\.?\d*)\s*[-–]\s*(\d+\.?\d*)')
INLINE_RE = re.compile(
    r'(.+?)\s{2,}'                          # test name (2+ spaces separator)
    r'(\d+\.?\d*)\s+'                       # numeric value
    r'([\w/%µ\s\.]+?)\s{2,}'                # unit
    r'(\d+\.?\d*\s*[-–]\s*\d+\.?\d*)'       # reference range
)

class CBCParser:
    def __init__(self):
        self.alias_map = {}
        for canonical, aliases in BIOMARKER_ALIASES.items():
            for alias in aliases:
                self.alias_map[alias.lower().strip()] = canonical

    def extract_cbc_from_pdf(self, file_bytes: bytes) -> dict:
        try:
            all_text = ""
            # Use pdfplumber with layout=True to preserve the 2+ spaces for INLINE_RE
            with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
                for page in pdf.pages:
                    text = page.extract_text(layout=True)
                    if text:
                        all_text += text + "\n"

            found = {}
            
            # Pass 1: Try Nephora inline parsing 
            found.update(self._parse_inline(all_text))
            
            # Pass 2: Nephora multiline parsing for missing targets
            missing = [b for b in BIOMARKER_ALIASES if b not in found]
            if missing:
                found.update(self._parse_multiline(all_text, missing))
                
            # Clean up the output to match MedCura schemas
            final_result = {}
            for k, v in found.items():
                final_result[k] = v["value"]
                
            return {"success": True, "data": final_result}
            
        except Exception as e:
            return {"success": False, "error": str(e), "data": {}}

    def _match_biomarker(self, text: str) -> Optional[str]:
        normalized = re.sub(r'[:\(\)]', '', text.lower().strip())
        normalized = ' '.join(normalized.split())
        if normalized in self.alias_map:
            return self.alias_map[normalized]
        for alias, canonical in self.alias_map.items():
            if alias in normalized:
                return canonical
        return None

    def _parse_range(self, range_str: str) -> Tuple[Optional[float], Optional[float]]:
        m = RANGE_RE.search(range_str)
        if m:
            return float(m.group(1)), float(m.group(2))
        return None, None

    def _parse_inline(self, text: str) -> Dict:
        found = {}
        for line in text.split('\n'):
            m = INLINE_RE.match(line.strip())
            if not m:
                continue
            test_text, value_str, unit_str, range_str = m.group(1), m.group(2), m.group(3), m.group(4)
            canonical = self._match_biomarker(test_text)
            if canonical and canonical not in found:
                ref_low, ref_high = self._parse_range(range_str)
                found[canonical] = {
                    "value": float(value_str),
                    "unit": unit_str.strip(),
                    "ref_low": ref_low,
                    "ref_high": ref_high
                }
        return found

    def _parse_multiline(self, text: str, targets: list) -> Dict:
        found = {}
        lines = [l.strip() for l in text.split('\n')]
        for i, line in enumerate(lines):
            if not line:
                continue
            canonical = self._match_biomarker(line)
            if not canonical or canonical in found or canonical not in targets:
                continue
            
            value = unit = None
            ref_low = ref_high = None
            for j in range(i + 1, min(i + 9, len(lines))):
                chunk = lines[j].strip()
                if not chunk:
                    continue
                if chunk.lower().startswith('method') or chunk.lower().startswith('automated'):
                    continue
                if value is None and NUMERIC_RE.match(chunk):
                    value = float(chunk)
                    continue
                if RANGE_RE.search(chunk) and ref_low is None:
                    ref_low, ref_high = self._parse_range(chunk)
                    continue
                if unit is None and value is not None and re.match(r'^[a-zA-Z%/µ\.]+\s*/?[a-zA-Z]*$', chunk):
                    unit = chunk
            
            if value is not None:
                found[canonical] = {
                    "value": value,
                    "unit": unit or "",
                    "ref_low": ref_low,
                    "ref_high": ref_high
                }
        return found

# Instantiate for use in routers
pdf_extractor = CBCParser()
