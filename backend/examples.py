from __future__ import annotations

import json
import urllib.request


API_BASE = "http://127.0.0.1:8000"


def post_json(path: str, payload: dict) -> dict:
    request = urllib.request.Request(
        url=f"{API_BASE}{path}",
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(request) as response:
        return json.loads(response.read().decode("utf-8"))


def get_json(path: str) -> dict:
    with urllib.request.urlopen(f"{API_BASE}{path}") as response:
        return json.loads(response.read().decode("utf-8"))


if __name__ == "__main__":
    print("Health:")
    print(json.dumps(get_json("/health"), indent=2))

    print("\nAnalysis request:")
    print(
        json.dumps(
            post_json(
                "/analysis/run",
                {
                    "query": "What are the top customer pain points and feature requests?",
                    "top_k": 5,
                },
            ),
            indent=2,
        )
    )
