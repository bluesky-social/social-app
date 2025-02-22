from fastapi import FastAPI, APIRouter, Request
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
  app.state.message = r"\m/"
  app.state.version = "0.0.0"
  yield

router = APIRouter()

@router.get("/{full_path:path}")
async def serve_react_app(full_path: str):
  return FileResponse("backend/static/index.html")

app = FastAPI(lifespan=lifespan)
app.mount("/static", StaticFiles(directory="static"), name="static")

@app.get("/")
async def get_root(request: Request):
  app = request.app
  message = app.state.message
  version = app.state.version
  return { {"message": message }, {"version": version } }
