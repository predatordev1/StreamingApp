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

<h3>Docker files are created for all backend services like : adminService/adminService/adminService/adminService</h3>
<img width="1062" height="929" alt="image" src="https://github.com/user-attachments/assets/15dc11b1-e87a-4ff3-b8d6-1b1792615ae3" />
<img width="402" height="821" alt="image" src="https://github.com/user-attachments/assets/53220abf-5e36-4798-ac93-ea5054b52650" />
<img width="592" height="457" alt="image" src="https://github.com/user-attachments/assets/f534ba7f-f053-4908-be02-a3a756753cc8" />
<img width="452" height="452" alt="image" src="https://github.com/user-attachments/assets/76d9f9bf-3505-4231-a913-8437d32a1228" />
<img width="863" height="418" alt="image" src="https://github.com/user-attachments/assets/6079d481-d35d-4520-b5c8-92f22cf4ecb1" />

<h3>Docker files are created for Frontend along with Docker-Compose file.</h3>
<img width="1792" height="820" alt="image" src="https://github.com/user-attachments/assets/9e417a38-fbd9-4aff-902d-18ce53e4cc92" />

<h3> Creation of ECR Repos based on front-end and backend.
ECR Repo for frontend and backend created.
<img width="1157" height="416" alt="image" src="https://github.com/user-attachments/assets/c6fad4fd-3c0b-43b3-b15a-e5148f6fbed3" />
<img width="1148" height="407" alt="image" src="https://github.com/user-attachments/assets/06695a71-3549-43f8-9e29-f199034ffcb9" />

<h2>Task 3: Creation of pipeline and if success push those images to ECR repos.</h2>
Jenkins file created for complete flow from builing of Images to Pushing docker images to ECR Server with Post Actions.

```bash
 Inlcuded below stages
  - Testing of AWS Configuration to login ECR Repo.
  - Building images for all Microservices
  - Tagging all Created Docker images based on Frontend and backend scope.
  - Post clean up and email notifications.
```
<img width="1546" height="875" alt="image" src="https://github.com/user-attachments/assets/d0f474b2-aca6-430a-a170-ce92b81fa0af" />
<img width="1490" height="907" alt="image" src="https://github.com/user-attachments/assets/bc1c5ae1-fff2-4c8b-9944-fb0428879410" />

Open Jenkins webpage and configure Pipeline as per below.
<img width="1082" height="787" alt="image" src="https://github.com/user-attachments/assets/b33d1451-edaa-4b93-9730-9b49a31500ec" />
<img width="1126" height="391" alt="image" src="https://github.com/user-attachments/assets/2b242c4e-a621-4ee2-9b52-acaf04553d06" />
<img width="1200" height="662" alt="image" src="https://github.com/user-attachments/assets/2644e663-d07a-47d4-91b8-7472c77cc032" />
<img width="886" height="590" alt="image" src="https://github.com/user-attachments/assets/1b9e6a30-ea74-44fa-8e74-fd49c16f1760" />

Jenkins Pipeline success and docker images are pushed using Jenkins.
<img width="915" height="847" alt="image" src="https://github.com/user-attachments/assets/6251b414-3731-4ca1-8fa8-02d479f89074" />
<img width="790" height="527" alt="image" src="https://github.com/user-attachments/assets/8b75bb4e-c516-4f35-a98a-611d340c31ca" />
<img width="1225" height="755" alt="image" src="https://github.com/user-attachments/assets/817c11b5-d6c8-419c-ad38-8f60ed23f308" />

<h3> Docker images pushed to Respective ECR Repos.
<img width="1888" height="647" alt="image" src="https://github.com/user-attachments/assets/392cf330-2921-4439-94d5-182d921308c6" />
<img width="1873" height="777" alt="image" src="https://github.com/user-attachments/assets/b1790ff6-724f-4fb3-8d86-31b827a94a99" />


