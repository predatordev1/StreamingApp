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

Pipeline auto started once i made any push.

<img width="1436" height="672" alt="image" src="https://github.com/user-attachments/assets/7ef6a73f-c1ea-42a6-a0e3-13459d859e80" />

<h2>Task 4: Creation of EKS Cluster and deployment app using HELM Package.</h2>
Installation of Helm and adding the Helm repo.

```bash
helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx -n streaming-app
helm repo update 
helm upgrade --install ingress-nginx ingress-nginx/ingress-nginx -n ingress-nginx --create-namespace --set controller.service.type=LoadBalancer --set controller.ingressClassResource.name=nginx --set controller.ingressClassByName=true -n streaming-app -n streaming-app

```

Once Repo added write all K8s deployment and service files.

<img width="377" height="767" alt="image" src="https://github.com/user-attachments/assets/8ce73fa0-8362-47df-977e-88bb5405c7f8" />
<img width="1012" height="818" alt="image" src="https://github.com/user-attachments/assets/e24d38a1-968d-4e65-beec-81280b7bd5a9" />
<img width="945" height="817" alt="image" src="https://github.com/user-attachments/assets/ae7c6cd1-c4a9-4019-9ead-51601e29c9f5" />

Create all files like deployment ,Service, Ingress, ConfigMap, Namespace ,Database Volume and dB PVC.
Make sure don't include secrets in git hub so create secreats in Kubernets cluster only like AWS_ACCESS_KEY_ID/AWS_SECRET_ACCESS_KEY and JWT_SECRET using

```bash
kubectl create secret generic streamingapp-secrets \
  --from-literal=AWS_ACCESS_KEY_ID="Your_aws_access_key" \
  --from-literal=AWS_SECRET_ACCESS_KEY="your_secret_access_key" \
  --from-literal=JWT_SECRET="super_secret_jwt_key_123" -n streaming-app

```
At this point all required files are created and and ready to deploy using Helm with below command.

```bash
helm install streaming-app

```
<img width="806" height="535" alt="image" src="https://github.com/user-attachments/assets/f9b229c3-cd9e-41ad-ae4c-0f8c7baf7a18" />

After dployment check if all PODs and services are running and Pods are healty.

```bash
kubectl get pods -n streaming-app
kubectl get svc -n streaming-app

```
<img width="844" height="352" alt="image" src="https://github.com/user-attachments/assets/39e925d0-188b-4ddd-9bc6-947452b0916a" />
<img width="1612" height="575" alt="image" src="https://github.com/user-attachments/assets/2dddf9c2-8610-4846-8474-127bd09cdb90" />

At this point complete app is fully deployed and running without any issue.

<h2>Task 5: Creation of EKS Cluster and deployment app using HELM Package.</h2>

## Step 1: Initial Registration & Login

1. **Access the Website**
   Open your preferred web browser and navigate to the application's URL. If you are running locally, go to:
   Copy ELB Link and paste over browser you will be able to access homepage of APP.

   <img width="1342" height="935" alt="image" src="https://github.com/user-attachments/assets/581e6510-d173-4be0-ba12-4a2ef42d5db8" />.
   
2. **Create an Account**
   - Click the **"Sign Up"** or **"Register"** button on the homepage.
   - Fill in your details (e.g., `user@example.com`, `Password123`).
   - Submit the form to create your account. By default, every new account is created as a **Standard User**.
     
   <img width="655" height="777" alt="image" src="https://github.com/user-attachments/assets/61ba58f3-a5da-4dc3-b605-c5a382be4742" />
   <img width="591" height="553" alt="image" src="https://github.com/user-attachments/assets/1b03e589-141e-4082-ad97-2efed2c2133b" />

3. **Log In**
   - You should be automatically redirected to the login screen.
   - Enter the email and password you just registered.
   - You are now authenticated! You should see your user profile in the top navigation bar.
   <img width="1878" height="512" alt="image" src="https://github.com/user-attachments/assets/fca73753-1aaa-489a-9472-a4bf1cb8559c" />

---
## Step 2: Elevating Your Account to Administrator
To register yourself as admin user register your email as a admin user and update with below command.
Connect to the Database Pod Execute the following command to automatically find your running MongoDB pod and open an interactive shell (mongosh) inside the streamingapp database:

```bash
kubectl exec -it <mongodb-pod-name> -n streaming-app -- mongosh streamingapp

```
Promote the User Role Once you see the MongoDB prompt (test>), run the following javascript command to grant yourself admin access. Make sure to replace the email inside the quotes with the exact email you signed up with:
```bash

db.users.updateOne({ email: "user@example.com" }, { $set: { role: "admin" } });

```
You should see an output confirming the matchedCount: 1 and modifiedCount: 1.
Exit the Database Type exit and press enter to return to your normal computer terminal.
<img width="1212" height="611" alt="image" src="https://github.com/user-attachments/assets/9749c159-f3af-4fb5-a4d9-35d14eb86cbd" />


## Step 3: Accessing the Admin Dashboard

1. **Refresh Your Session**
   Because your browser technically still has a "Standard User" token saved, you need to refresh it.
   - Click **Logout** on the application's top navigation bar.
   - **Log back in** with your email and password. Your new token will now successfully state that you are an `admin`.
2. **Open the Dashboard**
   - Navigate to `http://localhost/admin` in your browser. (Or click the Admin Dashboard link if available in the UI).
   - The private administrator upload dashboard will now appear correctly instead of redirecting you back to the home page!
<img width="1878" height="512" alt="image" src="https://github.com/user-attachments/assets/139daa51-7bd9-4c74-a999-a14ad4f180f1" />

## 🎬 Step 4: Uploading a Video & Thumbnail

From inside the Admin Dashboard:

1. **Upload the Media Files**
   - Locate the Video Upload section.
   - Select the **Video File** (`.mp4`, `.mov`, etc.) you wish to stream from your personal computer.
   - Select a high-quality **Thumbnail Image** (`.jpg`, `.png`) to be displayed as the preview card.
2. **Fill in the Metadata**
   - Provide a compelling **Title** and **Description** for the video.
   - Select any relevant categories or tags provided by the menu.
3. **Publish**
   - Click the "Upload" or "Submit" button. 
   - Wait for the progress bar to complete. The backend `admin-service` handles processing the upload securely into your cloud/local storage.

## Step 5: Streaming Your Content

1. **Return to the Homepage**
   Navigate back to `http://localhost/browse` or click the website's logo.
2. **Find Your Video**
   You should now see the thumbnail you uploaded appearing dynamically on the main grid of the application!
3. **Watch the Stream**
   - Click on the thumbnail.
   - The application will route you to the dynamic video player page. 
   - Press **Play**. The frontend will connect to the `streaming-service`, requesting the video chunks and caching them into the HTML5 video player for a buttery smooth streaming experience.

## Step 6: Logging Out

When you are finished managing content or watching streams:
1. Click your profile name / avatar in the top right corner.
2. Select **Logout** from the dropdown menu.
3. Your secure JWT token will be destroyed, closing your session and returning you to the login screen.

---
*Happy Streaming!*

