"""
Database migration script: Add game_mode and team_config columns
Run this script to update the database schema.
"""
import asyncio
import asyncpg
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+asyncpg://root:root@localhost:5432/battlenet")
# Convert SQLAlchemy URL format to asyncpg format
DATABASE_URL = DATABASE_URL.replace("postgresql+asyncpg://", "postgresql://")

async def run_migration():
    """Run the migration to add game_mode and team_config columns"""
    
    print("Connecting to database...")
    conn = await asyncpg.connect(DATABASE_URL)
    
    try:
        print("Running migration: Add game_mode and team_config columns...")
        
        # Add game_mode column
        await conn.execute("""
            ALTER TABLE sessions
            ADD COLUMN IF NOT EXISTS game_mode VARCHAR(20) NOT NULL DEFAULT 'free-for-all'
        """)
        print("✓ Added game_mode column")
        
        # Add team_config column
        await conn.execute("""
            ALTER TABLE sessions
            ADD COLUMN IF NOT EXISTS team_config JSONB
        """)
        print("✓ Added team_config column")
        
        # Add constraint (drop if exists, then add)
        try:
            await conn.execute("""
                ALTER TABLE sessions
                DROP CONSTRAINT IF EXISTS chk_sessions_game_mode
            """)
            await conn.execute("""
                ALTER TABLE sessions
                ADD CONSTRAINT chk_sessions_game_mode
                CHECK (game_mode IN ('free-for-all', 'team'))
            """)
            print("✓ Added constraint chk_sessions_game_mode")
        except Exception as e:
            print(f"Note: Constraint may already exist: {e}")
        
        print("\n✅ Migration completed successfully!")
        
    except Exception as e:
        print(f"\n❌ Migration failed: {e}")
        raise
    finally:
        await conn.close()
        print("Database connection closed.")

if __name__ == "__main__":
    asyncio.run(run_migration())
