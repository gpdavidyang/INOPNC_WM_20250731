-- Create function to increment login count
CREATE OR REPLACE FUNCTION increment_login_count()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.last_login_at IS DISTINCT FROM NEW.last_login_at THEN
    NEW.login_count := COALESCE(OLD.login_count, 0) + 1;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-increment login count
DROP TRIGGER IF EXISTS increment_login_count_trigger ON profiles;
CREATE TRIGGER increment_login_count_trigger
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION increment_login_count();