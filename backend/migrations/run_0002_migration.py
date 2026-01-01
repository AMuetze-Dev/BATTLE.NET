"""
Database migration script: Add team_id column to players table
Run this script to update the database schema for team support.
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
    """Run the migration to add team_id column to players table"""
    
    print("Connecting to database...")
    conn = await asyncpg.connect(DATABASE_URL)
    
    try:
        print("Running migration: Add team_id column to players...")
        
        # Add team_id column
        await conn.execute("""
            ALTER TABLE players
            ADD COLUMN IF NOT EXISTS team_id VARCHAR(50)
        """)
        print("✓ Added team_id column to players table")
        
        # Check if teams table exists
        teams_exists = await conn.fetchval("""
            SELECT EXISTS (
                SELECT 1 FROM information_schema.tables 
                WHERE table_name = 'teams'
            )
        """)
        
        if teams_exists:
            # Check if constraint already exists
            constraint_exists = await conn.fetchval("""
                SELECT EXISTS (
                    SELECT 1 FROM pg_constraint 
                    WHERE conname = 'players_team_id_fkey'
                )
            """)
            
            if not constraint_exists:
                await conn.execute("""
                    ALTER TABLE players
                    ADD CONSTRAINT players_team_id_fkey
                    FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE SET NULL
                """)
                print("✓ Added foreign key constraint to teams table")
            else:
                print("ℹ Foreign key constraint already exists")
        else:
            print("ℹ Teams table does not exist yet, skipping foreign key constraint")
        
        print("\n✅ Migration completed successfully!")
        
    except Exception as e:
        print(f"\n❌ Migration failed: {e}")
        raise
    finally:
        await conn.close()
        print("Database connection closed.")

if __name__ == "__main__":
    asyncio.run(run_migration())
