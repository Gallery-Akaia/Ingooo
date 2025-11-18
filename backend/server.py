from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, Depends, UploadFile, File
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import re
import httpx
from imagekitio import ImageKit
import base64
from database import get_pool, init_database, close_pool


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# ImageKit configuration (will be initialized if credentials exist)
imagekit: Optional[ImageKit] = None
try:
    if all(key in os.environ for key in ['IMAGEKIT_PRIVATE_KEY', 'IMAGEKIT_PUBLIC_KEY', 'IMAGEKIT_URL_ENDPOINT']):
        imagekit = ImageKit(
            private_key=os.environ['IMAGEKIT_PRIVATE_KEY'],
            public_key=os.environ['IMAGEKIT_PUBLIC_KEY'],
            url_endpoint=os.environ['IMAGEKIT_URL_ENDPOINT']
        )
except Exception as e:
    logging.warning(f"ImageKit initialization failed: {e}")

# Create the main app without a prefix
app = FastAPI()

# Add CORS middleware FIRST (before routes)
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Initialize PostgreSQL database on startup
@app.on_event("startup")
async def startup():
    await init_database()

@app.on_event("shutdown")
async def shutdown():
    await close_pool()


# Define Models
class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: str
    name: str
    picture: str
    is_admin: bool = False
    is_owner: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class UserSession(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    user_id: str
    session_token: str
    expires_at: datetime
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Category(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: Optional[str] = ""
    createdAt: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class CategoryCreate(BaseModel):
    name: str
    description: Optional[str] = ""

class CategoryUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None

class Product(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: str
    price: float
    category: str
    imageUrl: str
    stock: int = 0
    createdAt: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ProductCreate(BaseModel):
    name: str
    description: str
    price: float
    category: str
    imageUrl: str
    stock: int = 0

class ProductUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    category: Optional[str] = None
    imageUrl: Optional[str] = None
    stock: Optional[int] = None

class AdminUpdate(BaseModel):
    email: str
    is_admin: bool


# Auth Helper Functions
async def get_current_user(request: Request) -> Optional[User]:
    # Try cookie first
    session_token = request.cookies.get("session_token")
    
    # Fallback to Authorization header
    if not session_token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            session_token = auth_header.split(" ")[1]
    
    if not session_token:
        return None
    
    pool = await get_pool()
    async with pool.acquire() as conn:
        # Find session
        session_row = await conn.fetchrow(
            "SELECT * FROM user_sessions WHERE session_token = $1",
            session_token
        )
        
        if not session_row:
            return None
        
        # Check expiry
        expires_at = session_row['expires_at']
        if expires_at < datetime.now(timezone.utc):
            await conn.execute(
                "DELETE FROM user_sessions WHERE session_token = $1",
                session_token
            )
            return None
        
        # Get user
        user_row = await conn.fetchrow(
            "SELECT * FROM users WHERE id = $1",
            session_row['user_id']
        )
        
        if not user_row:
            return None
        
        return User(
            id=user_row['id'],
            email=user_row['email'],
            name=user_row['name'],
            picture=user_row['picture'],
            is_admin=user_row['is_admin'],
            is_owner=user_row['is_owner'],
            created_at=user_row['created_at'].isoformat() if hasattr(user_row['created_at'], 'isoformat') else str(user_row['created_at'])
        )

async def require_admin(request: Request) -> User:
    user = await get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    if not user.is_admin and not user.is_owner:
        raise HTTPException(status_code=403, detail="Admin access required")
    return user

async def verify_admin_password(request: Request):
    if request.method == "OPTIONS":
        return True
    admin_password = request.headers.get("X-Admin-Password")
    if admin_password != "8890":
        raise HTTPException(status_code=401, detail="Invalid admin password")
    return True


# Auth Routes
@api_router.post("/auth/session")
async def create_session(request: Request, response: Response):
    session_id = request.headers.get("X-Session-ID")
    if not session_id:
        raise HTTPException(status_code=400, detail="Session ID required")
    
    # Get user data from Emergent auth service
    async with httpx.AsyncClient() as client:
        try:
            auth_response = await client.get(
                "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
                headers={"X-Session-ID": session_id},
                timeout=10.0
            )
            auth_response.raise_for_status()
            user_data = auth_response.json()
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Failed to validate session: {str(e)}")
    
    pool = await get_pool()
    async with pool.acquire() as conn:
        # Check if user exists
        existing_user = await conn.fetchrow(
            "SELECT * FROM users WHERE email = $1",
            user_data["email"]
        )
        
        if existing_user:
            user = User(
                id=existing_user['id'],
                email=existing_user['email'],
                name=existing_user['name'],
                picture=existing_user['picture'],
                is_admin=existing_user['is_admin'],
                is_owner=existing_user['is_owner'],
                created_at=existing_user['created_at'].isoformat() if hasattr(existing_user['created_at'], 'isoformat') else str(existing_user['created_at'])
            )
        else:
            # Check if this is the first user (becomes owner)
            user_count = await conn.fetchval("SELECT COUNT(*) FROM users")
            
            is_owner = user_count == 0
            
            user = User(
                email=user_data["email"],
                name=user_data["name"],
                picture=user_data["picture"],
                is_admin=is_owner,
                is_owner=is_owner
            )
            
            await conn.execute(
                "INSERT INTO users (id, email, name, picture, is_admin, is_owner, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7)",
                user.id, user.email, user.name, user.picture, user.is_admin, user.is_owner, user.created_at
            )
        
        # Create session
        session_token = user_data["session_token"]
        expires_at = datetime.now(timezone.utc) + timedelta(days=7)
        
        session = UserSession(
            user_id=user.id,
            session_token=session_token,
            expires_at=expires_at.isoformat()
        )
        
        # Delete old sessions for this user
        await conn.execute(
            "DELETE FROM user_sessions WHERE user_id = $1",
            user.id
        )
        
        await conn.execute(
            "INSERT INTO user_sessions (session_token, user_id, expires_at, created_at) VALUES ($1, $2, $3, $4)",
            session.session_token, session.user_id, session.expires_at, session.created_at
        )
    
    # Set cookie
    response.set_cookie(
        key="session_token",
        value=session_token,
        httponly=True,
        secure=True,
        samesite="none",
        max_age=7 * 24 * 60 * 60,
        path="/"
    )
    
    return user

@api_router.get("/auth/me")
async def get_me(request: Request):
    user = await get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return user

@api_router.post("/auth/logout")
async def logout(request: Request, response: Response):
    session_token = request.cookies.get("session_token")
    if session_token:
        pool = await get_pool()
        async with pool.acquire() as conn:
            await conn.execute(
                "DELETE FROM user_sessions WHERE session_token = $1",
                session_token
            )
    
    response.delete_cookie(key="session_token", path="/")
    return {"message": "Logged out successfully"}


# Admin Management Routes
@api_router.get("/admin/users", response_model=List[User])
async def get_all_users(request: Request, current_user: User = Depends(require_admin)):
    pool = await get_pool()
    async with pool.acquire() as conn:
        rows = await conn.fetch("SELECT * FROM users")
        
        return [
            User(
                id=row['id'],
                email=row['email'],
                name=row['name'],
                picture=row['picture'],
                is_admin=row['is_admin'],
                is_owner=row['is_owner'],
                created_at=row['created_at'].isoformat() if hasattr(row['created_at'], 'isoformat') else str(row['created_at'])
            )
            for row in rows
        ]

@api_router.put("/admin/users/{user_email}")
async def update_user_admin_status(
    user_email: str,
    admin_update: AdminUpdate,
    request: Request,
    current_user: User = Depends(require_admin)
):
    # Only owner can modify admin status
    if not current_user.is_owner:
        raise HTTPException(status_code=403, detail="Only owner can modify admin access")
    
    pool = await get_pool()
    async with pool.acquire() as conn:
        # Check target user
        target_user = await conn.fetchrow(
            "SELECT * FROM users WHERE email = $1",
            user_email
        )
        
        if not target_user:
            raise HTTPException(status_code=404, detail="User not found")
        
        if target_user['is_owner']:
            raise HTTPException(status_code=400, detail="Cannot modify owner's admin status")
        
        await conn.execute(
            "UPDATE users SET is_admin = $1 WHERE email = $2",
            admin_update.is_admin, user_email
        )
    
    return {"message": "User admin status updated"}


# Category Routes (Password Protected)
@api_router.post("/categories", response_model=Category)
async def create_category(category: CategoryCreate, verified: bool = Depends(verify_admin_password)):
    category_obj = Category(**category.model_dump())
    
    pool = await get_pool()
    async with pool.acquire() as conn:
        # Check for duplicate category name (case-insensitive)
        existing = await conn.fetchrow(
            "SELECT * FROM categories WHERE LOWER(name) = LOWER($1)",
            category_obj.name
        )
        
        if existing:
            raise HTTPException(status_code=400, detail="A category with this name already exists")
        
        await conn.execute(
            "INSERT INTO categories (id, name, description, created_at) VALUES ($1, $2, $3, $4)",
            category_obj.id, category_obj.name, category_obj.description or "", category_obj.createdAt
        )
    
    return category_obj

@api_router.get("/categories", response_model=List[Category])
async def get_categories():
    pool = await get_pool()
    async with pool.acquire() as conn:
        rows = await conn.fetch("SELECT * FROM categories ORDER BY created_at DESC")
        
        return [
            Category(
                id=row['id'],
                name=row['name'],
                description=row['description'] or "",
                createdAt=row['created_at']
            )
            for row in rows
        ]

@api_router.get("/categories/{category_id}", response_model=Category)
async def get_category(category_id: str):
    pool = await get_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            "SELECT * FROM categories WHERE id = $1",
            category_id
        )
    
    if not row:
        raise HTTPException(status_code=404, detail="Category not found")
    
    return Category(
        id=row['id'],
        name=row['name'],
        description=row['description'] or "",
        createdAt=row['created_at']
    )

@api_router.put("/categories/{category_id}", response_model=Category)
async def update_category(category_id: str, category_update: CategoryUpdate, verified: bool = Depends(verify_admin_password)):
    update_data = {k: v for k, v in category_update.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")
    
    pool = await get_pool()
    async with pool.acquire() as conn:
        # Check if category exists
        existing = await conn.fetchrow(
            "SELECT * FROM categories WHERE id = $1",
            category_id
        )
        
        if not existing:
            raise HTTPException(status_code=404, detail="Category not found")
        
        # Check for duplicate category name (case-insensitive) if name is being updated
        if 'name' in update_data:
            if existing['name'].lower() != update_data['name'].lower():
                duplicate = await conn.fetchrow(
                    "SELECT * FROM categories WHERE LOWER(name) = LOWER($1) AND id != $2",
                    update_data['name'], category_id
                )
                
                if duplicate:
                    raise HTTPException(status_code=400, detail="A category with this name already exists")
        
        # Build update query
        set_clauses = []
        params = []
        param_num = 1
        
        if 'name' in update_data:
            set_clauses.append(f"name = ${param_num}")
            params.append(update_data['name'])
            param_num += 1
        
        if 'description' in update_data:
            set_clauses.append(f"description = ${param_num}")
            params.append(update_data['description'])
            param_num += 1
        
        params.append(category_id)
        query = f"UPDATE categories SET {', '.join(set_clauses)} WHERE id = ${param_num}"
        await conn.execute(query, *params)
        
        # Fetch updated category
        row = await conn.fetchrow(
            "SELECT * FROM categories WHERE id = $1",
            category_id
        )
    
    return Category(
        id=row['id'],
        name=row['name'],
        description=row['description'] or "",
        createdAt=row['created_at']
    )

@api_router.delete("/categories/{category_id}")
async def delete_category(category_id: str, verified: bool = Depends(verify_admin_password)):
    pool = await get_pool()
    async with pool.acquire() as conn:
        result = await conn.execute(
            "DELETE FROM categories WHERE id = $1",
            category_id
        )
        
        if result == "DELETE 0":
            raise HTTPException(status_code=404, detail="Category not found")
    
    return {"message": "Category deleted successfully"}


# ImageKit Upload Routes (Admin Protected)
@api_router.post("/upload/image")
async def upload_image(
    file: UploadFile = File(...),
    current_user: User = Depends(require_admin)
):
    if not imagekit:
        raise HTTPException(status_code=503, detail="ImageKit not configured. Please add IMAGEKIT credentials.")
    
    try:
        # Read file content
        file_content = await file.read()
        
        # Upload to ImageKit
        upload_result = imagekit.upload_file(
            file=file_content,
            file_name=file.filename,
            options={
                "folder": "/products",
                "use_unique_file_name": True,
            }  # type: ignore
        )
        
        return {
            "url": upload_result.url,
            "fileId": upload_result.file_id,
            "name": upload_result.name
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to upload image: {str(e)}")

@api_router.get("/imagekit/config")
async def get_imagekit_config():
    if not imagekit:
        raise HTTPException(status_code=503, detail="ImageKit not configured")
    
    return {
        "publicKey": os.environ.get('IMAGEKIT_PUBLIC_KEY'),
        "urlEndpoint": os.environ.get('IMAGEKIT_URL_ENDPOINT')
    }


# Product Routes (Admin Protected for CUD operations)
@api_router.post("/products", response_model=Product)
async def create_product(product: ProductCreate, verified: bool = Depends(verify_admin_password)):
    product_obj = Product(**product.model_dump())
    
    pool = await get_pool()
    async with pool.acquire() as conn:
        await conn.execute(
            "INSERT INTO products (id, name, description, price, category, imageurl, stock, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)",
            product_obj.id, product_obj.name, product_obj.description, product_obj.price, 
            product_obj.category, product_obj.imageUrl, product_obj.stock, product_obj.createdAt
        )
    
    return product_obj

@api_router.get("/products", response_model=List[Product])
async def get_products(
    search: Optional[str] = None,
    category: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    stock_status: Optional[str] = None,
    sort_by: Optional[str] = None
):
    query = "SELECT * FROM products WHERE 1=1"
    params = []
    param_num = 1
    
    # Fuzzy search across name, description, and category
    if search:
        search_pattern = f"%{search}%"
        query += f" AND (name ILIKE ${param_num} OR description ILIKE ${param_num+1} OR category ILIKE ${param_num+2})"
        params.extend([search_pattern, search_pattern, search_pattern])
        param_num += 3
    
    # Category filter
    if category:
        query += f" AND category = ${param_num}"
        params.append(category)
        param_num += 1
    
    # Price range filter
    if min_price is not None:
        query += f" AND price >= ${param_num}"
        params.append(min_price)
        param_num += 1
    if max_price is not None:
        query += f" AND price <= ${param_num}"
        params.append(max_price)
        param_num += 1
    
    # Stock status filter
    if stock_status:
        if stock_status == "in_stock":
            query += " AND stock >= 10"
        elif stock_status == "low_stock":
            query += " AND stock > 0 AND stock < 10"
        elif stock_status == "out_of_stock":
            query += " AND stock = 0"
    
    # Sorting
    if sort_by == "price_asc":
        query += " ORDER BY price ASC"
    elif sort_by == "price_desc":
        query += " ORDER BY price DESC"
    elif sort_by == "newest":
        query += " ORDER BY created_at DESC"
    else:
        query += " ORDER BY created_at DESC"
    
    pool = await get_pool()
    async with pool.acquire() as conn:
        rows = await conn.fetch(query, *params)
        
        return [
            Product(
                id=row['id'],
                name=row['name'],
                description=row['description'],
                price=float(row['price']),
                category=row['category'],
                imageUrl=row['imageurl'],
                stock=row['stock'],
                createdAt=row['created_at']
            )
            for row in rows
        ]

@api_router.get("/products/{product_id}", response_model=Product)
async def get_product(product_id: str):
    pool = await get_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            "SELECT * FROM products WHERE id = $1",
            product_id
        )
    
    if not row:
        raise HTTPException(status_code=404, detail="Product not found")
    
    return Product(
        id=row['id'],
        name=row['name'],
        description=row['description'],
        price=float(row['price']),
        category=row['category'],
        imageUrl=row['imageurl'],
        stock=row['stock'],
        createdAt=row['created_at'].isoformat() if hasattr(row['created_at'], 'isoformat') else str(row['created_at'])
    )

@api_router.put("/products/{product_id}", response_model=Product)
async def update_product(product_id: str, product_update: ProductUpdate, verified: bool = Depends(verify_admin_password)):
    update_data = {k: v for k, v in product_update.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")
    
    pool = await get_pool()
    async with pool.acquire() as conn:
        # Check if product exists
        existing = await conn.fetchrow(
            "SELECT * FROM products WHERE id = $1",
            product_id
        )
        
        if not existing:
            raise HTTPException(status_code=404, detail="Product not found")
        
        # Build update query
        set_clauses = []
        params = []
        param_num = 1
        
        for key, value in update_data.items():
            set_clauses.append(f"{key} = ${param_num}")
            params.append(value)
            param_num += 1
        
        params.append(product_id)
        query = f"UPDATE products SET {', '.join(set_clauses)} WHERE id = ${param_num}"
        await conn.execute(query, *params)
        
        # Fetch updated product
        row = await conn.fetchrow(
            "SELECT * FROM products WHERE id = $1",
            product_id
        )
    
    return Product(
        id=row['id'],
        name=row['name'],
        description=row['description'],
        price=float(row['price']),
        category=row['category'],
        imageUrl=row['imageurl'],
        stock=row['stock'],
        createdAt=row['created_at'].isoformat() if hasattr(row['created_at'], 'isoformat') else str(row['created_at'])
    )

@api_router.delete("/products/{product_id}")
async def delete_product(product_id: str, verified: bool = Depends(verify_admin_password)):
    pool = await get_pool()
    async with pool.acquire() as conn:
        result = await conn.execute(
            "DELETE FROM products WHERE id = $1",
            product_id
        )
        
        if result == "DELETE 0":
            raise HTTPException(status_code=404, detail="Product not found")
    
    return {"message": "Product deleted successfully"}


# Include the router in the main app
app.include_router(api_router)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)
