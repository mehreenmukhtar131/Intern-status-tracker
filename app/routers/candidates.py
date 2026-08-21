from fastapi import APIRouter

router = APIRouter(
    prefix="/api/candidates",
    tags=["Candidates"]
)