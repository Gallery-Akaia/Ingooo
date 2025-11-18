# Deployment Guide for PostgreSQL Backend

This backend application now uses PostgreSQL instead of SQLite, making it ready for deployment on platforms like Render, Railway, Fly.io, etc.

## Local Development Setup

1. **Install PostgreSQL** locally or use a PostgreSQL service

2. **Create a database**:
   ```bash
   createdb ecommerce_db
   ```

3. **Set up environment variables** (copy from .env.example):
   ```bash
   cp .env.example .env
   ```

4. **Update DATABASE_URL** in `.env`:
   ```
   DATABASE_URL="postgresql://username:password@localhost:5432/ecommerce_db"
   ```

5. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

6. **Run the server**:
   ```bash
   uvicorn server:app --host 0.0.0.0 --port 8000 --reload
   ```

## Deploying to Render

### Backend Setup:

1. **Create a Web Service** on Render
2. **Connect your GitHub repository**
3. **Configure Build Settings**:
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `uvicorn server:app --host 0.0.0.0 --port $PORT`

4. **Create a PostgreSQL Database** on Render:
   - Go to "New" → "PostgreSQL"
   - Choose your plan (Free tier available)
   - Copy the Internal Database URL

5. **Set Environment Variables** in your Web Service:
   ```
   DATABASE_URL=<paste_internal_database_url_from_render>
   CORS_ORIGINS=https://your-frontend-url.onrender.com
   ```

6. **Optional: ImageKit Configuration** (for image uploads):
   ```
   IMAGEKIT_PRIVATE_KEY=your_private_key
   IMAGEKIT_PUBLIC_KEY=your_public_key
   IMAGEKIT_URL_ENDPOINT=your_url_endpoint
   ```

### Frontend Setup:

1. **Create another Web Service** for your frontend
2. **Set Environment Variable**:
   ```
   REACT_APP_BACKEND_URL=https://your-backend-url.onrender.com
   ```

## Database Migration from SQLite

If you have existing data in SQLite (`store.db`), you'll need to migrate it:

1. **Export data from SQLite**:
   ```bash
   sqlite3 store.db .dump > data.sql
   ```

2. **Convert to PostgreSQL format** (adjust syntax as needed)
3. **Import to PostgreSQL**:
   ```bash
   psql DATABASE_URL < converted_data.sql
   ```

## Key Changes from SQLite to PostgreSQL

- **Parameter placeholders**: Changed from `?` to `$1, $2, $3`
- **Boolean type**: Changed from INTEGER (0/1) to native BOOLEAN
- **Timestamps**: Using PostgreSQL TIMESTAMP instead of TEXT
- **Case sensitivity**: Column names are lowercase (e.g., `imageurl` not `imageUrl`)
- **Connection pooling**: Using asyncpg connection pool for better performance

## Environment Variables Reference

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `DATABASE_URL` | Yes | PostgreSQL connection string | `postgresql://user:pass@host:5432/db` |
| `CORS_ORIGINS` | Yes | Allowed frontend URLs (comma-separated) | `https://myapp.com,http://localhost:5000` |
| `IMAGEKIT_PRIVATE_KEY` | No | ImageKit private key for uploads | |
| `IMAGEKIT_PUBLIC_KEY` | No | ImageKit public key | |
| `IMAGEKIT_URL_ENDPOINT` | No | ImageKit URL endpoint | |

## Troubleshooting

### Database Connection Issues
- Verify DATABASE_URL format is correct
- Ensure database exists and is accessible
- Check firewall rules if using remote database

### CORS Errors
- Add your frontend URL to CORS_ORIGINS
- Use comma to separate multiple origins
- Include protocol (https:// or http://)

### Migration Issues
- Tables are created automatically on first startup
- Check logs for database errors: `docker logs <container>`
- Verify PostgreSQL version (>=12 recommended)
