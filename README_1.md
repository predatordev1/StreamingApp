<h1>Project on Orchestration and Scaling</h1>
<h2>Objective: <h3>Stream premium video content, host live watch parties, and manage your catalogue with a modern microservice architecture. The platform now ships with a production-ready admin portal, real-time chat, S3-backed adaptive streaming, and a redesigned cinematic frontend experience.</h3></h2>

## Architecture

| Service | Port | Description |
| --- | --- | --- |
| `authService` | 3001 | User authentication, registration, JWT issuance |
| `streamingService` | 3002 | Video catalogue, S3 playback endpoints, public APIs |
| `adminService` | 3003 | Dedicated admin microservice for asset management and uploads |
| `chatService` | 3004 | Websocket + REST chat for live watch parties |
| `frontend` | 3000 | React SPA with revamped UI and integrated chat |
| `mongo` | 27017 | Shared MongoDB instance 

All backend services share common database models and utilities through `backend/common`.

<h2>Task 1: Version Control with Git</h2>
Forked the main repository into GitHub account to Maintain version by syncing/pushing updates from the main repository as needed.

<h2>Task 2: MERN Application Containerize the Application by Creating Dockerfiles for each component (Frontend and Backend)</h2>
