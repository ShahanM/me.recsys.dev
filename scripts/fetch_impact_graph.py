import requests
import json
import time
import os
import re
from utils import load_mapping, normalize_venue_name, load_config


def fetch_impact_graph():
    config = load_config()
    author_id = config['author']['id']
    output_file = os.path.join(os.path.dirname(__file__), '..', config['paths']['output_impact_graph'])
    
    print(f"Fetching graph for Author ID: {author_id}...")
    
    nodes = {}
    links = []
    
    def add_node(name, group, paper_title=None):
        
        node_type = "journal"
        lower_name = name.lower()
        if "arxiv" in lower_name or "preprint" in lower_name or "corr" in lower_name:
            node_type = "preprint"
        elif any(x in lower_name for x in ["proc", "conference", "symposium", "workshop", "meeting", "acm", "ieee"]):
            node_type = "conference"
        
        if name not in nodes:
            nodes[name] = {
                "id": name, 
                "group": group, 
                "type": node_type, 
                "value": 0,
                "papers": []
            }
        
        nodes[name]["value"] += 1
        
        if paper_title and paper_title not in nodes[name]["papers"]:
             nodes[name]["papers"].append(paper_title)

    url = f"https://api.semanticscholar.org/graph/v1/author/{author_id}/papers"
    offset = 0
    BATCH_SIZE = 100
    
    while True:
        print(f"Fetching offset {offset}...")
        params = {
            "fields": "title,venue,year,citationCount,citations.venue,citations.title,citations.year",
            "limit": BATCH_SIZE,
            "offset": offset
        }
        
        try:
            r = requests.get(url, params=params)
            if r.status_code != 200:
                print(f"Error: {r.status_code} - {r.text}")
                break
                
            data = r.json()
            if 'data' not in data or not data['data']:
                break
            
            for my_paper in data['data']:
                my_venue_raw = my_paper.get('venue') or "Preprint/Other"
                if not my_venue_raw: my_venue_raw = "Preprint/Other"
                
                my_title = my_paper.get('title')
                
                my_venue = normalize_venue_name(my_venue_raw)
                
                add_node(my_venue, "source", my_title)
    
                citations = my_paper.get('citations', [])
                for cite in citations:
                    if not cite.get('venue'): continue 
                    
                    citing_venue_raw = cite['venue']
                    citing_venue = normalize_venue_name(citing_venue_raw)
                    
                    add_node(citing_venue, "target") 
                    
                    links.append({
                        "source": my_venue,
                        "target": citing_venue,
                        "paper": my_title, 
                        "value": 1
                    })

            if len(data['data']) < BATCH_SIZE:
                break
            offset += BATCH_SIZE
            time.sleep(1)

        except Exception as e:
            print(f"Exception: {e}")
            break

    # Format for D3
    graph_data = {
        "nodes": list(nodes.values()),
        "links": links
    }

    os.makedirs(os.path.dirname(output_file), exist_ok=True)
    with open(output_file, 'w') as f:
        json.dump(graph_data, f, indent=2)
    
    print(f"Graph generated: {len(nodes)} Venues, {len(links)} Connections.")

if __name__ == "__main__":
    fetch_impact_graph()