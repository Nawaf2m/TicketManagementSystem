# Ticket Management System Frontend

React 19, Vite 6, Tailwind CSS 4, Axios, React Router and Lucide React.
The existing purple and green interface is inspired by Sanad Pay.

## Run locally

Requires Node.js >=22.12, npm, and the existing Spring Boot/MySQL backend.

```sh
npm install
npm run dev
```

Open http://localhost:5173. Vite proxies `/api` to http://localhost:8080.
`VITE_API_BASE_URL` can override the API origin, but a different origin requires backend CORS support. The Vite proxy applies to development; production hosting needs an API reverse proxy or configured backend CORS.

```sh
npm run build
npm run preview
node --test tests/regressions.test.mjs
```

## Authentication and permissions

Login calls `GET /api/v1/user/me` and reads `id`, `name`, `email`, `departmentName`, `roleName` and `active`. There is no role selector. HTTP Basic credentials stay in memory and are cleared on sign-out or reload. Use HTTPS when deployed.
Spring Security and service ownership checks remain the authority for every protected operation.

- ADMIN manages users, departments, assignments and priority, and sees all tickets and the latest ten activities.
- AGENT sees created and assigned tickets; the dashboard merges both without duplicates. Only the assigned agent or an admin can advance status.
- EMPLOYEE sees created tickets.
- Workflow: OPEN -> IN_PROGRESS -> RESOLVED -> CLOSED. Assignment and priority changes are available only in OPEN/IN_PROGRESS. Closed tickets allow viewing and downloads, but no new comments or uploads.

## API contracts

Routes are defined in `src/services/api.js` against the Java controllers.

- Create user: `{name, email, password, roleName, departmentId}`.
- Update user: PUT `/api/v1/user/update/{id}` with `{name, email, departmentId}`.
- Change role: PUT `/api/v1/user/update-user-role/{id}` with `{roleName}`. This uses a separate form to avoid partially saving combined updates.
- Updating your own email or role, or deactivating your own account, signs you out.
- Create ticket: `{title, description, priority}`. Create/update department: `{name}`.
- Create comment: `{comment}`. Comment responses use `commentId`, `userId`, `userName`, `comment`, `createdAt`.
- Upload: multipart field `file`, JPG/PNG/PDF, up to 5 MiB. Download uses authenticated Axios blob requests.
- Ticket DTOs include creator and agent IDs and names. User DTOs include department and role names, not department IDs; the edit form resolves the department by its unique name.
- Assignment history stores agent IDs. Admin views resolve names from the user list; other views show a generic assignment description instead of raw IDs.
- Existing list endpoints sometimes return 400 with `The list is empty` (optionally followed by a period). `getList` normalizes only that specific response to `[]`; permission, network and other server errors stay visible.

## Layout

`src/pages` contains the screens, `components/UI.jsx` the shared UI, `layouts/AppLayout.jsx` the navigation, `context/AuthContext.jsx` the in-memory identity, and `utils/data.js` display helpers.
Form errors appear in their form or modal. Failed comment submissions preserve the draft. Errors loading ticket sections are displayed in the affected section.
