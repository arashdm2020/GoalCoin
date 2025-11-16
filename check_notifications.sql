-- Check if notifications table exists
SELECT EXISTS (
   SELECT FROM information_schema.tables 
   WHERE table_name = 'notifications'
);

-- Check all notifications for user cmhxgw7yz00009bdd5ssztnzv
SELECT * FROM notifications 
WHERE user_id = 'cmhxgw7yz00009bdd5ssztnzv'
ORDER BY created_at DESC;

-- Check total count of notifications
SELECT COUNT(*) FROM notifications;

-- Check notifications table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'notifications'
ORDER BY ordinal_position;
