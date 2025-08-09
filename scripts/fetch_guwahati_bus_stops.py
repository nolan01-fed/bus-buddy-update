import json
import sys
import time
from typing import Dict, Any, List, Tuple, Set
import requests
from pathlib import Path

OVERPASS_URL = "https://overpass-api.de/api/interpreter"

QUERY = r"""
[out:json][timeout:180];
area["name"="Guwahati"]["boundary"="administrative"]->.a;
(
  node(area.a)["amenity"="bus_station"];
  way(area.a)["amenity"="bus_station"];
  node(area.a)["highway"="bus_stop"];
  node(area.a)["public_transport"="platform"]["bus"="yes"];
  node(area.a)["public_transport"="stop_position"]["bus"="yes"];
);
out body center tags;
// Collect bus routes to infer route membership importance
rel(area.a)["type"="route"]["route"="bus"]->.routes;
node(r.routes)->.route_nodes;
out ids;
"""

OUTPUT_DIR = Path("/workspace/data")
RAW_JSON_PATH = OUTPUT_DIR / "guwahati_bus_stops_raw.json"
GEOJSON_PATH = OUTPUT_DIR / "guwahati_bus_stops.geojson"


def fetch_overpass(query: str) -> Dict[str, Any]:
    resp = requests.post(OVERPASS_URL, data={"data": query}, timeout=300)
    resp.raise_for_status()
    return resp.json()


def element_center(elem: Dict[str, Any]) -> Tuple[float, float]:
    if elem.get("type") == "node":
        return float(elem["lat"]), float(elem["lon"])
    # ways may have "center" when using out center
    center = elem.get("center")
    if center and "lat" in center and "lon" in center:
        return float(center["lat"]), float(center["lon"])
    # fallback: no geometry
    return None, None


def classify(elem: Dict[str, Any]) -> str:
    tags = elem.get("tags", {})
    if tags.get("amenity") == "bus_station":
        return "bus_station"
    if tags.get("highway") == "bus_stop":
        return "bus_stop"
    if tags.get("public_transport") == "platform":
        return "platform"
    if tags.get("public_transport") == "stop_position":
        return "stop_position"
    return "other"


def compute_importance(elem: Dict[str, Any], route_member_node_ids: Set[int]) -> int:
    score = 0
    kind = classify(elem)
    tags = elem.get("tags", {})

    if kind == "bus_station":
        score += 5
    if kind == "bus_stop":
        score += 2
    if kind in {"platform", "stop_position"}:
        score += 1

    if tags.get("shelter") == "yes":
        score += 1
    if "name" in tags:
        score += 1

    # boost if part of any bus route (nodes only)
    if elem.get("type") == "node" and elem.get("id") in route_member_node_ids:
        score += 2

    return score


def build_geojson(elements: List[Dict[str, Any]], route_member_node_ids: Set[int]) -> Dict[str, Any]:
    seen: Set[Tuple[str, int]] = set()
    features: List[Dict[str, Any]] = []

    for e in elements:
        key = (e.get("type"), e.get("id"))
        if key in seen:
            continue
        seen.add(key)

        lat, lon = element_center(e)
        if lat is None or lon is None:
            continue

        tags = e.get("tags", {})
        feature = {
            "type": "Feature",
            "geometry": {"type": "Point", "coordinates": [lon, lat]},
            "properties": {
                "osm_type": e.get("type"),
                "osm_id": e.get("id"),
                "name": tags.get("name"),
                "category": classify(e),
                "importance_score": compute_importance(e, route_member_node_ids),
                "tags": tags,
            },
        }
        features.append(feature)

    # sort by importance desc, then name
    features.sort(key=lambda f: (-(f["properties"]["importance_score"]), (f["properties"].get("name") or "")))

    return {"type": "FeatureCollection", "features": features}


def main() -> None:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    print("Querying Overpass for Guwahati bus stops and routes...", flush=True)
    data = fetch_overpass(QUERY)

    elements = data.get("elements", [])

    # Separate route member nodes list from elements; we included a second 'out ids;' which appends IDs of route nodes at the end.
    # We will treat any node that appears without tags/lat/lon as route member id only.
    route_member_node_ids: Set[int] = set()
    filtered_elements: List[Dict[str, Any]] = []

    for el in elements:
        if el.get("type") == "node" and "tags" not in el and "lat" not in el:
            # This is likely from node(r.routes) with only id
            if "id" in el:
                route_member_node_ids.add(int(el["id"]))
        else:
            # keep full elements
            filtered_elements.append(el)

    # Persist raw
    with RAW_JSON_PATH.open("w", encoding="utf-8") as f:
        json.dump({"elements": filtered_elements, "route_member_node_ids": sorted(route_member_node_ids)}, f)
    print(f"Wrote raw data to {RAW_JSON_PATH}")

    # Build GeoJSON
    geojson = build_geojson(filtered_elements, route_member_node_ids)

    with GEOJSON_PATH.open("w", encoding="utf-8") as f:
        json.dump(geojson, f)
    print(f"Wrote GeoJSON to {GEOJSON_PATH}")

    # Also write a filtered top-important subset file for convenience
    top_features = [ft for ft in geojson["features"] if ft["properties"]["importance_score"] >= 4]
    top_path = OUTPUT_DIR / "guwahati_bus_stops_top.geojson"
    with top_path.open("w", encoding="utf-8") as f:
        json.dump({"type": "FeatureCollection", "features": top_features}, f)
    print(f"Wrote top important stops GeoJSON to {top_path} (count={len(top_features)})")


if __name__ == "__main__":
    try:
        main()
    except requests.HTTPError as e:
        print(f"HTTP error from Overpass: {e}", file=sys.stderr)
        sys.exit(2)
    except Exception as e:
        print(f"Unexpected error: {e}", file=sys.stderr)
        sys.exit(1)