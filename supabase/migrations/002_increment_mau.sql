CREATE OR REPLACE FUNCTION increment_mau(dev_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE developers
    SET mau_current = mau_current + 1
    WHERE id = dev_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
