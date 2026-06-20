import re
import fitz
from typing import List, Dict, Optional

BIOMARKER_ALIASES = {
    "WBC": ["tlc: total leucocyte/wbc count", "wbc", "tlc", "total leucocyte count", "white blood cell count"],
    "LYMp": ["lymphocytes %", "lymphocytes"],
    "NEUTp": ["neutrophils %", "neutrophils"],
    "LYMn": ["absolute lymphocyte count (alc)", "alc", "absolute lymphocyte count"],
    "NEUTn": ["anc: absolute neutrophil count", "anc", "absolute neutrophil count"],
    "RBC": ["r.b.c. count", "rbc count", "rbc"],
    "HGB": ["hemoglobin", "hgb", "hb"],
    "HCT": ["p.c.v. (packed cell volume)", "p.c.v.", "pcv", "packed cell volume", "hematocrit", "hct"],
    "MCV": ["mcv:mean corposcular volume", "mcv", "mean corpuscular volume"],
    "MCH": ["mch:mean corpuscular hemoglobin", "mch", "mean corpuscular hemoglobin"],
    "MCHC": ["mchc", "mean corpuscular hemoglobin concentration"],
    "RDW": ["rdw -cv", "rdw", "rdw-cv", "rdw cv", "red cell distribution width"],
    "PLT": ["platelet count", "plt", "platelet"],
    "MPV": ["mpv: mean platelet volume", "mpv", "mean platelet volume"]
}

class MedicalReportExtractor:
    """
    Deterministic extraction of lab markers from medical PDFs.
    SECURITY: No LLM usage - prevents hallucination of medical values.
    SAFETY: Uses hardcoded unit mapping for accuracy.
    """
    
    def __init__(self):
        self.skip_keywords = [
            'TEST PARAMETER', 'REFERENCE RANGE', 'RESULT', 'UNIT', 'SAMPLE TYPE',
            'Page', 'Report Status', 'Collected On', 'Reported On', 'Final',
            'Method:', 'Automated', 'Patient Location', 'Flowcytometry',
            'Lab ID', 'UH ID', 'Registered On', 'Age/Gender', 'Electrical Impedence',
            'LABORATORY TEST REPORT', 'HAEMATOLOGY', 'Ref. By', 'Calculated',
            'Processed By', 'End Of Report', 'EDTA', 'Pathologist', 'whole blood',
            'TERMS & CONDITIONS', 'Dr ', 'KMC-', 'Meda Salomi', 'COMPLETE BLOOD COUNT',
            'Male', 'Female', 'Years', 'Name', 'Mr.', 'Mrs.', 'Ms.', 
            'Differential Leucocyte Count', 'IP/OP No', 'AKSHAYA NEURO'
        ]
        
        # HARDCODED UNIT MAPPING - Based on standard lab report format
        self.unit_map = {
            'hemoglobin': 'gm/dl', 'hb': 'gm/dl', 'hgb': 'gm/dl',
            'r.b.c. count': 'million/cumm', 'rbc count': 'million/cumm', 'rbc': 'million/cumm',
            'red blood cell count': 'million/cumm',
            'p.c.v.': '%', 'pcv': '%', 'packed cell volume': '%', 'hematocrit': '%', 'hct': '%',
            'mcv': 'fL', 'mean corpuscular volume': 'fL',
            'mch': 'pg', 'mean corpuscular hemoglobin': 'pg',
            'mchc': 'gm/dl', 'mean corpuscular hemoglobin concentration': 'gm/dl',
            'rdw': '%', 'rdw-cv': '%', 'rdw cv': '%', 'red cell distribution width': '%',
            'rdw sd': 'fL', 'rdw-sd': 'fL',
            'tlc': 'cells/cumm', 'wbc': 'cells/cumm', 'wbc count': 'cells/cumm',
            'total leucocyte count': 'cells/cumm', 'total leukocyte count': 'cells/cumm',
            'white blood cell count': 'cells/cumm',
            'neutrophils': '%', 'neutrophil': '%', 'lymphocytes': '%', 'lymphocyte': '%',
            'eosinophils': '%', 'eosinophil': '%', 'monocytes': '%', 'monocyte': '%',
            'basophils': '%', 'basophil': '%',
            'anc': '10³/μL', 'absolute neutrophil count': '10³/μL',
            'alc': '10³/μL', 'absolute lymphocyte count': '10³/μL',
            'aec': '10³/μL', 'absolute eosinophil count': '10³/μL',
            'amc': '10³/μL', 'absolute monocyte count': '10³/μL',
            'abc': '10³/μL', 'absolute basophil count': '10³/μL',
            'platelet count': 'Lakhs/cmm', 'platelet': 'Lakhs/cmm', 'plt': 'Lakhs/cmm',
            'mpv': 'fL', 'mean platelet volume': 'fL',
        }
    
    def _parse_multiline_format(self, text: str) -> List[Dict]:
        """Parse multi-line format"""
        results = []
        lines = [line.strip() for line in text.split('\n')]
        i = 0
        
        while i < len(lines):
            line = lines[i]
            
            if not line or self._should_skip_line(line):
                i += 1
                continue
            
            if self._is_potential_test_name(line):
                test_name = line
                result_value = None
                ref_range = None
                
                # Look ahead for value
                for j in range(i + 1, min(i + 7, len(lines))):
                    next_line = lines[j].strip()
                    
                    if not next_line or any(x in next_line for x in ['Method:', 'Automated', 'Calculated']):
                        continue
                        
                    if not ref_range:
                        m = re.search(r'(\d+\.?\d*)\s*[-–]\s*(\d+\.?\d*)', next_line)
                        if m:
                            ref_range = (float(m.group(1)), float(m.group(2)))
                    
                    if self._is_result_value(next_line):
                        result_value = next_line
                        
                        if not ref_range:
                            for k in range(j + 1, min(j + 5, len(lines))):
                                range_line = lines[k].strip()
                                m = re.search(r'(\d+\.?\d*)\s*[-–]\s*(\d+\.?\d*)', range_line)
                                if m:
                                    ref_range = (float(m.group(1)), float(m.group(2)))
                                    break
                                    
                        i = j
                        break
                
                if result_value:
                    # Get unit from hardcoded map
                    unit = self._get_unit_for_test(test_name)
                    
                    results.append({
                        "test": self._clean_test_name(test_name),
                        "result": result_value,
                        "unit": unit,
                        "ref_low": ref_range[0] if ref_range else None,
                        "ref_high": ref_range[1] if ref_range else None
                    })
            
            i += 1
        
        return results
    
    def _get_unit_for_test(self, test_name: str) -> str:
        normalized = test_name.lower().strip()
        normalized = re.sub(r'[:\(\)]', '', normalized)  
        normalized = ' '.join(normalized.split())  
        
        if normalized in self.unit_map:
            return self.unit_map[normalized]
        for key, unit in self.unit_map.items():
            if key in normalized or normalized in key:
                return unit
        return ''
    
    def _should_skip_line(self, line: str) -> bool:
        if any(k.lower() in line.lower() for k in self.skip_keywords):
            return True
        if len(line) <= 1:
            return True
        if all(c in '-:/' for c in line):
            return True
        return False
    
    def _is_potential_test_name(self, line: str) -> bool:
        if len(line) < 3:
            return False
        if not line[0].isupper():
            return False
        letters = [c for c in line if c.isalpha()]
        if not letters:
            return False
        uppercase_ratio = sum(c.isupper() for c in letters) / len(letters)
        return uppercase_ratio >= 0.5
    
    def _is_result_value(self, line: str) -> bool:
        return bool(re.match(r'^[\d\.]+$', line))
    
    def _clean_test_name(self, name: str) -> str:
        return ' '.join(name.split()).rstrip(':').strip()
    
    def _deduplicate_results(self, results: List[Dict]) -> List[Dict]:
        seen = set()
        unique = []
        for r in results:
            key = (r['test'].lower(), r['result'])
            if key not in seen:
                seen.add(key)
                unique.append(r)
        return unique

class CBCParser:
    def __init__(self):
        self.extractor = MedicalReportExtractor()
        
        self.canonical_map = {}
        for canonical, aliases in BIOMARKER_ALIASES.items():
            for alias in aliases:
                self.canonical_map[alias.lower().strip()] = canonical
                
        # Sort by length descending to prevent shorter words (like 'hemoglobin') 
        # from preemptively matching longer words (like 'mean corpuscular hemoglobin')
        self.sorted_aliases = sorted(self.canonical_map.items(), key=lambda x: len(x[0]), reverse=True)

    def _match_biomarker(self, text: str) -> Optional[str]:
        normalized = re.sub(r'[:\(\)]', '', text.lower().strip())
        normalized = ' '.join(normalized.split())
        
        if normalized in self.canonical_map:
            return self.canonical_map[normalized]
            
        for alias, canonical in self.sorted_aliases:
            if alias in normalized:
                return canonical
        return None

    def extract_cbc_from_pdf(self, file_bytes: bytes) -> dict:
        try:
            # We use "pdf" as the stream type identifier for fitz when passing bytes
            doc = fitz.open("pdf", file_bytes)
            all_results = []
            
            for page_num in range(len(doc)):
                text = doc[page_num].get_text()
                all_results.extend(self.extractor._parse_multiline_format(text))
            
            doc.close()
            unique_results = self.extractor._deduplicate_results(all_results)
            
            mapped_data = {}
            for res in unique_results:
                canonical = self._match_biomarker(res['test'])
                if canonical:
                    try:
                        val_float = float(res['result'])
                        mapped_data[canonical] = {
                            "value": val_float,
                            "unit": res['unit'],
                            "ref_low": res.get('ref_low'),
                            "ref_high": res.get('ref_high')
                        }
                    except ValueError:
                        pass
                        
            return {
                "success": True,
                "data": mapped_data
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "data": {}
            }

# Instantiate for use in routers
pdf_extractor = CBCParser()
