import json
import re
import toml
import os

CONFIG_FILE = os.path.join(os.path.dirname(__file__), '../config.toml')

def load_config():
    """Load configuration from config.toml."""
    if not os.path.exists(CONFIG_FILE):
        raise FileNotFoundError(
            f"Config file not found at {CONFIG_FILE}. "
            f"Please copy config.example.toml to config.toml and configure."
        )
    return toml.load(CONFIG_FILE)

def load_mapping() -> dict[str, str]:
    config = load_config()
    venue_map_path = os.path.join(os.path.dirname(__file__), '..', config['paths']['venue_map'])
    
    try:
        with open(venue_map_path, 'r') as f:
            venue_map = json.loads(f.read())
        return venue_map
    except FileNotFoundError:
        return {}


VENUE_MAP = load_mapping()

def normalize_venue_name(raw_name: str) -> str:
    """
    Consolidated logic to normalize venue names.
    Combines cleaning, mapping lookup, and heuristics.
    Uses the internal VENUE_MAP loaded from src/data/venue_map.json.
    """
    if not raw_name: return "Unknown Venue"
    
    name = raw_name.strip().replace("\n", " ").replace("  ", " ")
    
    # Check Mapper (Pre-cleaning)
    if name in VENUE_MAP:
        return VENUE_MAP[name]

    # Prefix Extraction (ACM, IEEE, AAAI)
    prefix = ""
    if "ACM" in name: prefix = "ACM "
    elif "IEEE" in name: prefix = "IEEE "
    elif "AAAI" in name: prefix = "AAAI "
    
    clean = name
    
    # Remove common preambles
    clean = re.sub(r'Proceedings of (the )?', '', clean, flags=re.IGNORECASE)
    clean = re.sub(r'International Conference on', '', clean, flags=re.IGNORECASE)
    clean = re.sub(r'\bConference on\b', '', clean, flags=re.IGNORECASE)
    clean = re.sub(r'\bSymposium on\b', '', clean, flags=re.IGNORECASE)
    clean = re.sub(r'\bAnnual Meeting (of the)?\b', '', clean, flags=re.IGNORECASE)
    clean = re.sub(r'\bWorkshop on\b', 'Workshop:', clean, flags=re.IGNORECASE)

    # Remove Year (e.g., 2024, '24)
    clean = re.sub(r'[\(\s]*\b((19|20)\d{2})\b[\)\s]*', '', clean)
    clean = re.sub(r"'\d{2}\b", '', clean)
    
    # Remove Ordinals (1st, 2nd...)
    clean = re.sub(r'\b\d{1,2}(st|nd|rd|th)\b', '', clean, flags=re.IGNORECASE)
    
    # Remove the Prefix from the body if it exists (deduplication)
    clean = re.sub(r'\bACM\b', '', clean, flags=re.IGNORECASE)
    clean = re.sub(r'\bIEEE\b', '', clean, flags=re.IGNORECASE)
    clean = re.sub(r'\bAAAI\b', '', clean, flags=re.IGNORECASE)
    
    # Remove garbage chars
    clean = clean.replace("&", "").replace("  ", " ").strip(" -:,")
    
    # Check Mapper (Post-cleaning)
    if clean in VENUE_MAP:
        return VENUE_MAP[clean]

    # Heuristics
    lower = clean.lower()
    
    # ArXiv / Preprint
    if "arxiv" in lower or "corr" in lower: return "arXiv"
    
    # ACM Venues
    if "recsys" in lower: return "ACM RecSys"
    if "chi" in lower and ("human factors" in lower or clean.lower() == "chi"): return "ACM CHI"
    if "human-computer interaction" in lower: return "ACM TOCHI" # or generic HCI
    if "iui" in lower and "intelligent" in lower: return "ACM IUI"
    if "cscw" in lower: return "ACM CSCW"
    if "user modeling" in lower and "adaptation" in lower: return "ACM UMAP"
    if "transactions on recommender systems" in lower: return "ACM ToRS"
    
    # IEEE Venues
    if "computer vision" in lower and "pattern recognition" in lower: return "IEEE CVPR"
    if "icra" in lower: return "IEEE ICRA"
    if "visualization" in lower and "computer graphics" in lower: return "IEEE TVCG"
    if "access" in lower and "ieee" in lower: return "IEEE Access"
    
    # Fallback: Re-attach prefix
    final = (prefix + clean).strip()
    final = re.sub(r'\s+', ' ', final)
    
    if final in VENUE_MAP:
        return VENUE_MAP[final]
        
    return final