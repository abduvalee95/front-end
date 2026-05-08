---
# BACKEND MEMORY
updated: 2026-05-03

## STACK (confirmed from package.json)
- framework: nestjs v10.0.0
- language: typescript
- orm: prisma v5.22.0
- database: postgresql
- auth: jwt v10.2.0
- port: 3000 (from main.ts)
- global prefix: None (from main.ts)
- cors: Enabled for allowed origins in prod, true in dev (from main.ts)

## DATABASE SCHEMA (from prisma/schema.prisma)

### User
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| id | String | yes | uuid |
| organization_id | String | yes | uuid |
| full_name | String | yes | |
| email | String | yes | |
| phone | String | yes | unique globally |
| password | String | yes | hashed |
| role | UserRole | yes | enum |
| refresh_token | String | no | |
| created_at | DateTime | yes | |
| updated_at | DateTime | yes | |
Relations: belongs to Organization, has many TeacherProfiles, Notes, Payments, Expenses

### Organization
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| id | String | yes | uuid |
| name | String | yes | unique |
| status | OrganizationStatus | yes | enum: ACTIVE, INACTIVE |
| email | String | yes | |
| phone | String | yes | |
| telegram_enabled | Boolean | yes | |
| telegram_bot_token | String | no | |
| telegram_chat_id | String | no | |
| whatsapp_enabled | Boolean | yes | |
| whatsapp_cloud_token | String | no | |
| whatsapp_phone_number_id | String | no | |
| whatsapp_api_version | String | no | |
| whatsapp_cloud_base_url | String | no | |
| whatsapp_target | String | no | |
| created_at | DateTime | yes | |
| updated_at | DateTime | yes | |
Relations: has many Courses, Groups, Leads, Notes, Payments, NotificationJobs, Students, Users, Enrollments, Attendances, Progresses, Exams, Tests, Expenses, Invoices, GroupSchedules

### TeacherProfile
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| id | String | yes | uuid |
| user_id | String | yes | unique, uuid |
| subjects | String[] | yes | |
| hourly_rate | Decimal | no | |
| qualifications | String | no | |
| bio | String | no | |
| status | TeacherStatus | yes | ACTIVE, INACTIVE, ON_LEAVE |
| created_at | DateTime | yes | |
| updated_at | DateTime | yes | |
Relations: belongs to User

### Course, Group, GroupSchedule, Lesson, Student, Enrollment, Attendance, Progress, Exam, Test, Lead, Note, Payment, Invoice, InvoiceItem, Expense, Archive, NotificationJob
(Models contain relevant fields for a CRM/LMS system, linked to Organization and respective entities).

## ROLES & PERMISSIONS
Roles found:
- SUPER_ADMIN: platform wide access
- ADMIN: organization admin
- TEACHER: teacher access
- STUDENT: student access
- MANAGER: manager access

Decorators/Guards:
- `JwtAuthGuard`: validates JWT token
- `OrganizationIdGuard`: validates organization scope
- `RolesGuard`: checks `@Roles()` decorator
- `RateLimitGuard`: rate limits endpoints

## ALL ENDPOINTS (ground truth)

### Auth Module
| Method | Path | Auth | DTO | Response | Notes |
|--------|------|------|-----|----------|-------|
| POST | /auth/login | public | LoginDto | {accessToken, refreshToken, user} | Uses phone and password |
| POST | /auth/refresh | public | RefreshTokenDto | {accessToken, refreshToken} | Refreshes JWT |

### Platform Module (SuperAdmin)
| Method | Path | Auth | DTO | Response | Notes |
|--------|------|------|-----|----------|-------|
| POST | /platform/register | public | RegisterOrgDto | {organization_id, ...} | creates org+admin |
| GET | /platform/organizations | superadmin | - | paginated list | |
| GET | /platform/users | superadmin | - | paginated users | |
| GET | /platform/all | superadmin | - | [...] | all users |
| PATCH | /platform/:id | superadmin | UpdateOrgDto | {...} | update org |
| PATCH | /platform/organizations/:id/status | superadmin | - | {...} | toggle status |

### User Module
| Method | Path | Auth | DTO | Response | Notes |
|--------|------|------|-----|----------|-------|
| POST | /user/login | public | LoginDto | LoginResponseDto | Login |
| GET | /user/me | jwt | - | User | Get current user |
| POST | /user/logout | jwt | - | {success: true} | Clear refresh token |
| POST | /user/update | jwt | UserUpdateDto | User | Update profile |

### Organizations Module (Auth - under /organizations)
| Method | Path | Auth | DTO | Response | Notes |
|--------|------|------|-----|----------|-------|
| POST | /organizations/users | jwt, ADMIN, org | InviteUserDto | {user, temporaryPassword} | Invite a user to the org |

### Other Modules
- `/attendance` (GET, POST, PATCH, DELETE)
- `/expense` (GET, POST, PATCH, DELETE)
- `/courses` (GET, POST, PATCH, DELETE)
- `/calendar` (GET teacher/:teacherId)
- `/progress` (GET, POST, PATCH, DELETE)
- `/groups` (GET, POST, PATCH, DELETE, schedule)
- `/notifications` (GET, PATCH, POST dispatch)
- `/enrollment` (GET, POST, PATCH, DELETE)
- `/payment` (GET, POST, PATCH, DELETE)
- `/student` (GET, POST, PATCH, DELETE, enroll)
- `/dashboard` (GET summary, GET analytics/*)
- `/lead` (GET, POST, PATCH, DELETE, convert)
- `/finance` (GET summary, GET report)
- `/lessons` (GET, POST, PATCH, DELETE, reschedule)
- `/teachers` (GET, POST, PATCH, DELETE, groups, schedule)
- `/billing` (GET, POST invoices/generate, pay)

## DTO SHAPES (exact fields)

### InviteUserDto
| Field | Type | Required | Validation | Notes |
|-------|------|----------|-----------|-------|
| full_name | string | yes | MinLength(2) | |
| phone | string | yes | Matches `^\+996\d{9}$` | Must be a Kyrgyzstan number |
| email | string | yes | IsEmail | |
| password | string | yes | MinLength(6) | DTO requires it with @IsNotEmpty() |
| role | enum | yes | UserRole | ADMIN, MANAGER, TEACHER, STUDENT |
| title | string | no | | Optional info |

## AUTH MECHANISM (confirmed)
- strategy: jwt bearer
- token header: Authorization: Bearer
- token payload: { sub, id, role, email, phone, name, organization_id }
- guards used: JwtAuthGuard, OrganizationIdGuard, RolesGuard
- how roles checked: RolesGuard checks `@Roles()` against `user.role`
- superadmin check: `user.role === UserRole.SUPER_ADMIN` handled inside services/guards.

## INVITE USER FLOW (backend confirmed)
Trace the full flow from endpoint to database:

1. Request hits: POST `/organizations/users`
2. Guards: `JwtAuthGuard`, `RolesGuard`, `OrganizationIdGuard`
3. DTO validation: `InviteUserDto`
4. Service method: `UserService.inviteUser`
5. What service does:
   - checks if `input.role === UserRole.SUPER_ADMIN` (throws Forbidden if true)
   - checks if user exists globally by `phone` (throws BadRequest if true)
   - checks if user exists by `email` within the organization scope (throws BadRequest if true)
   - uses provided password (required by DTO)
   - hashes the password with bcrypt
   - creates a user record in the database with `organization_id`, `full_name`, `email`, `phone`, `password`, `role`.
6. Email: NO (does not send email)
7. Response: Returns `{ user: { ... }, temporaryPassword: '...' }` (since password is required by DTO, temporaryPassword will be undefined)
8. Error cases: Phone exists globally, Email exists in org, Cannot create SUPER_ADMIN.

## RESPONSE FORMATS
### Success
Direct object or nested inside specific wrappers, varies by endpoint.

### Error
`{ statusCode: 400/401/403, message: '...', error: '...' }`

### Paginated
`{ items: [...], meta: { total, page, limit, pages } }`

## MISSING OR UNCLEAR
- `InviteUserDto` requires `password` with `@IsNotEmpty()`, but `UserService` does `input.password ?? Math.random()`. Because of the DTO validation, the frontend must always send a password.

## BACKEND RISKS
- The regex `^\+996\d{9}$` requires a +996 phone number format. This is strict and UI must enforce or format it.

## PRODUCT RULES (never break)
- superadmin cannot manage internal org users
- only org admin can invite users to org
- organization = company/tenant
- each org has: admin, manager, user, teacher
---
