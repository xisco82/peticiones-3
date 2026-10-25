# Security Specification: Peticiones y Turnos (Firestore)

## 1. Data Invariants
- Only authenticated users can access their own requests, incidents, and schedules.
- Employees can only read their own requests and incidents, and create new requests with their own UID as employeeId.
- Admins (identified via user role document or admin list) can read and manage all requests, users, and schedules.
- Cuadrante General (Schedules): All authenticated employees can read published schedules (`status == 'published'`). Only admins can create, update, or publish schedules.
- Audit logs: Immutable write-only for system events, readable only by admins.
- Users collection: Users can read their own profile; admins can read and write all users.

## 2. The "Dirty Dozen" Payloads
1. Non-admin attempting to publish a schedule -> PERMISSION_DENIED
2. Non-admin attempting to create a new user -> PERMISSION_DENIED
3. Employee attempting to read another employee's private absence reason -> PERMISSION_DENIED
4. Employee attempting to tamper with another employee's shift request -> PERMISSION_DENIED
5. Unauthenticated read on `/users/{userId}` -> PERMISSION_DENIED
6. Unauthenticated write on `/schedules/{scheduleId}` -> PERMISSION_DENIED
7. Unauthenticated write on `/audit_logs/{logId}` -> PERMISSION_DENIED
8. Malformed document ID with special characters (`/users/../../../etc`) -> PERMISSION_DENIED
9. Exceeded string length attack (>50000 chars) -> PERMISSION_DENIED
10. Ghost field attack on schedule update -> PERMISSION_DENIED
11. Employee attempting to delete an audit log -> PERMISSION_DENIED
12. Attempt to read draft schedule by non-admin -> PERMISSION_DENIED
