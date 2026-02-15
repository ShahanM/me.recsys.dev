import sqlite3
import json
import os
import argparse
from typing import Dict, List, Any
from utils import normalize_venue_name, load_config


def get_venue_type(venue_name: str) -> str:
    lower = venue_name.lower()
    if "arxiv" in lower or "preprint" in lower: return "Preprint"
    if "journal" in lower or "transactions" in lower or "tvcg" in lower: return "Journal"
    if "workshop" in lower: return "Workshop"
    return "Conference" # Most of my publications are at conferences

def fetch_zotero_data(config):
    db_path = config['zotero']['db_path']
    root_collection_name = config['zotero']['root_collection']
    citations_collection_name = config['zotero']['citations_collection']
    my_firstname = config['author']['first_name']
    my_lastname = config['author']['last_name']

    if not os.path.exists(db_path):
        print(f"Error: Database not found at {db_path}")
        return [], {}

    print(f"Connecting to {db_path}...")
    db = sqlite3.connect(f'file:{db_path}?mode=ro', uri=True)
    cursor = db.cursor()

    def get_collection_id(name, parent_id=None):
        query = "SELECT collectionID FROM collections WHERE collectionName = ?"
        params = [name]
        if parent_id:
            query += " AND parentCollectionID = ?"
            params.append(parent_id)
        else:
            query = "SELECT collectionID FROM collections WHERE collectionName = ?" 
            params = [name]

        cursor.execute(query, tuple(params))
        res = cursor.fetchone()
        return res[0] if res else None

    root_id = get_collection_id(root_collection_name)
    if not root_id:
        print(f"Error: Root collection '{root_collection_name}' not found.")
        db.close()
        return [], {}
    cursor.execute("SELECT collectionID, collectionName FROM collections WHERE parentCollectionID = ?", (root_id,))
    paper_collections = cursor.fetchall()
    
    print(f"Found {len(paper_collections)} paper collections.")

    publications = []
    citation_diet_data = {} # venue -> count

    for p_col_id, p_col_name in paper_collections:
        query_paper = """
            SELECT i.itemID
            FROM collectionItems ci
            JOIN items i ON ci.itemID = i.itemID
            JOIN itemCreators ic ON i.itemID = ic.itemID
            JOIN creators c ON ic.creatorID = c.creatorID
            WHERE ci.collectionID = ? 
            AND c.firstName = ? AND c.lastName = ?
            LIMIT 1
        """
        cursor.execute(query_paper, (p_col_id, my_firstname, my_lastname))
        paper_res = cursor.fetchone()
        
        if not paper_res:
            print(f"Warning: No paper with author {my_firstname} {my_lastname} found in '{p_col_name}'. Skipping.")
            continue
            
        paper_id = paper_res[0]
        
        meta = get_item_metadata(cursor, paper_id)
        publications.append(meta)
        
        citations_col_id = get_collection_id(citations_collection_name, parent_id=p_col_id)
        if citations_col_id:
            cursor.execute("""
                SELECT idv.value 
                FROM collectionItems ci
                JOIN items i ON ci.itemID = i.itemID
                JOIN itemData id ON i.itemID = id.itemID
                JOIN fields f ON id.fieldID = f.fieldID
                JOIN itemDataValues idv ON id.valueID = idv.valueID
                WHERE ci.collectionID = ?
                AND (f.fieldName = 'publicationTitle' OR f.fieldName = 'proceedingsTitle')
            """, (citations_col_id,))
            
            cited_venues = cursor.fetchall()
            for row in cited_venues:
                raw_venue = row[0]
                clean = normalize_venue_name(raw_venue)
                if clean not in citation_diet_data:
                    citation_diet_data[clean] = 0
                citation_diet_data[clean] += 1
        else:
            pass

    db.close()
    return publications, citation_diet_data

def get_item_metadata(cursor, item_id):
    cursor.execute("""
        SELECT f.fieldName, idv.value
        FROM itemData id
        JOIN itemDataValues idv ON id.valueID = idv.valueID
        JOIN fields f ON id.fieldID = f.fieldID
        WHERE id.itemID = ?
    """, (item_id,))
    
    data = {}
    for field, value in cursor.fetchall():
        data[field] = value
        
    cursor.execute("""
        SELECT c.firstName, c.lastName
        FROM itemCreators ic
        JOIN creators c ON ic.creatorID = c.creatorID
        WHERE ic.itemID = ?
        ORDER BY ic.orderIndex
    """, (item_id,))
    
    authors = [{'first': f, 'last': l} for f, l in cursor.fetchall()]
    
    date_str = data.get('date', '0000')
    year = date_str.split(' ')[0].split('-')[0]
    
    venue = data.get('publicationTitle') or data.get('proceedingsTitle') or "Preprint/Manuscript"
    venue = normalize_venue_name(venue)

    return {
        "id": item_id,
        "title": data.get('title', 'Untitled'),
        "year": year,
        "venue": venue,
        "url": data.get('url', ''),
        "doi": data.get('DOI', ''),
        "authors": authors
    }

def generate_hierarchical_diet(flat_counts: Dict[str, int]) -> Dict[str, Any]:
    root = {"name": "Citation Diet", "children": []}
    
    types = {} 
    
    for venue, count in flat_counts.items():
        v_type = get_venue_type(venue)
        if v_type not in types:
            types[v_type] = []
        
        types[v_type].append({"name": venue, "value": count})
        
    for t_name, children in types.items():
        children.sort(key=lambda x: x['value'], reverse=True)
        root["children"].append({
            "name": t_name,
            "children": children
        })
        
    return root

def main():
    parser = argparse.ArgumentParser(description="Generate publication data from Zotero.")
    parser.add_argument('--dry-run', action='store_true', help="Do not write files, just print summary")
    
    args = parser.parse_args()
    
    config = load_config()
    output_pubs_file = os.path.join(os.path.dirname(__file__), '..', config['paths']['output_pubs'])
    output_diet_file = os.path.join(os.path.dirname(__file__), '..', config['paths']['output_diet'])

    pubs, diet_counts = fetch_zotero_data(config)
    
    pubs.sort(key=lambda x: x['year'], reverse=True)
    
    diet_hierarchy = generate_hierarchical_diet(diet_counts)
    
    print(f"Processed {len(pubs)} publications.")
    print(f"Processed {sum(diet_counts.values())} citations across {len(diet_counts)} unique venues.")
    
    if args.dry_run:
        print("Dry run complete. Sample Pub:", pubs[0] if pubs else "None")
        print("Sample Diet Node:", diet_hierarchy['children'][0] if diet_hierarchy['children'] else "None")
    else:
        os.makedirs(os.path.dirname(output_pubs_file), exist_ok=True)
        
        with open(output_pubs_file, 'w') as f:
            json.dump(pubs, f, indent=2)
            
        with open(output_diet_file, 'w') as f:
            json.dump(diet_hierarchy, f, indent=2)
            
        print(f"Written to {output_pubs_file} and {output_diet_file}")

if __name__ == '__main__':
    main()