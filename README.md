# Simple WhatsApp API

A single-purpose, easy-to-deploy API that allows you to send text messages and attachments from a normal WhatsApp account with minimal setup.

## Features

- **Easy Login**: Scan a QR code just once to connect your WhatsApp account.
- **Persistent Session**: The session is saved locally, so the server can be restarted without needing to log in again.
- **Send Text Messages**: A simple endpoint to send plain text messages.
- **Send Attachments**: Send images, videos, or documents using either a URL or a Base64 encoded string.
- **Secure**: Protect your sending endpoints with a configurable API key.
- **Dynamic QR Codes**: Fetch the login QR code as a string or a PNG image via API endpoints.

---

## 🚀 Getting Started

### **Prerequisites**

- [Node.js](https://nodejs.org/) (v16 or higher recommended)
- A WhatsApp account

### **1. Clone and Install Dependencies**

```bash
git clone https://github.com/Codegres-com/Simple-Whatsapp-API.git
cd Simple-Whatsapp-API
npm install
```

### **2. Configure Your Environment**

Create a `.env` file in the root of the project and add your secret API key.

```
# .env
API_KEY=your_secret_api_key_here
```

Replace `your_secret_api_key_here` with a strong, private key of your choice.

### **3. Start the Server**

```bash
npm start
```

This command will be configured in `package.json` to run `node src/index.js`.

---

## 📲 Connecting Your Account

On the first run, you need to link your WhatsApp account by scanning a QR code.

1.  When the server starts, it will generate a QR code.
2.  You can get this QR code from one of the following endpoints:

    -   **GET `/api/connect`**: Returns the QR code as a string.
    -   **GET `/api/connect/image`**: Returns the QR code as a PNG image.

3.  Open WhatsApp on your phone, go to **Settings > Linked Devices**, and scan the QR code.

Once connected, the server will save a `session.json` file, and you won't need to scan the code again unless you log out.

---

## 📖 API Documentation

All endpoints are prefixed with `/api`.

### **Authentication**

The following endpoints require an API key to be sent in the `X-API-KEY` header:
- `POST /send-message`
- `POST /send-attachment`

### **Endpoints**

#### 1. **Get Connection Status / QR Code**

-   **Endpoint**: `GET /connect`
-   **Description**: Get the current connection status. If a QR code is available for scanning, it will be returned as a string.
-   **Response (When QR is ready)**: `200 OK` with the QR string in the body.
-   **Response (When connected)**: `200 OK`
    ```json
    {
      "status": "Connected"
    }
    ```

#### 2. **Get QR Code as Image**

-   **Endpoint**: `GET /connect/image`
-   **Description**: Get the QR code as a PNG image, which you can display directly in a web browser or save as a file.
-   **Response**: `200 OK` with `Content-Type: image/png`.

#### 3. **Send Text Message**

-   **Endpoint**: `POST /send-message`
-   **Headers**: `X-API-KEY: your_secret_api_key_here`
-   **Payload**:
    ```json
    {
      "to": "+1234567890",
      "message": "Hello from the API!"
    }
    ```
-   **Example `curl` Request**:
    ```bash
    curl -X POST http://localhost:3000/api/send-message \
    -H "Content-Type: application/json" \
    -H "X-API-KEY: your_secret_api_key_here" \
    -d '{"to": "+1234567890", "message": "Hello World"}'
    ```

#### 4. **Send Attachment**

-   **Endpoint**: `POST /send-attachment`
-   **Headers**: `X-API-KEY: your_secret_api_key_here`
-   **Payload**:
    ```json
    {
      "to": "+1234567890",
      "file": "base64_encoded_file_or_url",
      "type": "image/png | video/mp4 | etc.",
      "caption": "Optional: Check out this file!"
    }
    ```
-   **Notes**:
    -   If `file` is a URL, the server will download it.
    -   If `file` is a Base64 string, you **must** provide the correct `type` (MIME type).
-   **Example `curl` Request (URL)**:
    ```bash
    curl -X POST http://localhost:3000/api/send-attachment \
    -H "Content-Type: application/json" \
    -H "X-API-KEY: your_secret_api_key_here" \
    -d '{"to": "+1234567890", "file": "https://i.imgur.com/some-image.jpeg", "caption": "From a URL"}'
    ```
-   **Example `curl` Request (Base64)**:
    ```bash
    curl -X POST http://localhost:3000/api/send-attachment \
    -H "Content-Type: application/json" \
    -H "X-API-KEY: your_secret_api_key_here" \
    -d '{"to": "+1234567890", "file": "data:image/png;base64,iVBORw0KGgo...", "type": "image/png", "caption": "From Base64"}'
    ```

---

## ⚠️ Limitations

-   You must keep your phone connected to the internet for the API to work.
-   This API uses an unofficial library (`whatsapp-web.js`), which may have a risk of your number being banned by WhatsApp if used for spamming. Use responsibly.
-   This API only supports sending messages and does not handle incoming messages or webhooks.