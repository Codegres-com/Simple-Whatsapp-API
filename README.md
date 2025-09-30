# Simple-Whatsapp-API
Simple Whatsapp API - Just connect with QR and start sending messages instantly.


# 📌 Feature List: Client-Side WhatsApp API (Single Account per User)

## 1. **Authentication & Session**

* **User Authentication** – Users must log in (via email/password, OAuth, or token) before accessing the WhatsApp API.
* **Single WhatsApp Connection per User** – Each authenticated user can connect **only one WhatsApp account**.
* **Persistent Session Storage** – Store WhatsApp Web session locally (IndexedDB, localStorage, or file) to maintain login across page reloads.
* **Automatic Session Restore** – Reconnect to the same WhatsApp account using the stored session.
* **Logout / Reset Connection** – User can disconnect WhatsApp and clear session to reconnect a different account.

---

## 2. **Messaging**

* **Send Text Messages** – Send messages to any WhatsApp contact using phone numbers.
* **Send Attachments** – Support sending images, videos, audio, PDFs, or other document types.
* **Optional Captions** – Add captions when sending media.

---

## 3. **Client-Side API**

* **Simple Client Functions** – Example functions:

  * `sendMessage(userToken, to, message)`
  * `sendAttachment(userToken, to, file, caption)`
* **Promise-based / Async API** – Allows smooth integration in front-end applications.
* **Event Callbacks** – Notify client app when a message is sent, failed, or queued.

---

## 4. **UI / Developer Tools**

* **Login / Auth Interface** – Simple user login and token management.
* **WhatsApp Connection Interface** – QR code scan for initial authentication, session status display.
* **Send Interface** – Input fields for recipient number, message, file upload, and send button.
* **Debug Console** – Shows session status, message logs, and errors.

---

## 5. **Hosting & Deployment**

* **Static Hosting Compatible** – Works on platforms like Netlify or Vercel.
* **Fully Client-Side** – All WhatsApp interactions happen on the user’s device; no server required.
* **Cross-Platform Support** – Works in desktop and mobile browsers.

---

## 6. **Security & Privacy**

* **Session Stored Locally** – Session data is encrypted in local storage to prevent unauthorized access.
* **Token-Based Authentication** – Only authenticated users can access the API and send messages.
* **Logout / Session Clear** – Users can revoke WhatsApp connection and authentication token.

---

## 7. **Limitations & Notes**

* Phone must remain connected to WhatsApp Web.
* Only sending messages is supported; receiving messages is optional.
* Each user can only connect **one WhatsApp account** at a time.
* Using unofficial Web API → risk of temporary ban if abused.
* File uploads may require conversion to base64 or external hosting for static environments.

---

