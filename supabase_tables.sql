-- Create the reservations table if it doesn't exist
CREATE TABLE IF NOT EXISTS reservations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    check_in DATE NOT NULL,
    check_out DATE NOT NULL,
    adults INTEGER NOT NULL,
    children INTEGER DEFAULT 0,
    room_type TEXT NOT NULL,
    preferences TEXT[],
    addons TEXT[],
    special_requests TEXT,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create the email_notifications table
CREATE TABLE IF NOT EXISTS email_notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    recipient TEXT NOT NULL,
    subject TEXT NOT NULL,
    content TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    sent_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT
);

-- Create an index on the email_notifications status for faster queries
CREATE INDEX IF NOT EXISTS idx_email_notifications_status ON email_notifications(status);

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create a trigger to automatically update the updated_at column
CREATE TRIGGER update_reservations_updated_at
    BEFORE UPDATE ON reservations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create a function to handle email notifications
CREATE OR REPLACE FUNCTION handle_email_notification()
RETURNS TRIGGER AS $$
BEGIN
    -- This function will be called by the Supabase Edge Function
    -- You can add additional logic here if needed
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create a trigger for email notifications
CREATE TRIGGER trigger_email_notification
    AFTER INSERT ON email_notifications
    FOR EACH ROW
    EXECUTE FUNCTION handle_email_notification();

-- Add some sample data for testing (optional)
INSERT INTO reservations (
    name, email, phone, check_in, check_out, adults, children, room_type, status
) VALUES (
    'John Doe',
    'john@example.com',
    '+1234567890',
    CURRENT_DATE + INTERVAL '7 days',
    CURRENT_DATE + INTERVAL '10 days',
    2,
    1,
    'deluxe',
    'pending'
) ON CONFLICT DO NOTHING;

-- Create RLS (Row Level Security) policies
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_notifications ENABLE ROW LEVEL SECURITY;

-- Allow public read access to reservations (for the booking form)
CREATE POLICY "Allow public read access to reservations"
    ON reservations FOR SELECT
    USING (true);

-- Allow public insert access to reservations (for the booking form)
CREATE POLICY "Allow public insert access to reservations"
    ON reservations FOR INSERT
    WITH CHECK (true);

-- Allow admin full access to reservations
CREATE POLICY "Allow admin full access to reservations"
    ON reservations FOR ALL
    USING (auth.role() = 'authenticated');

-- Allow admin full access to email notifications
CREATE POLICY "Allow admin full access to email notifications"
    ON email_notifications FOR ALL
    USING (auth.role() = 'authenticated'); 