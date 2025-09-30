# Simple WhatsApp API

A multi-session, easy-to-deploy API that allows you to send text messages and attachments from multiple WhatsApp accounts with minimal setup.

## Features

- **Multi-Session Support**: Connect and manage multiple WhatsApp accounts simultaneously. Each session is tied to its own unique API key.
- **Easy Login**: Scan a QR code just once per session to connect your WhatsApp account.
- **Persistent Sessions**: Sessions are saved locally, so the server can be restarted without needing to log in again.
- **Send Text Messages**: A simple endpoint to send plain text messages from a specific session.
- **Send Attachments**: Send images, videos, or documents directly via file upload, URL, or a Base64 encoded string.
- **File Uploads**: A dedicated endpoint to upload files and receive a temporary URL, perfect for sending as attachments later.
- **Secure**:
    - Protect your entire server with a global **Master API Key**.
    - Manage individual WhatsApp sessions with a per-session **API Key**.
- **Dynamic QR Codes**: Fetch the login QR code for any session as a string or a PNG image via API endpoints.

---

## 🚀 Getting Started

### **Prerequisites**

- [Node.js](https://nodejs.org/) (v16 or higher recommended)
- One or more WhatsApp accounts

### **1. Clone and Install Dependencies**

```bash
git clone https://github.com/Codegres-com/Simple-Whatsapp-API.git
cd Simple-Whatsapp-API
npm install
```

### **2. Configure Your Environment**

Create a `.env` file in the root of the project and add your Master API Key. You can invent any secret strings for the keys.

```
# .env

# This key protects the entire server. All API requests must include it.
MASTER_API_KEY=your_global_master_key_here
```

### **3. Start the Server**

```bash
npm start
```

---

## 🐳 Running with Docker

You can also run this application using Docker and Docker Compose for a more isolated and reproducible setup.

### **1. Using Docker Compose (Recommended)**

This is the easiest way to get started.

1.  **Create an Environment File**:
    Create a `.env` file in the root of the project. This file will be used by Docker Compose to set the environment variables inside the container.

    ```
    # .env

    # The master key to protect the server
    MASTER_API_KEY=yoursecretkey

    # The port to run the server on (optional, defaults to 3000)
    PORT=3000
    ```

2.  **Build and Run the Container**:
    Run the following command to build the Docker image and start the container in the background:

    ```bash
    docker compose up --build -d
    ```

    The server will now be running on the port you specified (or the default, 3000).

3.  **To Stop the Server**:
    ```bash
    docker compose down
    ```

### **2. Using the Pre-built Docker Hub Image**

If you don't want to build the image from the source, you can use the pre-built image from Docker Hub.

1.  **Pull the Image**:
    ```bash
    docker pull codegres/simple-whatsapp-api:latest
    ```

2.  **Run the Image**:
    You still need to provide the environment variables and mount the volumes.

    ```bash
    docker run -d \
      -p 3000:3000 \
      -e MASTER_API_KEY="yoursecretkey" \
      -e PORT="3000" \
      --name whatsapp-api-container \
      -v whatsapp_sessions:/usr/src/app/sessions \
      -v whatsapp_uploads:/usr/src/app/uploads \
      codegres/simple-whatsapp-api:latest
    ```

### **3. Using Docker (Manual Build)**


If you prefer not to use Docker Compose, you can build and run the container manually.

1.  **Build the Docker Image**:
    ```bash
    docker build -t whatsapp-api .
    ```

2.  **Run the Docker Container**:
    You must pass the `MASTER_API_KEY` and map the port. You also need to create and mount volumes to persist the `sessions` and `uploads` data.

    ```bash
    docker run -d \
      -p 3000:3000 \
      -e MASTER_API_KEY="yoursecretkey" \
      -e PORT="3000" \
      --name whatsapp-api-container \
      -v whatsapp_sessions:/usr/src/app/sessions \
      -v whatsapp_uploads:/usr/src/app/uploads \
      whatsapp-api
    ```
    - `-d`: Run in detached mode.
    - `-p`: Map port 3000 on your host to port 3000 in the container.
    - `-e`: Set environment variables.
    - `--name`: Assign a name to the container.
    - `-v`: Mount named volumes to persist data.

---

## 📖 API Documentation

This project includes interactive API documentation powered by Swagger UI and a pre-configured Postman collection to make testing and integration as easy as possible.

### **Swagger UI**

Once the server is running, you can access the interactive Swagger UI in your browser. This interface allows you to view all available endpoints, see their parameters, and test them live.

-   **URL**: [http://localhost:3000/api-docs](http://localhost:3000/api-docs)

When you open the Swagger UI, the `X-MASTER-KEY` will be pre-authorized with the default value (`SUPER_SECRET_KEY` or the value from your `.env` file), so you can start making requests to the protected endpoints immediately.

### **Postman Collection**

A Postman collection is included in the root of this project to help you get started quickly.

1.  **Import the Collection**:
    -   Find the `whatsapp_api_collection.json` file in the project's root directory.
    -   In Postman, click **Import** and upload the file.

2.  **Configure Environment (Optional)**:
    -   The collection comes with a pre-request script that automatically adds the `X-MASTER-KEY` header to every request.
    -   By default, it uses `SUPER_SECRET_KEY`. To use your own key, create a new Postman Environment, add a variable named `MASTER_API_KEY`, and set its value to your key from the `.env` file.

All endpoints are prefixed with `/api`.

### **Authentication**

This API uses a two-key system for security and session management. Both keys can be provided in either the request header or the request body for `POST` requests, giving you more flexibility. For `GET` requests, they must be in the header.

1.  **Master Key (`X-MASTER-KEY`)**:
    -   This is a global key that grants access to the entire API server.
    -   It can be included in the `X-MASTER-KEY` header or as a field in the JSON request body. The header will always take precedence if both are provided.
    -   This is the key you set in your `.env` file.

2.  **Session Key (`X-API-KEY`)**:
    -   This key identifies a specific WhatsApp session (i.e., a specific phone number).
    -   For `POST` requests, it can be in the `X-API-KEY` header or a field in the JSON/form-data body.
    -   For `GET` requests, it must be in the `X-API-KEY` header.
    -   You can invent any unique string for each session (e.g., `user1_phone`, `work_account`, a random hash, etc.).
    -   The first time a new `X-API-KEY` is used with the `/connect` endpoint, a new session will be created for it.

---

## 📲 Connecting a Session

To use a WhatsApp account, you must first connect it to a session key.

1.  Choose a unique `X-API-KEY` for the account you want to connect (e.g., `my-personal-whatsapp`).
2.  Make a request to one of the connection endpoints with both the master key and your chosen session key. The server will generate a QR code for that specific session.

    -   **GET `/api/connect`**: Returns the QR code as a string.
    -   **GET `/api/connect/image`**: Returns the QR code as a PNG image.

3.  Open WhatsApp on your phone, go to **Settings > Linked Devices**, and scan the QR code.

Once connected, the server will save the session data in the `./sessions` folder. You won't need to scan the code again for this session unless you log out. Repeat this process for each WhatsApp account you want to use, assigning a different `X-API-KEY` to each.

---

## **Endpoints**

#### 1. **Get Connection Status / QR Code**

-   **Endpoint**: `GET /connect`
-   **Description**: Get the current connection status for a session. If a QR code is available, it will be returned as a string. If not, the session status is returned.
-   **Headers**:
    -   `X-MASTER-KEY: your_global_master_key_here`
    -   `X-API-KEY: your_unique_session_key`
-   **Response (When QR is ready)**: `200 OK` with the QR string in the body.
-   **Response (When connected)**: `200 OK`
    ```json
    {
      "sessionId": "your_unique_session_key",
      "status": "Connected"
    }
    ```

#### 2. **Get QR Code as Image**

-   **Endpoint**: `GET /connect/image`
-   **Description**: Get the session's QR code as a PNG image.
-   **Headers**:
    -   `X-MASTER-KEY: your_global_master_key_here`
    -   `X-API-KEY: your_unique_session_key`
-   **Response**: `200 OK` with `Content-Type: image/png`.

#### 3. **Upload an Attachment (for later use)**

-   **Endpoint**: `POST /upload`
-   **Description**: Upload a file to get a temporary URL. The URL is valid for 5 minutes and can be used in the `/send` or `/send-attachment` (URL method) endpoints.
-   **Headers**: `X-MASTER-KEY: your_global_master_key_here`
-   **Body**: `multipart/form-data` with a single field named `file`.
-   **Response**:
    ```json
    {
        "message": "File uploaded successfully.",
        "url": "http://localhost:3000/uploads/1678886400000-123456789.jpg"
    }
    ```
-   **Example `curl` Request**:
    ```bash
    curl -X POST http://localhost:3000/api/upload \
    -H "X-MASTER-KEY: your_global_master_key_here" \
    -F "file=@/path/to/your/image.jpg"
    ```

#### 4. **Send Message (Simple GET)**

-   **Endpoint**: `GET /send`
-   **Description**: A simple GET request to send a text message or an attachment via URL.
-   **Headers**:
    -   `X-MASTER-KEY: your_global_master_key_here`
    -   `X-API-KEY: your_unique_session_key`
-   **Query Parameters**:
    -   `number`: The recipient's phone number (e.g., `+1234567890`).
    -   `message`: The text message to send.
    -   `attachmentUrl` (optional): A URL to a file to send as an attachment. The `message` will be used as the caption.
-   **Example `curl` Request**:
    ```bash
    curl "http://localhost:3000/api/send?number=+1234567890&message=Hello&attachmentUrl=http://localhost:3000/uploads/file.jpg" \
    -H "X-MASTER-KEY: your_global_master_key_here" \
    -H "X-API-KEY: your_unique_session_key"
    ```

#### 5. **Send Text Message (POST)**

-   **Endpoint**: `POST /send-message`
-   **Headers**: `X-MASTER-KEY: your_global_master_key_here`
-   **Description**: Sends a plain text message. The `X-API-KEY` can be in the header or, as shown below, in the request body.
-   **Payload**: `application/json`
    ```json
    {
      "X-API-KEY": "your_unique_session_key",
      "to": "+1234567890",
      "message": "Hello from the API!"
    }
    ```

#### 6. **Send Attachment (POST)**

-   **Endpoint**: `POST /send-attachment`
-   **Description**: Sends an attachment to a specified number. This endpoint supports three methods: direct file upload, from a URL, or from a Base64 string.
-   **Headers**: `X-MASTER-KEY: your_global_master_key_here`

---

##### **Method 1: Direct File Upload**

-   **Content-Type**: `multipart/form-data`
-   **Description**: The `X-API-KEY` can be in the header or, as shown below, as a form field.
-   **Body Fields**:
    -   `X-API-KEY`: Your unique session key.
    -   `to`: The recipient's phone number.
    -   `file`: The file to be sent.
    -   `caption` (optional): A caption for the file.
-   **Example `curl` Request**:
    ```bash
    curl -X POST http://localhost:3000/api/send-attachment \
    -H "X-MASTER-KEY: your_global_master_key_here" \
    -F "X-API-KEY=your_unique_session_key" \
    -F "to=+1234567890" \
    -F "file=@/path/to/your/document.pdf" \
    -F "caption=Here is the document you requested."
    ```

---

##### **Method 2: From URL or Base64**

-   **Content-Type**: `application/json`
-   **Description**: The `X-API-KEY` can be in the header or, as shown below, in the request body.
-   **Payload**:
    ```json
    {
      "X-API-KEY": "your_unique_session_key",
      "to": "+1234567890",
      "file": "url_or_base64_string",
      "type": "image/png", // Required only for Base64
      "caption": "Optional caption"
    }
    ```
-   **Notes**:
    -   If `file` is a URL, the server will download it.
    -   If `file` is a Base64 string, you **must** provide the correct `type` (MIME type).
-   **Example `curl` Request (URL)**:
    ```bash
    curl -X POST http://localhost:3000/api/send-attachment \
    -H "Content-Type: application/json" \
    -H "X-MASTER-KEY: your_global_master_key_here" \
    -d '{"X-API-KEY": "your_unique_session_key", "to": "+1234567890", "file": "https://i.imgur.com/some-image.jpeg", "caption": "From a URL"}'
    ```

---

## ⚠️ Limitations

-   You must keep your phone connected to the internet for the API to work.
-   This API uses an unofficial library (`whatsapp-web.js`), which may have a risk of your number being banned by WhatsApp if used for spamming. Use responsibly.
-   This API only supports sending messages and does not handle incoming messages or webhooks.