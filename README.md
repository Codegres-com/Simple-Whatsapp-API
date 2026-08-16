# Simple WhatsApp API

Una API multi-sesión y fácil de desplegar que te permite enviar mensajes de texto y archivos adjuntos desde múltiples cuentas de WhatsApp con una configuración mínima.

## Características

- **Soporte multi-sesión**: Conecta y gestiona varias cuentas de WhatsApp simultáneamente. Cada sesión está vinculada a su propia clave API única.
- **Inicio de sesión sencillo**: Escanea un código QR una sola vez por sesión para conectar tu cuenta de WhatsApp.
- **Sesiones persistentes**: Las sesiones se guardan localmente, por lo que el servidor puede reiniciarse sin necesidad de volver a iniciar sesión.
- **Desvinculación limpia (Logout)**: Endpoint para cerrar sesión que revoca las credenciales de WhatsApp en el servidor y las elimina del teléfono.
- **Depuración automática de sesiones abandonadas**: Endpoint para limpiar sesiones inactivas según un umbral de días.
- **Protección Anti-Spam integrada**: Pausas automáticas configurables entre envíos, límite de mensajes por minuto y cuota máxima diaria por sesión.
- **Soporte de Múltiples Claves Maestras por Aplicación**: Asigna claves maestras únicas por sistema (ej. Ventas, CRM) para rastrear el uso.
- **Logs de acceso diarios por zona horaria**: Registra accesos y peticiones en logs diarios rotativos (`logs/access-YYYY-MM-DD.log`) configurados en horario local (ej. Guatemala `America/Guatemala`).
- **Envío de mensajes de texto**: Un endpoint simple para enviar mensajes de texto plano desde una sesión específica.
- **Envío de archivos adjuntos**: Envía imágenes, videos o documentos directamente mediante carga de archivos, URL o una cadena codificada en Base64.
- **Carga de archivos**: Un endpoint dedicado para subir archivos y recibir una URL temporal, ideal para enviarlos como adjuntos más tarde.
- **Seguridad**:
    - Protege todo el servidor con una o varias **Claves API maestras**.
    - Gestiona sesiones individuales de WhatsApp con una **Clave API** por sesión.
- **Códigos QR dinámicos**: Obtén el código QR de inicio de sesión de cualquier sesión como cadena de texto o imagen PNG mediante endpoints de la API.

---

## 🚀 Primeros pasos

### **Requisitos previos**

- [Node.js](https://nodejs.org/) (se recomienda v16 o superior)
- Una o más cuentas de WhatsApp

### **1. Clonar e instalar dependencias**

```bash
git clone https://github.com/Codegres-com/Simple-Whatsapp-API.git
cd Simple-Whatsapp-API
npm install
```

### **2. Configurar el entorno**

Crea un archivo `.env` en la raíz del proyecto y añade la configuración deseada:

```env
# .env

# Claves maestras por aplicación (Formato clave:NombreAplicacion separadas por coma)
MASTER_API_KEYS=key_ventas:SistemaVentas,key_crm:ModuloCRM,Chimpanzee24.gt:AppPrincipal

# Compatibilidad con clave única legacy
MASTER_API_KEY=Chimpanzee24.gt

PORT=3000

# Configuración personalizada de Swagger UI
SWAGGER_TITLE=Mi API Personalizada
SWAGGER_DESCRIPTION=Servicio de integración para el envío de mensajes de WhatsApp.
SERVER_URL=http://localhost:3000

# Registro de logs diarios (1 = activado, 0 = desactivado)
ENABLE_LOGS=1
TIMEZONE=America/Guatemala

# Protección Anti-Spam por Sesión
RATE_LIMIT_PER_MINUTE=15      # Máximo mensajes por minuto por sesión (0 desactiva)
MESSAGE_DELAY_MS=2000         # Pausa entre mensajes en milisegundos (2000 = 2s)
DAILY_MESSAGE_LIMIT=500       # Límite diario por sesión (0 desactiva)
```

### **3. Iniciar el servidor**

```bash
npm start
```

---

## 🐳 Ejecución con Docker

También puedes ejecutar esta aplicación con Docker y Docker Compose para un entorno más aislado y reproducible.

### **1. Usar Docker Compose (recomendado)**

Es la forma más sencilla de empezar.

1.  **Crear un archivo de entorno**:
    Crea un archivo `.env` en la raíz del proyecto. Este archivo será usado por Docker Compose para establecer las variables de entorno dentro del contenedor.

    ```
    # .env

    # La clave maestra para proteger el servidor
    MASTER_API_KEY=yoursecretkey

    # El puerto en el que se ejecutará el servidor (opcional, por defecto 3000)
    PORT=3000
    ```

2.  **Construir y ejecutar el contenedor**:
    Ejecuta el siguiente comando para construir la imagen de Docker e iniciar el contenedor en segundo plano:

    ```bash
    docker compose up --build -d
    ```

    El servidor estará ejecutándose en el puerto que hayas especificado (o el predeterminado, 3000).

3.  **Para detener el servidor**:
    ```bash
    docker compose down
    ```

### **2. Usar la imagen preconstruida de Docker Hub**

Si no quieres construir la imagen desde el código fuente, puedes usar la imagen preconstruida de Docker Hub.

1.  **Descargar la imagen**:
    ```bash
    docker pull codegres/simple-whatsapp-api:latest
    ```

2.  **Ejecutar la imagen**:
    Aún necesitas proporcionar las variables de entorno y montar los volúmenes.

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

### **3. Usar Docker (construcción manual)**

Si prefieres no usar Docker Compose, puedes construir y ejecutar el contenedor manualmente.

1.  **Construir la imagen de Docker**:
    ```bash
    docker build -t whatsapp-api .
    ```

2.  **Ejecutar el contenedor de Docker**:
    Debes pasar la `MASTER_API_KEY` y mapear el puerto. También necesitas crear y montar volúmenes para persistir los datos de `sessions` y `uploads`.

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
    - `-d`: Ejecutar en modo detached (segundo plano).
    - `-p`: Mapear el puerto 3000 del host al puerto 3000 del contenedor.
    - `-e`: Establecer variables de entorno.
    - `--name`: Asignar un nombre al contenedor.
    - `-v`: Montar volúmenes con nombre para persistir los datos.

---

## 📖 Documentación de la API

Este proyecto incluye documentación interactiva de la API con Swagger UI y una colección de Postman preconfigurada para facilitar las pruebas y la integración.

### **Swagger UI**

Una vez que el servidor esté en ejecución, puedes acceder a la interfaz interactiva de Swagger UI en tu navegador. Esta interfaz te permite ver todos los endpoints disponibles, consultar sus parámetros y probarlos en vivo.

-   **URL**: [http://localhost:3000/api-docs](http://localhost:3000/api-docs)

Al abrir Swagger UI, la `X-MASTER-KEY` estará preautorizada con el valor predeterminado (`SUPER_SECRET_KEY` o el valor de tu archivo `.env`), para que puedas empezar a hacer peticiones a los endpoints protegidos de inmediato.

### **Colección de Postman**

En la raíz de este proyecto se incluye una colección de Postman para ayudarte a empezar rápidamente.

1.  **Importar la colección**:
    -   Encuentra el archivo `whatsapp_api_collection.json` en el directorio raíz del proyecto.
    -   En Postman, haz clic en **Import** y sube el archivo.

2.  **Configurar el entorno (opcional)**:
    -   La colección incluye un script de pre-solicitud que añade automáticamente el encabezado `X-MASTER-KEY` a cada petición.
    -   Por defecto, usa `SUPER_SECRET_KEY`. Para usar tu propia clave, crea un nuevo entorno de Postman, añade una variable llamada `MASTER_API_KEY` y establece su valor con la clave de tu archivo `.env`.

Todos los endpoints tienen el prefijo `/api`.

### **Autenticación**

Esta API utiliza un sistema de dos claves para la seguridad y la gestión de sesiones. Ambas claves pueden proporcionarse en el encabezado de la petición o en el cuerpo de las peticiones `POST`, lo que te da más flexibilidad. En las peticiones `GET`, deben ir en el encabezado.

1.  **Clave maestra (`X-MASTER-KEY`)**:
    -   Es una clave global que concede acceso a todo el servidor de la API.
    -   Puede incluirse en el encabezado `X-MASTER-KEY` o como campo en el cuerpo JSON de la petición. El encabezado siempre tendrá prioridad si se proporcionan ambos.
    -   Es la clave que configuras en tu archivo `.env`.

2.  **Clave de sesión (`X-API-KEY`)**:
    -   Esta clave identifica una sesión específica de WhatsApp (es decir, un número de teléfono concreto).
    -   En las peticiones `POST`, puede ir en el encabezado `X-API-KEY` o como campo en el cuerpo JSON/form-data.
    -   En las peticiones `GET`, debe ir en el encabezado `X-API-KEY`.
    -   Puedes inventar cualquier cadena única para cada sesión (por ejemplo, `user1_phone`, `work_account`, un hash aleatorio, etc.).
    -   La primera vez que se use una nueva `X-API-KEY` con el endpoint `/connect`, se creará una nueva sesión para ella.

---

## 📲 Conectar una sesión

Para usar una cuenta de WhatsApp, primero debes conectarla a una clave de sesión.

1.  Elige una `X-API-KEY` única para la cuenta que quieras conectar (por ejemplo, `my-personal-whatsapp`).
2.  Haz una petición a uno de los endpoints de conexión con la clave maestra y la clave de sesión elegida. El servidor generará un código QR para esa sesión específica.

    -   **GET `/api/connect`**: Devuelve el código QR como cadena de texto.
    -   **GET `/api/connect/image`**: Devuelve el código QR como imagen PNG.

3.  Abre WhatsApp en tu teléfono, ve a **Ajustes > Dispositivos vinculados** y escanea el código QR.

Una vez conectado, el servidor guardará los datos de la sesión en la carpeta `./sessions`. No necesitarás volver a escanear el código para esta sesión a menos que cierres sesión. Repite este proceso para cada cuenta de WhatsApp que quieras usar, asignando una `X-API-KEY` diferente a cada una.

---

## **Endpoints**

#### 1. **Obtener estado de conexión / código QR**

-   **Endpoint**: `GET /connect`
-   **Descripción**: Obtiene el estado de conexión actual de una sesión. Si hay un código QR disponible, se devolverá como cadena de texto. Si no, se devuelve el estado de la sesión.
-   **Encabezados**:
    -   `X-MASTER-KEY: your_global_master_key_here`
    -   `X-API-KEY: your_unique_session_key`
-   **Respuesta (cuando el QR está listo)**: `200 OK` con la cadena del QR en el cuerpo.
-   **Respuesta (cuando está conectado)**: `200 OK`
    ```json
    {
      "sessionId": "your_unique_session_key",
      "status": "Connected"
    }
    ```

#### 2. **Obtener código QR como imagen**

-   **Endpoint**: `GET /connect/image`
-   **Descripción**: Obtiene el código QR de la sesión como imagen PNG.
-   **Encabezados**:
    -   `X-MASTER-KEY: your_global_master_key_here`
    -   `X-API-KEY: your_unique_session_key`
-   **Respuesta**: `200 OK` con `Content-Type: image/png`.

#### 3. **Cerrar sesión de una cuenta (Logout)**

-   **Endpoint**: `POST /logout`
-   **Descripción**: Cierra la sesión activa de WhatsApp desvinculando el dispositivo del teléfono y elimina los datos locales.
-   **Encabezados**:
    -   `X-MASTER-KEY: your_global_master_key_here`
    -   `X-API-KEY: your_unique_session_key`
-   **Respuesta**:
    ```json
    {
      "message": "Session logged out and deleted successfully."
    }
    ```

#### 4. **Cerrar todas las sesiones (Logout All)**

-   **Endpoint**: `POST /logout-all`
-   **Descripción**: Cierra y desvincula todas las sesiones de WhatsApp del servidor.
-   **Encabezados**: `X-MASTER-KEY: your_global_master_key_here`
-   **Respuesta**:
    ```json
    {
      "message": "All sessions logged out and deleted successfully."
    }
    ```

#### 5. **Depurar sesiones abandonadas**

-   **Endpoint**: `POST /cleanup-inactive`
-   **Descripción**: Desvincula y elimina sesiones inactivas según el umbral de días indicado.
-   **Encabezados**: `X-MASTER-KEY: your_global_master_key_here`
-   **Parámetros de consulta** (opcional): `days` (por defecto `7`).
-   **Respuesta**:
    ```json
    {
      "success": true,
      "message": "Cleanup completed. Removed 2 inactive session(s) older than 7 day(s).",
      "cleanedCount": 2,
      "cleanedSessions": ["session1", "session2"],
      "thresholdDays": 7
    }
    ```

#### 6. **Subir un archivo adjunto (para uso posterior)**

-   **Endpoint**: `POST /upload`
-   **Descripción**: Sube un archivo para obtener una URL temporal. La URL es válida durante 5 minutos y puede usarse en los endpoints `/send` o `/send-attachment` (método por URL).
-   **Encabezados**: `X-MASTER-KEY: your_global_master_key_here`
-   **Cuerpo**: `multipart/form-data` con un único campo llamado `file`.
-   **Respuesta**:
    ```json
    {
        "message": "File uploaded successfully.",
        "url": "http://localhost:3000/uploads/1678886400000-123456789.jpg"
    }
    ```
-   **Ejemplo de petición con `curl`**:
    ```bash
    curl -X POST http://localhost:3000/api/upload \
    -H "X-MASTER-KEY: your_global_master_key_here" \
    -F "file=@/path/to/your/image.jpg"
    ```

#### 4. **Limpiar archivos adjuntos temporales**

-   **Endpoint**: `POST /upload/cleanup`
-   **Descripción**: Depura y elimina permanentemente los archivos temporales subidos a la carpeta `uploads/` que superen un umbral de tiempo en minutos.
-   **Encabezados**: `X-MASTER-KEY: your_global_master_key_here`
-   **Parámetros de consulta** (opcional):
    -   `minutes`: Umbral en minutos (por defecto `5` o el valor configurado en `UPLOAD_FILE_TTL_MINUTES`).
-   **Respuesta**:
    ```json
    {
      "success": true,
      "message": "Cleanup completed. Removed 2 file(s) older than 5 minute(s).",
      "cleanedCount": 2,
      "cleanedFiles": ["1678886400000-sample1.jpg", "1678886400000-sample2.pdf"],
      "thresholdMinutes": 5
    }
    ```

#### 5. **Enviar mensaje (GET simple)**

-   **Endpoint**: `GET /send`
-   **Descripción**: Una petición GET simple para enviar un mensaje de texto o un archivo adjunto mediante URL.
-   **Encabezados**:
    -   `X-MASTER-KEY: your_global_master_key_here`
    -   `X-API-KEY: your_unique_session_key`
-   **Parámetros de consulta**:
    -   `number`: El número de teléfono del destinatario (por ejemplo, `+1234567890`).
    -   `message`: El mensaje de texto a enviar.
    -   `attachmentUrl` (opcional): Una URL de un archivo para enviar como adjunto. El `message` se usará como pie de foto.
-   **Ejemplo de petición con `curl`**:
    ```bash
    curl "http://localhost:3000/api/send?number=+1234567890&message=Hello&attachmentUrl=http://localhost:3000/uploads/file.jpg" \
    -H "X-MASTER-KEY: your_global_master_key_here" \
    -H "X-API-KEY: your_unique_session_key"
    ```

#### 5. **Enviar mensaje de texto (POST)**

-   **Endpoint**: `POST /send-message`
-   **Encabezados**: `X-MASTER-KEY: your_global_master_key_here`
-   **Descripción**: Envía un mensaje de texto plano. La `X-API-KEY` puede ir en el encabezado o, como se muestra abajo, en el cuerpo de la petición.
-   **Carga útil**: `application/json`
    ```json
    {
      "X-API-KEY": "your_unique_session_key",
      "to": "+1234567890",
      "message": "Hello from the API!"
    }
    ```

#### 6. **Enviar archivo adjunto (POST)**

-   **Endpoint**: `POST /send-attachment`
-   **Descripción**: Envía un archivo adjunto a un número especificado. Este endpoint admite tres métodos: carga directa de archivo, desde una URL o desde una cadena Base64.
-   **Encabezados**: `X-MASTER-KEY: your_global_master_key_here`

---

##### **Método 1: Carga directa de archivo**

-   **Content-Type**: `multipart/form-data`
-   **Descripción**: La `X-API-KEY` puede ir en el encabezado o, como se muestra abajo, como campo del formulario.
-   **Campos del cuerpo**:
    -   `X-API-KEY`: Tu clave de sesión única.
    -   `to`: El número de teléfono del destinatario.
    -   `file`: El archivo a enviar.
    -   `caption` (opcional): Un pie de foto para el archivo.
-   **Ejemplo de petición con `curl`**:
    ```bash
    curl -X POST http://localhost:3000/api/send-attachment \
    -H "X-MASTER-KEY: your_global_master_key_here" \
    -F "X-API-KEY=your_unique_session_key" \
    -F "to=+1234567890" \
    -F "file=@/path/to/your/document.pdf" \
    -F "caption=Here is the document you requested."
    ```

---

##### **Método 2: Desde URL o Base64**

-   **Content-Type**: `application/json`
-   **Descripción**: La `X-API-KEY` puede ir en el encabezado o, como se muestra abajo, en el cuerpo de la petición.
-   **Carga útil**:
    ```json
    {
      "X-API-KEY": "your_unique_session_key",
      "to": "+1234567890",
      "file": "url_or_base64_string",
      "type": "image/png", // Obligatorio solo para Base64
      "caption": "Optional caption"
    }
    ```
-   **Notas**:
    -   Si `file` es una URL, el servidor la descargará.
    -   Si `file` es una cadena Base64, **debes** proporcionar el `type` correcto (tipo MIME).
-   **Ejemplo de petición con `curl` (URL)**:
    ```bash
    curl -X POST http://localhost:3000/api/send-attachment \
    -H "Content-Type: application/json" \
    -H "X-MASTER-KEY: your_global_master_key_here" \
    -d '{"X-API-KEY": "your_unique_session_key", "to": "+1234567890", "file": "https://i.imgur.com/some-image.jpeg", "caption": "From a URL"}'
    ```

---

## ⚠️ Limitaciones

-   Debes mantener tu teléfono conectado a internet para que la API funcione.
-   Esta API utiliza una biblioteca no oficial (`whatsapp-web.js`), que puede conllevar el riesgo de que WhatsApp bloquee tu número si se usa para enviar spam. Úsala con responsabilidad.
-   Esta API solo admite el envío de mensajes y no gestiona mensajes entrantes ni webhooks.
