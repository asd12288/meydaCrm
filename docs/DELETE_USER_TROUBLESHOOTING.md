# Delete User Troubleshooting

## Error: "Erreur lors de la suppression"

### Quick Checks

1. **Check if Edge Function is deployed**
   ```bash
   supabase functions list
   ```
   
   Should show `admin-delete-user` in the list.
   
   If not deployed:
   ```bash
   supabase functions deploy admin-delete-user
   ```

2. **Check Edge Function logs**
   ```bash
   supabase functions logs admin-delete-user --limit 50
   ```
   
   Look for:
   - Authentication errors
   - Database errors
   - Permission errors

3. **Check browser console**
   - Open DevTools (F12) → Console tab
   - Look for detailed error messages
   - Check Network tab for the Edge Function request

4. **Verify user is admin**
   - Check that the current user has `role = 'admin'` in the `profiles` table
   - Verify the user is not trying to delete themselves

### Common Issues

#### Issue 1: Edge Function Not Deployed
**Error**: 404 Not Found or "Function not found"

**Solution**:
```bash
supabase functions deploy admin-delete-user
```

#### Issue 2: Authentication Error
**Error**: "Non authentifie" or 401 Unauthorized

**Causes**:
- Session expired
- Invalid access token

**Solution**:
- Log out and log back in
- Check that `NEXT_PUBLIC_SUPABASE_URL` is set correctly

#### Issue 3: Permission Error
**Error**: "Acces non autorise" or 403 Forbidden

**Causes**:
- User is not admin
- Edge Function cannot verify admin role

**Solution**:
- Verify user role in `profiles` table:
  ```sql
  SELECT id, display_name, role FROM profiles WHERE id = auth.uid();
  ```
- Should return `role = 'admin'`

#### Issue 4: Cannot Delete Self
**Error**: "Vous ne pouvez pas supprimer votre propre compte"

**Solution**: This is intentional - admins cannot delete themselves. Use another admin account.

#### Issue 5: User Has Assigned Leads
**Error**: Foreign key constraint or cascade delete issues

**Note**: The foreign key on `leads.assigned_to` is set to `ON DELETE SET NULL`, so deleting a user should set `assigned_to` to NULL for their leads. This should not cause an error.

### Testing the Edge Function Manually

Test with curl:

```bash
# Get your access token from browser DevTools
curl -X POST https://your-project.supabase.co/functions/v1/admin-delete-user \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{"userId": "user-id-to-delete"}'
```

### Debug Steps

1. **Check browser console** for the improved error message
2. **Check Edge Function logs**: `supabase functions logs admin-delete-user`
3. **Verify Edge Function is deployed**: `supabase functions list`
4. **Check user role**: Verify admin role in database
5. **Try deleting again** and check the detailed error message

### Next Steps

If the error persists:
1. Share the error message from browser console
2. Share Edge Function logs
3. Verify Edge Function deployment status


