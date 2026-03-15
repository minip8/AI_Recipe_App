-- Create recipes table
CREATE TABLE recipes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  prep_time INTEGER,
  cook_time INTEGER,
  servings INTEGER,
  ingredients JSONB,
  steps JSONB,
  ratings_count INTEGER DEFAULT 0,
  average_rating DECIMAL(3,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create ratings table
CREATE TABLE ratings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  recipe_id UUID REFERENCES recipes(id) ON DELETE CASCADE,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  ip_hash TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(recipe_id, ip_hash) -- Prevent multiple ratings from same IP
);

-- Create indexes for better performance
CREATE INDEX idx_recipes_created_at ON recipes(created_at DESC);
CREATE INDEX idx_ratings_recipe_id ON ratings(recipe_id);

-- Enable Row Level Security (RLS)
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;

-- Allow public read access to recipes and ratings
CREATE POLICY "Public read access for recipes" ON recipes FOR SELECT USING (true);
CREATE POLICY "Public read access for ratings" ON ratings FOR SELECT USING (true);

-- Allow public insert for recipes (for sharing)
CREATE POLICY "Public insert access for recipes" ON recipes FOR INSERT WITH CHECK (true);

-- Allow public insert for ratings
CREATE POLICY "Public insert access for ratings" ON ratings FOR INSERT WITH CHECK (true);