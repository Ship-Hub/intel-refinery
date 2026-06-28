# Cyber Refinery Security

## Source Authorization

### Authorization Model

Every source operation must verify:
1. Source belongs to a project
2. Project belongs to the authenticated account or workspace
3. Authenticated identity has permission for the operation

### Authorization Implementation

#### V1 API Routes (`/api/v1`)

All v1 source routes include proper authorization:

| Route | Authorization Check |
|-------|---------------------|
| `GET /projects/:projectId/sources` | Verifies `project.account_id = req.account.id` via JOIN |
| `POST /projects/:projectId/sources/raw` | Uses `verifyProjectOwner()` helper |
| `POST /projects/:projectId/sources/url` | Uses `verifyProjectOwner()` helper |
| `POST /projects/:projectId/sources/upload` | Uses `verifyProjectOwner()` helper |
| `PATCH /projects/:projectId/sources/:sourceId` | Verifies source belongs to project AND project belongs to account |

#### Legacy Routes (`/api/sources`)

Legacy source routes now include authorization:

| Route | Authorization Check |
|-------|---------------------|
| `POST /upload` | Verifies project belongs to account before creating source |
| `POST /url` | Verifies project belongs to account before creating source |
| `POST /raw` | Verifies project belongs to account before creating source |
| `GET /project/:projectId` | Verifies project belongs to account before listing sources |
| `GET /:id` | Verifies source belongs to account via project JOIN |
| `DELETE /:id` | Verifies source belongs to account via project JOIN |
| `GET /:id/chunks` | Verifies source belongs to account via project JOIN |

### Authorization Query Pattern

```sql
-- Standard authorization check for source operations
SELECT s.* FROM sources s
JOIN projects p ON p.id = s.project_id
WHERE s.id = ? AND p.account_id = ?

-- Alternative: exists check for write operations
SELECT s.id FROM sources s
JOIN projects p ON p.id = s.project_id
WHERE s.id = ? AND s.project_id = ? AND p.account_id = ?
```

### Workspace Isolation

The `workspaceIsolation.js` middleware provides:
- `enforceWorkspaceAccess(resourceType)` - Verifies workspace belongs to account
- `scopeProjectToWorkspace(projectId, accountId, workspaceId)` - Ensures project is in workspace
- `scopeSourceToProject(sourceId, projectId, accountId)` - Ensures source belongs to project

### IDOR Prevention

To prevent Insecure Direct Object Reference (IDOR) attacks:

1. **Never trust client-supplied IDs alone** - Always verify ownership
2. **Use JOIN-based authorization** - Check ownership through relationships
3. **Return 404 for unauthorized access** - Don't reveal resource existence
4. **Consistent error messages** - Use same message for "not found" and "access denied"

### Testing Authorization

Authorization tests should verify:
- Accessing another account's source returns 404
- Updating another workspace's source returns 404
- Deleting another project's source returns 404
- Downloading another account's original file returns 404
- Accessing a source through the wrong project ID returns 404
- Normal authorized access still works

### Future Improvements

- [ ] Add rate limiting per source operation
- [ ] Implement audit logging for source access
- [ ] Add RBAC for workspace members
- [ ] Implement source-level permissions
