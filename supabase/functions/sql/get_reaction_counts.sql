
-- Function to get reaction counts by post
CREATE OR REPLACE FUNCTION get_reaction_counts_by_post(post_id UUID)
RETURNS TABLE (type TEXT, count BIGINT) AS $$
BEGIN
  RETURN QUERY
  SELECT r.type, COUNT(*)::BIGINT
  FROM reactions r
  WHERE r.post_id = get_reaction_counts_by_post.post_id
  GROUP BY r.type;
END;
$$ LANGUAGE plpgsql;

-- Function to get total reactions count for a post
CREATE OR REPLACE FUNCTION get_total_reactions_count(post_id UUID)
RETURNS BIGINT AS $$
DECLARE
  total_count BIGINT;
BEGIN
  SELECT COUNT(*)
  INTO total_count
  FROM reactions
  WHERE post_id = get_total_reactions_count.post_id;
  
  RETURN total_count;
END;
$$ LANGUAGE plpgsql;

-- Function to get user's reaction for a post
CREATE OR REPLACE FUNCTION get_user_reaction(post_id UUID, user_id UUID)
RETURNS TABLE (id UUID, type TEXT) AS $$
BEGIN
  RETURN QUERY
  SELECT r.id, r.type
  FROM reactions r
  WHERE r.post_id = get_user_reaction.post_id
  AND r.user_id = get_user_reaction.user_id
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Function to toggle reactions
CREATE OR REPLACE FUNCTION toggle_reaction(
  p_post_id UUID,
  p_user_id UUID,
  p_reaction_type TEXT
)
RETURNS JSON AS $$
DECLARE
  existing_reaction RECORD;
  result JSON;
BEGIN
  -- Check for existing reaction
  SELECT * INTO existing_reaction
  FROM reactions
  WHERE post_id = p_post_id AND user_id = p_user_id;

  -- Handle different cases based on existing reaction
  IF existing_reaction IS NOT NULL AND existing_reaction.type = p_reaction_type THEN
    -- If same reaction exists, remove it
    DELETE FROM reactions
    WHERE id = existing_reaction.id;
    
    result := json_build_object(
      'postId', p_post_id,
      'reactionType', p_reaction_type,
      'action', 'removed'
    );
    
  ELSIF existing_reaction IS NOT NULL THEN
    -- If different reaction exists, update it
    UPDATE reactions
    SET type = p_reaction_type
    WHERE id = existing_reaction.id;
    
    result := json_build_object(
      'postId', p_post_id,
      'reactionType', p_reaction_type,
      'action', 'updated',
      'previousType', existing_reaction.type
    );
    
  ELSE
    -- If no reaction exists, add a new one
    INSERT INTO reactions(post_id, user_id, type)
    VALUES (p_post_id, p_user_id, p_reaction_type);
    
    result := json_build_object(
      'postId', p_post_id,
      'reactionType', p_reaction_type,
      'action', 'added'
    );
  END IF;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;
