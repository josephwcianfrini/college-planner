from __future__ import annotations

import json
import os
from pathlib import Path
from typing import Any

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_PATH = BASE_DIR / "data" / "tasks.json"
PUBLIC_DIR = BASE_DIR / "public"

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


def _read_data() -> list[dict[str, Any]]:
    if not DATA_PATH.exists():
        return []
    with DATA_PATH.open("r", encoding="utf-8") as f:
        return json.load(f)


def _write_data(tasks: list[dict[str, Any]]) -> None:
    DATA_PATH.parent.mkdir(parents=True, exist_ok=True)
    with DATA_PATH.open("w", encoding="utf-8") as f:
        json.dump(tasks, f, indent=2)


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/api/tasks")
def get_tasks() -> list[dict[str, Any]]:
    return _read_data()


@app.post("/api/tasks")
def create_task(payload: dict[str, Any]) -> JSONResponse:
    tasks = _read_data()
    tasks.append(payload)
    _write_data(tasks)
    return JSONResponse(payload, status_code=201)


@app.put("/api/tasks/{task_id}")
def update_task(task_id: str, payload: dict[str, Any]) -> dict[str, Any]:
    tasks = _read_data()
    updated = None
    for idx, task in enumerate(tasks):
        if task.get("id") == task_id:
            tasks[idx] = payload
            updated = payload
            break
    if updated is None:
        tasks.append(payload)
        updated = payload
    _write_data(tasks)
    return updated


@app.delete("/api/tasks/{task_id}")
def delete_task(task_id: str) -> dict[str, str]:
    tasks = _read_data()
    tasks = [task for task in tasks if task.get("id") != task_id]
    _write_data(tasks)
    return {"status": "deleted"}


@app.get("/")
def index() -> FileResponse:
    return FileResponse(PUBLIC_DIR / "index.html")


# Serve static assets (JS/CSS) for Vercel if root routing hits the API.
app.mount("/", StaticFiles(directory=PUBLIC_DIR, html=True), name="static")
