# 🕒 Timeframe

An interactive AI-powered application that allows you to have conversations with a virtual Lincoln using your webcam and microphone.

---

## 📑 Table of Contents

1. [Overview](#overview)
2. [System Requirements](#system-requirements)
3. [Part 1: One-Time Setup](#part-1-one-time-setup)
   - [Step 1: Install Required Software](#step-1-install-required-software)
   - [Step 2: Download the Face Detection Model](#step-2-download-the-face-detection-model)
   - [Step 3: Configure Microsoft Edge Browser](#step-3-configure-microsoft-edge-browser)
4. [Part 2: Server Setup](#part-2-server-setup)
   - [Step 1: Open the Server Folder](#step-1-open-the-server-folder)
   - [Step 2: Create a Virtual Environment](#step-2-create-a-virtual-environment)
   - [Step 3: Activate the Virtual Environment](#step-3-activate-the-virtual-environment)
   - [Step 4: Install Python Dependencies](#step-4-install-python-dependencies)
   - [Step 5: Create the Server Environment File](#step-5-create-the-server-environment-file)
5. [Part 3: Client Setup](#part-3-client-setup)
   - [Step 1: Open the Client Folder](#step-1-open-the-client-folder)
   - [Step 2: Install Node.js Dependencies](#step-2-install-nodejs-dependencies)
   - [Step 3: Create the Client Environment File](#step-3-create-the-client-environment-file)
6. [Part 4: Running the Application](#part-4-running-the-application)
   - [Step 1: Start the Server](#step-1-start-the-server)
   - [Step 2: Start the Client](#step-2-start-the-client)
   - [Step 3: Open the Application in Edge](#step-3-open-the-application-in-edge)
   - [Step 4: Start Interacting](#step-4-start-interacting)
7. [Troubleshooting](#troubleshooting)

---

## Overview

Timeframe is an interactive application that uses:
- **Face detection** to identify when you're looking at the screen
- **Speech recognition** to understand what you say
- **AI language models** to generate intelligent responses
- **Video streaming** to display an animated virtual Lincoln

---

## System Requirements

Before you begin, make sure your computer meets these requirements:

| Requirement | Details |
|-------------|---------|
| **Operating System** | Windows 10/11, macOS, or Linux |
| **Webcam** | Built-in or external webcam |
| **Microphone** | Built-in or external microphone |
| **Browser** | Microsoft Edge (required) |
| **Internet Connection** | Required for AI services |

---

## Part 1: One-Time Setup

These steps only need to be completed once when setting up the project for the first time.

### Step 1: Install Required Software

You need to install two programs on your computer:

#### 1.1 Install Python 3.10

> ⚠️ **Important:** You must install Python version **3.10** specifically. Other versions may not work correctly.

1. Open your web browser
2. Go to: https://www.python.org/downloads/release/python-31011/
3. Scroll down to the **Files** section
4. Download the appropriate installer for your system:
   - **Windows:** Click on `Windows installer (64-bit)`
   - **macOS:** Click on `macOS 64-bit universal2 installer`
5. Run the downloaded installer
6. **Windows users:** ✅ Check the box that says **"Add Python 3.10 to PATH"** before clicking Install
7. Click **Install Now** and wait for the installation to complete
8. Click **Close** when finished

**To verify the installation:**
1. Open a terminal:
   - **Windows:** Press `Win + R`, type `cmd`, and press Enter
   - **macOS:** Press `Cmd + Space`, type `Terminal`, and press Enter
2. Type the following command and press Enter:
   ```
   python --version
   ```
3. You should see `Python 3.10.x` displayed

#### 1.2 Install Node.js and npm

1. Open your web browser
2. Go to: https://nodejs.org/en/download
3. Download the appropriate installer for your system:
   - **Windows:** Click on `Windows Installer (.msi)`
   - **macOS:** Click on `macOS Installer (.pkg)`
4. Run the downloaded installer
5. Follow the installation wizard, accepting all default options
6. Click **Finish** when complete

**To verify the installation:**
1. Open a new terminal window
2. Type the following command and press Enter:
   ```
   npm --version
   ```
3. You should see a version number displayed (e.g., `10.2.0`)

#### 1.3 macOS Only: Install PortAudio

If you are using a Mac, you need to install PortAudio:

1. First, install Homebrew if you don't have it. Open Terminal and run:
   ```
   /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
   ```
2. Once Homebrew is installed, run:
   ```
   brew install portaudio
   ```

---

### Step 2: Download the Face Detection Model

The application needs a special file to detect faces through your webcam.

1. Click this link to download the file: [yolov8n-face.pt](https://github.com/akanametov/yolo-face/releases/download/v0.0.0/yolov8n-face.pt)
2. Your browser will download a file named `yolov8n-face.pt`
3. Locate the downloaded file (usually in your `Downloads` folder)
4. Move or copy the file into the `server` folder of this project
   - The final location should be: `timeframe-prod/server/yolov8n-face.pt`

---

### Step 3: Configure Microsoft Edge Browser

The application requires Microsoft Edge with specific settings enabled.

1. Open **Microsoft Edge**
2. In the address bar, type the following and press Enter:
   ```
   edge://settings/content/mediaAutoplay
   ```
3. Click **Add** next to "Allow"
4. Type `http://localhost:5173` and click **Add**
5. Close the settings tab

> 💡 This allows the application to automatically play audio and video.

---

## Part 2: Server Setup

The server handles face detection, speech recognition, and AI responses.

### Step 1: Open the Server Folder

#### Windows:
1. Open **File Explorer**
2. Navigate to the `timeframe-prod` project folder
3. Open the `server` folder
4. Click on the address bar at the top
5. Type `cmd` and press Enter
   - This opens a terminal in the server folder

#### macOS/Linux:
1. Open **Terminal**
2. Navigate to the server folder by running:
   ```
   cd /path/to/timeframe-prod/server
   ```
   (Replace `/path/to/` with the actual path to your project)

---

### Step 2: Create a Virtual Environment

A virtual environment keeps the project's Python packages separate from other projects.

Run this command in your terminal:

```
python -m venv .venv
```

> 💡 This creates a folder called `.venv` inside the server directory. You only need to do this once.

---

### Step 3: Activate the Virtual Environment

You must activate the virtual environment every time you want to run the server.

#### Windows (Command Prompt):
```
.venv\Scripts\activate
```

#### Windows (PowerShell):
```
.venv\Scripts\Activate.ps1
```

> ⚠️ If you get an error about execution policies in PowerShell, run this command first:
> ```
> Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
> ```

#### macOS/Linux:
```
source .venv/bin/activate
```

**How to know it worked:** You should see `(.venv)` appear at the beginning of your terminal prompt.

---

### Step 4: Install Python Dependencies

With the virtual environment activated, install all required packages:

```
pip install -r requirements.txt
```

> ⏱️ This may take several minutes. Wait for it to complete.

**If you see errors**, try installing packages individually:
```
pip install mediapipe
pip install openai
pip install fastapi
pip install opencv-python
pip install ultralytics
pip install websocket-client
pip install omegaconf
pip install pyaudio
pip install python-dotenv
pip install uvicorn[standard]
pip install deeprails
```

---

### Step 5: Create the Server Environment File

The server needs API keys to connect to external services.

1. In the `server` folder, create a new file named `.env` (note the dot at the beginning)
   
   #### Windows:
   - Open Notepad
   - Click **File** → **Save As**
   - In "Save as type", select **All Files**
   - Name the file `.env` (including the dot)
   - Save it in the `server` folder
   
   #### macOS/Linux:
   ```
   touch .env
   ```

2. Open the `.env` file in a text editor

3. Get your API keys from this spreadsheet: https://docs.google.com/spreadsheets/d/1h-cMsoBqW4Pijn1vxkRrVOnb-tDtm-sFb27gcLI2C84/edit?usp=sharing

4. Add the following content to the file (replace the placeholder values with actual keys from the spreadsheet):
   ```
   ASSEMBLYAI_API_KEY=your_assemblyai_key_here
   OPENAI_API_KEY=your_openai_key_here
   OPENAI_MODEL=gpt-4o-mini
   ```

5. Save the file

> ⚠️ **Important:** Do not share your API keys with anyone or commit them to version control.

---

## Part 3: Client Setup

The client is the web interface you'll interact with.

### Step 1: Open the Client Folder

#### Windows:
1. Open **File Explorer**
2. Navigate to the `timeframe-prod` project folder
3. Open the `client` folder
4. Click on the address bar at the top
5. Type `cmd` and press Enter

#### macOS/Linux:
1. Open a **new** Terminal window (keep the server terminal open)
2. Navigate to the client folder:
   ```
   cd /path/to/timeframe-prod/client
   ```

---

### Step 2: Install Node.js Dependencies

Run this command in the client folder:

```
npm install
```

> ⏱️ This may take a few minutes. Wait for it to complete.

---

### Step 3: Create the Client Environment File

1. In the `client` folder, create a new file named `.env`

2. Get your API keys from the same spreadsheet: https://docs.google.com/spreadsheets/d/1h-cMsoBqW4Pijn1vxkRrVOnb-tDtm-sFb27gcLI2C84/edit?usp=sharing

3. Add the following content (replace placeholders with actual values):
   ```
   VITE_AGENT_ID=your_agent_id_here
   VITE_IDLE_VIDEO_PATH=your_idle_video_path_here
   VITE_DID_API_KEY_B64=your_did_api_key_here
   VITE_DID_CLIENT_KEY=your_did_client_key_here
   API_BASE_URL=http://127.0.0.1:8000
   ```

4. Save the file

---

## Part 4: Running the Application

You need **two terminal windows** running simultaneously—one for the server and one for the client.

### Step 1: Start the Server

1. Open a terminal in the `server` folder (see [Part 2, Step 1](#step-1-open-the-server-folder))

2. Activate the virtual environment (see [Part 2, Step 3](#step-3-activate-the-virtual-environment))

3. Run the server:
   ```
   python index.py
   ```

4. Wait for the server to start. You should see output indicating the server is running.

> ⚠️ **Keep this terminal window open!** The server must stay running.

---

### Step 2: Start the Client

1. Open a **new** terminal in the `client` folder (see [Part 3, Step 1](#step-1-open-the-client-folder))

2. Run the client:
   ```
   npm run dev
   ```

3. You should see output similar to:
   ```
   VITE v5.x.x  ready in xxx ms

   ➜  Local:   http://localhost:5173/
   ➜  Network: http://xxx.xxx.xxx.xxx:5173/
   ```

> ⚠️ **Keep this terminal window open!** The client must stay running.

---

### Step 3: Open the Application in Edge

1. Open **Microsoft Edge**
2. In the address bar, type:
   ```
   http://localhost:5173
   ```
3. Press Enter

4. **If prompted for permissions:**
   - Click **Allow** for camera access
   - Click **Allow** for microphone access

---

### Step 4: Start Interacting

1. You should see Lincoln displayed on the screen
2. Click once in the **top-left corner** of the screen to activate the interaction
3. Make sure:
   - Your webcam is on and pointing at you
   - Your microphone is working
4. Start speaking! Lincoln will respond to your questions and comments.

---

## Troubleshooting

### Common Issues and Solutions

| Problem | Solution |
|---------|----------|
| **"Python is not recognized"** | Reinstall Python and make sure to check "Add Python to PATH" |
| **"npm is not recognized"** | Reinstall Node.js and restart your terminal |
| **Server won't start** | Make sure the virtual environment is activated (you should see `(.venv)` in your prompt) |
| **Client won't start** | Make sure you ran `npm install` first |
| **No video/audio in Edge** | Complete the Edge configuration in [Step 3 of Part 1](#step-3-configure-microsoft-edge-browser) |
| **Camera/microphone not working** | Check that you allowed permissions when prompted, or go to Edge settings to enable them |
| **"ModuleNotFoundError"** | Make sure the virtual environment is activated and run `pip install -r requirements.txt` again |
| **API errors** | Verify your `.env` files have the correct API keys |

### Getting More Help

If you encounter issues not covered here:
1. Check that all steps were followed exactly as written
2. Restart both the server and client
3. Try closing and reopening your terminal windows
4. Make sure your webcam and microphone are not being used by another application

---

## 📝 Quick Reference

Once everything is set up, here's what you need to do each time you want to use the application:

1. **Start the server:**
   ```
   cd server
   .venv\Scripts\activate    # Windows
   source .venv/bin/activate  # macOS/Linux
   python index.py
   ```

2. **Start the client (in a new terminal):**
   ```
   cd client
   npm run dev
   ```

3. **Open Edge and go to:** `http://localhost:5173`

4. **Click the top-left corner**
