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

-- Function to get user's search limit based on subscription
CREATE OR REPLACE FUNCTION get_user_search_limit()
RETURNS INTEGER AS $$
DECLARE
    user_limit INTEGER;
    subscription_limit INTEGER;
BEGIN
    -- Default limit for free users
    user_limit := 2;
    
    -- Check if user has an active subscription
    SELECT searches_limit INTO subscription_limit
    FROM subscriptions
    WHERE user_id = auth.uid()
    AND status = 'active'
    ORDER BY created_at DESC
    LIMIT 1;
    
    -- If subscription found, use its limit (unless it's -1 for unlimited)
    IF FOUND AND subscription_limit > 0 THEN
        user_limit := subscription_limit;
        RAISE NOTICE 'User % has active subscription with limit: %', auth.uid(), subscription_limit;
    ELSIF FOUND AND subscription_limit = -1 THEN
        -- Unlimited searches
        user_limit := 999999;
        RAISE NOTICE 'User % has unlimited subscription', auth.uid();
    ELSE
        RAISE NOTICE 'User % has no active subscription, using free limit: %', auth.uid(), user_limit;
    END IF;
    
    RETURN user_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user has reached search limit
CREATE OR REPLACE FUNCTION check_search_limit()
RETURNS BOOLEAN AS $$
DECLARE
    search_count INTEGER;
    user_limit INTEGER;
BEGIN
    -- Get user's search limit
    user_limit := get_user_search_limit();
    
    -- If unlimited, always allow
    IF user_limit >= 999999 THEN
        RETURN TRUE;
    END IF;
    
    -- Count searches for the current user in the last 24 hours
    SELECT COUNT(*) INTO search_count
    FROM searches
    WHERE user_id = auth.uid()
    AND search_date >= NOW() - INTERVAL '24 hours';
    
    -- Return true if user has less than their limit
    RETURN search_count < user_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's remaining searches
CREATE OR REPLACE FUNCTION get_remaining_searches()
RETURNS INTEGER AS $$
DECLARE
    search_count INTEGER;
    user_limit INTEGER;
BEGIN
    -- Get user's search limit
    user_limit := get_user_search_limit();
    
    -- If unlimited, return a large number
    IF user_limit >= 999999 THEN
        RETURN 999999;
    END IF;
    
    -- Count searches for the current user in the last 24 hours
    SELECT COUNT(*) INTO search_count
    FROM searches
    WHERE user_id = auth.uid()
    AND search_date >= NOW() - INTERVAL '24 hours';
    
    -- Log for debugging (this will appear in database logs)
    RAISE NOTICE 'User % has % searches in last 24h, limit is %, remaining: %', 
        auth.uid(), search_count, user_limit, GREATEST(0, user_limit - search_count);
    
    -- Return remaining searches
    RETURN GREATEST(0, user_limit - search_count);
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