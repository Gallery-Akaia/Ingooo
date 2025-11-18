# Ingoo - E-Commerce Application

## Overview
This is a full-stack e-commerce application with a React frontend and FastAPI Python backend. Ingoo (formerly "Incoo" and "incho") is designed for premium tools for master craftsmen. The application uses PostgreSQL for data storage and features user authentication, product management, and an admin panel.

## Project Structure
- `/frontend` - React application built with Create React App and CRACO
- `/backend` - FastAPI Python server

## Technology Stack

### Frontend
- **Framework**: React 19.0.0 with react-router-dom for routing
- **Build Tool**: CRACO (Create React App Configuration Override)
- **UI Components**: Radix UI primitives with custom styling
- **Styling**: Tailwind CSS
- **HTTP Client**: Axios
- **Form Handling**: React Hook Form with Zod validation
- **State Management**: React Context API (CartContext)

### Backend
- **Framework**: FastAPI 0.110.1
- **Server**: Uvicorn
- **Database**: PostgreSQL with asyncpg (async driver)
- **Authentication**: OAuth integration with Emergent auth service
- **CORS**: Configured for cross-origin requests

## Setup & Configuration

### Environment Variables

**Backend** (`backend/.env`):
```
DATABASE_URL=postgresql://postgres:password@helium/heliumdb
CORS_ORIGINS="*"
```

**Replit Secrets** (required):
- None for development (uses Replit's built-in PostgreSQL database)
- For production deployment: Set `DATABASE_URL` to PostgreSQL connection string

**Frontend** (`frontend/.env`):
```
REACT_APP_BACKEND_URL=http://localhost:8000
WDS_SOCKET_PORT=443
REACT_APP_ENABLE_VISUAL_EDITS=false
ENABLE_HEALTH_CHECK=false
```

### Development Server Configuration

**Frontend**: 
- Runs on port 5000 (configured in `craco.config.js`)
- Host: 0.0.0.0
- Allows all hosts for Replit proxy compatibility

**Backend**:
- Runs on port 8000
- Host: localhost

##Features

### User Features
- Product browsing with search and filtering
- Shopping cart functionality
- User authentication via OAuth
- Product categories

### Admin Features
- Product management (CRUD operations)
- Category management with dropdown selection
- Category duplicate prevention (case-insensitive)
- User role management
- Stock tracking

## Known Issues & Setup Requirements

### Frontend
- Requires `npm install --force` due to peer dependency conflicts between:
  - React 19 and some Radix UI components
  - date-fns v3 and react-day-picker v8
  - ESLint version mismatches

### Backend
- **PostgreSQL Required**: The application requires a PostgreSQL database connection
- Uses Replit's built-in PostgreSQL for development
- First user to register becomes the owner with admin privileges
- Subsequent admin assignments must be done by the owner

## API Structure

### Authentication Endpoints
- `POST /api/auth/session` - Create user session
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout user

### Product Endpoints
- `GET /api/products` - List products (supports filtering/search)
- `POST /api/products` - Create product (admin only)
- `PUT /api/products/{id}` - Update product (admin only)
- `DELETE /api/products/{id}` - Delete product (admin only)

### Category Endpoints
- `GET /api/categories` - List categories
- `POST /api/categories` - Create category (admin only)
- `PUT /api/categories/{id}` - Update category (admin only)
- `DELETE /api/categories/{id}` - Delete category (admin only)

### Admin Endpoints
- `GET /api/admin/users` - List all users (admin only)
- `PUT /api/admin/users/{email}` - Update user admin status (owner only)

## Dependencies

### Python (backend/requirements.txt)
- fastapi, uvicorn - Web framework and server
- asyncpg, psycopg2-binary - PostgreSQL async driver
- python-dotenv - Environment variable management
- httpx - HTTP client for auth service
- pydantic - Data validation

### Node.js (frontend/package.json)
- react, react-dom - Core React libraries
- @craco/craco - Build configuration
- axios - HTTP client
- react-router-dom - Routing
- Various Radix UI components for UI primitives
- tailwindcss - CSS framework

## Recent Changes
- **2025-11-17**: UI Enhancements - Dual-Range Price Filter
  - Enhanced price slider to support dual handles (min and max price selection)
  - Added synchronized input fields below the slider with bidirectional binding
  - Input fields update when slider moves, and slider updates when inputs change
  - Implemented proper NaN guards to prevent errors when inputs are cleared
  - Improved user experience for price filtering with precise control
  
- **2025-11-16**: PostgreSQL Migration (Production-Ready)
  - Migrated entire database from SQLite to PostgreSQL for cloud deployment compatibility
  - Created connection pooling utility (backend/database.py) for efficient database management
  - Updated all 30+ SQL queries from SQLite syntax (? placeholders) to PostgreSQL syntax ($1, $2, etc.)
  - Changed all timestamp columns to TIMESTAMPTZ to prevent timezone-related authentication crashes
  - Updated schema: TEXT→VARCHAR, INTEGER→BOOLEAN, added proper foreign key constraints
  - Application tested and verified working with Replit's PostgreSQL database
  - Created DEPLOYMENT.md with instructions for Render/cloud deployment
  - **Note**: PostgreSQL converts unquoted column names to lowercase (imageUrl became imageurl in schema)
  
- **2025-11-17**: Application rebranding to "Ingoo"
  - Changed application name from "Incoo" to "Ingoo" across all project files
  
- **2025-11-15**: Application branding and category improvements
  - Changed application name from "incho" to "Incoo" across frontend and project files
  - Added duplicate prevention for categories (case-insensitive) in backend
  - Category dropdown already exists for product creation in admin panel
  - Category filtering already functional on home page (click category to filter products)
  
- **2025-11-15**: Initial Replit environment setup
  - Configured CRACO for Replit proxy compatibility (port 5000, allow all hosts)
  - Fixed date-fns version conflict (downgraded from v4 to v3)
  - Removed non-existent `emergentintegrations` package from requirements.txt
  - Updated backend environment configuration to use Replit secrets

## User Preferences
None recorded yet.
