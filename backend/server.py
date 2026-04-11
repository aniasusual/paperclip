from fastapi import FastAPI, APIRouter, HTTPException, Query
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI()
api_router = APIRouter(prefix="/api")

# ---------- Models ----------

class IdeaCreate(BaseModel):
    title: str
    content: str = ""
    category: str = ""
    tags: List[str] = []
    priority: str = "low"  # low, medium, high

class IdeaUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    category: Optional[str] = None
    tags: Optional[List[str]] = None
    priority: Optional[str] = None

class IdeaResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    title: str
    content: str
    category: str
    tags: List[str]
    priority: str
    archived: bool
    created_at: str
    updated_at: str

class CategoryCreate(BaseModel):
    name: str
    color: str = "#706F6C"

class CategoryResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    name: str
    color: str

# ---------- Seed default categories ----------

DEFAULT_CATEGORIES = [
    {"id": str(uuid.uuid4()), "name": "Product", "color": "#C7362E"},
    {"id": str(uuid.uuid4()), "name": "Design", "color": "#8B5CF6"},
    {"id": str(uuid.uuid4()), "name": "Marketing", "color": "#B26E12"},
    {"id": str(uuid.uuid4()), "name": "Tech", "color": "#2A72A5"},
    {"id": str(uuid.uuid4()), "name": "Personal", "color": "#059669"},
]

@app.on_event("startup")
async def seed_categories():
    count = await db.categories.count_documents({})
    if count == 0:
        await db.categories.insert_many(DEFAULT_CATEGORIES)
        logging.info("Seeded default categories")

# ---------- Ideas CRUD ----------

@api_router.get("/")
async def root():
    return {"message": "Idea Logger API"}

@api_router.post("/ideas", response_model=IdeaResponse)
async def create_idea(idea: IdeaCreate):
    now = datetime.now(timezone.utc).isoformat()
    doc = {
        "id": str(uuid.uuid4()),
        "title": idea.title,
        "content": idea.content,
        "category": idea.category,
        "tags": idea.tags,
        "priority": idea.priority,
        "archived": False,
        "created_at": now,
        "updated_at": now,
    }
    await db.ideas.insert_one(doc)
    doc.pop("_id", None)
    return doc

@api_router.get("/ideas", response_model=List[IdeaResponse])
async def get_ideas(
    search: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    tag: Optional[str] = Query(None),
    priority: Optional[str] = Query(None),
    archived: bool = Query(False),
):
    query = {"archived": archived}
    if search:
        query["$or"] = [
            {"title": {"$regex": search, "$options": "i"}},
            {"content": {"$regex": search, "$options": "i"}},
            {"tags": {"$regex": search, "$options": "i"}},
        ]
    if category:
        query["category"] = category
    if tag:
        query["tags"] = tag
    if priority:
        query["priority"] = priority

    ideas = await db.ideas.find(query, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return ideas

@api_router.get("/ideas/{idea_id}", response_model=IdeaResponse)
async def get_idea(idea_id: str):
    idea = await db.ideas.find_one({"id": idea_id}, {"_id": 0})
    if not idea:
        raise HTTPException(status_code=404, detail="Idea not found")
    return idea

@api_router.put("/ideas/{idea_id}", response_model=IdeaResponse)
async def update_idea(idea_id: str, update: IdeaUpdate):
    update_data = {k: v for k, v in update.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    result = await db.ideas.update_one({"id": idea_id}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Idea not found")
    idea = await db.ideas.find_one({"id": idea_id}, {"_id": 0})
    return idea

@api_router.delete("/ideas/{idea_id}")
async def delete_idea(idea_id: str):
    result = await db.ideas.delete_one({"id": idea_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Idea not found")
    return {"message": "Idea deleted"}

@api_router.patch("/ideas/{idea_id}/archive")
async def toggle_archive(idea_id: str):
    idea = await db.ideas.find_one({"id": idea_id}, {"_id": 0})
    if not idea:
        raise HTTPException(status_code=404, detail="Idea not found")
    new_status = not idea["archived"]
    await db.ideas.update_one(
        {"id": idea_id},
        {"$set": {"archived": new_status, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    updated = await db.ideas.find_one({"id": idea_id}, {"_id": 0})
    return updated

# ---------- Categories CRUD ----------

@api_router.get("/categories", response_model=List[CategoryResponse])
async def get_categories():
    cats = await db.categories.find({}, {"_id": 0}).to_list(100)
    return cats

@api_router.post("/categories", response_model=CategoryResponse)
async def create_category(cat: CategoryCreate):
    doc = {
        "id": str(uuid.uuid4()),
        "name": cat.name,
        "color": cat.color,
    }
    await db.categories.insert_one(doc)
    doc.pop("_id", None)
    return doc

@api_router.delete("/categories/{cat_id}")
async def delete_category(cat_id: str):
    result = await db.categories.delete_one({"id": cat_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Category not found")
    return {"message": "Category deleted"}

# ---------- Tags ----------

@api_router.get("/tags")
async def get_all_tags():
    pipeline = [
        {"$match": {"archived": False}},
        {"$unwind": "$tags"},
        {"$group": {"_id": "$tags", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
    ]
    results = await db.ideas.aggregate(pipeline).to_list(200)
    return [{"name": r["_id"], "count": r["count"]} for r in results]

# ---------- Stats ----------

@api_router.get("/stats")
async def get_stats():
    total = await db.ideas.count_documents({"archived": False})
    archived = await db.ideas.count_documents({"archived": True})
    high = await db.ideas.count_documents({"archived": False, "priority": "high"})
    medium = await db.ideas.count_documents({"archived": False, "priority": "medium"})
    low = await db.ideas.count_documents({"archived": False, "priority": "low"})
    return {
        "total_active": total,
        "total_archived": archived,
        "high_priority": high,
        "medium_priority": medium,
        "low_priority": low,
    }

# ---------- Setup ----------

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
