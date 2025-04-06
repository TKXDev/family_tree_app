# Role Management System

This document explains how the role management system works in the Family Tree App.

## Three-Tier Role System

The application implements a three-tier role system:

1. **Regular Users** (`role: "user"`)

   - Can only view family members
   - Cannot modify any data
   - Basic access to family tree and member data

2. **Basic Admin** (`role: "admin"`)

   - All regular user permissions
   - Can add, edit, and delete family members
   - Can access admin dashboard
   - Cannot change other users' roles

3. **Main Admin** (`role: "main_admin"`)
   - All basic admin permissions
   - Can promote regular users to basic admin
   - Can demote basic admins to regular users
   - Only one user can have this role in the system

## Role Enforcement

Access control is enforced at multiple levels:

1. **Database Schema**:

   - The User model defines a role field with three possible values: "user", "admin", "main_admin"
   - Only one user can have the "main_admin" role at a time

2. **API Authorization**:

   - Member management APIs (add/edit/delete) check for admin access
   - Role management APIs check for main_admin role

3. **UI Authorization**:
   - Components render different options based on user role
   - Admin-only features are only visible to admin and main_admin roles
   - Role management UI is only accessible to the main_admin

## Setting Up Main Admin

When upgrading from a previous version, you need to designate one of your existing admin users as the Main Admin. A migration script is provided for this purpose.

### Running the Migration

```bash
# Set up an admin user as the Main Admin
npm run set-main-admin
```

The script will:

1. Find the first admin user in your database (oldest by creation date)
2. Promote this user to main_admin
3. If there's already a main_admin, ask for confirmation before replacing

## Technical Implementation

- All role checks use helper functions from the auth library
- These include: `isAdmin()`, `isMainAdmin()`, `canManageMembers()`, and `canPromoteToAdmin()`
- The AuthContext provides these checks as boolean values to all components
- The middleware enforces admin access for protected routes

## Security Considerations

- Only the main_admin can promote users to admin
- This prevents privilege escalation without oversight
- The system ensures there can be only one main_admin at a time
- Basic admins cannot change roles at all

## Troubleshooting

If you need to change who is designated as the Main Admin, use the provided script:

```bash
npm run set-main-admin
```

Or you can use MongoDB commands directly:

```javascript
// Set a new main_admin (replace with the actual user ID)
db.users.updateOne(
  { _id: ObjectId("user_id_here") },
  { $set: { role: "main_admin" } }
);

// This will automatically demote any existing main_admin to admin
```
