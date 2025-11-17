@echo off
echo Applying database fixes...
psql "postgresql://goalcoin_user:e29X94Ny6msJRJT4GbMTZzNaPj7PbOxB@dpg-d44aclq4d50c73883vj0-a.oregon-postgres.render.com/goalcoin" -f fix_all_null_fields.sql
echo Done!
pause
