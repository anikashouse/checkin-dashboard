-- Create users table for authentication
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  image TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Enable RLS on users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only see their own data
CREATE POLICY "Users can view own data"
  ON users FOR SELECT
  USING (auth.uid() = id);

-- RLS Policy: Users can update their own data
CREATE POLICY "Users can update own data"
  ON users FOR UPDATE
  USING (auth.uid() = id);

-- Update properties table to link to users
ALTER TABLE properties ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE CASCADE;

-- Create index on user_id in properties
CREATE INDEX IF NOT EXISTS idx_properties_user_id ON properties(user_id);

-- RLS Policy: Users can only see their own properties
CREATE POLICY "Users can view own properties"
  ON properties FOR SELECT
  USING (user_id = auth.uid());

-- RLS Policy: Users can only update their own properties
CREATE POLICY "Users can update own properties"
  ON properties FOR UPDATE
  USING (user_id = auth.uid());

-- RLS Policy: Users can only delete their own properties
CREATE POLICY "Users can delete own properties"
  ON properties FOR DELETE
  USING (user_id = auth.uid());

-- RLS Policy: Users can only insert properties for themselves
CREATE POLICY "Users can insert own properties"
  ON properties FOR INSERT
  WITH CHECK (user_id = auth.uid());
