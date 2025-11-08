from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI(title="NL2SQL Service")


class AskRequest(BaseModel):
    prompt: str


class AskResponse(BaseModel):
    query: str
    message: str


@app.get("/")
async def root():
    return {"message": "NL2SQL Service is running"}


@app.post("/ask", response_model=AskResponse)
async def ask(request: AskRequest):
    # TODO: Implement NL2SQL logic here
    return AskResponse(
        query="SELECT * FROM example", message=f"Received prompt: {request.prompt}"
    )
