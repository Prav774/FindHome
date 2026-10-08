from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes import cases, demo, matches, persons

app = FastAPI(
    title="FindHome API",
    version="0.1.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(cases.router, prefix="/api")
app.include_router(persons.router, prefix="/api")
app.include_router(matches.router, prefix="/api")
app.include_router(demo.router, prefix="/api")


@app.get("/")
def root():
    return {"message": "FindHome API is running"}


@app.get("/health")
def health():
    return {
        "status": "ok",
        "service": "findhome-api"
    }