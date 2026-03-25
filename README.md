# Driver Drowsiness Detection System

🚀 **Live Web App:** [https://driver-drowsiness-detection-system-phi.vercel.app/](https://driver-drowsiness-detection-system-phi.vercel.app/)

Real-time drowsiness detection using webcam feed, OpenCV, and a deep learning model (InceptionV3). If the driver's eyes remain closed for more than **2.5 continuous seconds**, an alarm sounds to alert them.

## How It Works

```
Webcam Feed → Face Detection → Eye Detection (within face) → CNN Prediction → Alarm
```

1. **Face Detection** — Haar Cascade detects the driver's face
2. **Eye Detection** — Eyes are located in the upper half of the face ROI (avoids false detections from mouth/nostrils)
3. **Classification** — A trained InceptionV3 model predicts whether each eye is **open** or **closed**
4. **Alarm Logic** — If both eyes are closed for 2.5+ continuous seconds, a looping alarm plays. It stops immediately when eyes reopen.

## Project Structure

```
├── main.ipynb                # Main program - run this to start detection
├── Data_Preparation.ipynb    # Prepares raw dataset into Open/Closed folders
├── Model_Training.ipynb      # Trains the InceptionV3 model
├── models/
│   └── model.h5              # Pre-trained model weights
├── alarm.wav                 # Alarm sound file
├── mrlEyes_2018_01/          # Raw eye dataset (MRL Eye Dataset)
├── requirements.txt          # Python dependencies
└── README.md
```

## Setup

### Prerequisites

- **Python 3.11 or 3.12** (TensorFlow does not support 3.13+)
- A working webcam

### Installation

```bash
# Clone the repository
git clone https://github.com/prajapat23puneet/Driver-Drowsiness-Detection-System.git
cd Driver-Drowsiness-Detection-System

# Install dependencies
pip install -r requirements.txt
```

### macOS Setup (Step-by-Step)

If you're on a Mac and new to this, follow these steps:

**Step 1 — Install Python**

1. Open **Terminal** (search "Terminal" in Spotlight, or find it in Applications → Utilities)
2. Check if Python is installed by typing:
   ```bash
   python3 --version
   ```
3. If it shows `Python 3.11.x` or `3.12.x`, you're good — skip to Step 2
4. If not, download Python 3.12 from [python.org/downloads](https://www.python.org/downloads/) and install it

**Step 2 — Download the Project**

1. Go to the [GitHub repository](https://github.com/prajapat23puneet/Driver-Drowsiness-Detection-System)
2. Click the green **Code** button → **Download ZIP**
3. Unzip the downloaded file (double-click it)
4. You'll get a folder called `Driver-Drowsiness-Detection-System`

**Step 3 — Install Dependencies**

1. Open **Terminal**
2. Type `cd ` (with a space after), then drag the project folder into Terminal — it will paste the path for you
3. Press Enter, then run:
   ```bash
   pip3 install -r requirements.txt
   ```
4. Wait for everything to install (may take a few minutes)

**Step 4 — Allow Camera Access**

1. When you run the app, macOS will ask for camera permission — click **Allow**
2. If you accidentally denied it: go to **System Settings → Privacy & Security → Camera** and enable it for Terminal / VS Code

**Step 5 — Run the App**

1. Install VS Code from [code.visualstudio.com](https://code.visualstudio.com/) (if you don't have it)
2. Install the **Jupyter** extension in VS Code (search "Jupyter" in the Extensions tab)
3. Open the project folder in VS Code (File → Open Folder)
4. Open `main.ipynb`
5. In the top-right, click the kernel picker and select **Python 3.11** or **3.12**
6. Click **Run All** (▶▶ button at the top)
7. A window will pop up showing your webcam with drowsiness detection
8. To quit: press **Q** on your keyboard or close the window

## Usage

1. Open `main.ipynb` in Jupyter Notebook/VS Code
2. Select the **Python 3.11** (or 3.12) kernel
3. Run all cells in order
4. The webcam window will open with live detection
5. To quit: press **Q** or close the window (both work on Windows & macOS)

### On-screen Indicators

| Display | Meaning |
|---------|---------|
| **OPEN** (green) | Eyes are open — normal |
| **CLOSED (2.3s / 2.5s)** (orange) | Eyes closed — timer counting |
| **CLOSED (2.6s / 2.5s)** (red) | Alarm triggered! |

## Retraining the Model (Optional)

If you want to retrain with your own data:

1. Place the [MRL Eye Dataset](http://mrl.cs.vsb.cz/eyedataset) in `mrlEyes_2018_01/`
2. Run `Data_Preparation.ipynb` — sorts images into `Open_Eyes` / `Close_Eyes`
3. Run `Model_Training.ipynb` — trains InceptionV3 and saves to `models/model.h5`

## Tech Stack

- **TensorFlow / Keras** — InceptionV3 transfer learning
- **OpenCV** — Face & eye detection via Haar Cascades
- **Pygame** — Alarm audio playback
- **NumPy** — Image preprocessing

## License

This project is for educational purposes.
