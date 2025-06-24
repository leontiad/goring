-- Create the searches table
CREATE TABLE searches (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    username VARCHAR(255) NOT NULL,
    search_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create an index on user_id for better performance
CREATE INDEX idx_searches_user_id ON searches(user_id);

-- Create an index on search_date for time-based queries
CREATE INDEX idx_searches_date ON searches(search_date);

-- Enable Row Level Security
ALTER TABLE searches ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own searches
CREATE POLICY "Users can view own searches" ON searches
    FOR SELECT USING (auth.uid() = user_id);

-- Policy: Users can only insert their own searches
CREATE POLICY "Users can insert own searches" ON searches
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy: Users can only update their own searches
CREATE POLICY "Users can update own searches" ON searches
    FOR UPDATE USING (auth.uid() = user_id);

-- Policy: Users can only delete their own searches
CREATE POLICY "Users can delete own searches" ON searches
    FOR DELETE USING (auth.uid() = user_id);

-- Function to check if user has reached search limit
CREATE OR REPLACE FUNCTION check_search_limit()
RETURNS BOOLEAN AS $$
DECLARE
    search_count INTEGER;
BEGIN
    -- Count searches for the current user in the last 24 hours
    SELECT COUNT(*) INTO search_count
    FROM searches
    WHERE user_id = auth.uid()
    AND search_date >= NOW() - INTERVAL '24 hours';
    
    -- Return true if user has less than 2 searches
    RETURN search_count < 2;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's remaining searches
CREATE OR REPLACE FUNCTION get_remaining_searches()
RETURNS INTEGER AS $$
DECLARE
    search_count INTEGER;
BEGIN
    -- Count searches for the current user in the last 24 hours
    SELECT COUNT(*) INTO search_count
    FROM searches
    WHERE user_id = auth.uid()
    AND search_date >= NOW() - INTERVAL '24 hours';
    
    -- Return remaining searches (2 - current count)
    RETURN GREATEST(0, 2 - search_count);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's search history
CREATE OR REPLACE FUNCTION get_user_search_history()
RETURNS TABLE (
    username VARCHAR(255),
    search_date TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT s.username, s.search_date
    FROM searches s
    WHERE s.user_id = auth.uid()
    ORDER BY s.search_date DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 