import sys
import os
import serial
import time
import numpy as np
import matplotlib.pyplot as plt
import matplotlib.animation as animation

# Add backend directory to path to allow importing the Django/FastAPI services
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.core.config import settings
from app.services.dsp_service import dsp_service

# Serial settings
PORT = settings.SERIAL_PORT
BAUD = settings.BAUD_RATE
MAX_POINTS = 500
BATCH_SIZE = 10

print(f"Connecting to Arduino on {PORT} at {BAUD} baud...")
try:
    ser = serial.Serial(PORT, BAUD, timeout=0.1)
    time.sleep(2) # Give Arduino time to auto-reset
    ser.reset_input_buffer()
except Exception as e:
    print(f"Error opening serial port {PORT}: {e}")
    print("Please check if the Arduino is plugged in and the port matches settings in app/core/config.py.")
    sys.exit(1)

# Buffer states for visualization
raw_data = []
raw_display = np.zeros(MAX_POINTS)
filtered_display = np.zeros(MAX_POINTS)

# Setup Matplotlib plot
fig, (ax1, ax2) = plt.subplots(2, 1, figsize=(10, 6))
fig.canvas.manager.set_window_title('Live ECG Desktop Visualization')

line1, = ax1.plot(raw_display, color='red', label='Raw ECG')
ax1.set_title("Live Raw Input (Noise & Artifacts)")
ax1.set_ylim(0, 1024) # Standard 10-bit Arduino ADC

line2, = ax2.plot(filtered_display, color='green', label='Filtered ECG')
ax2.set_title("Backend Processed (Notch + Bandpass + Moving Average)")
ax2.set_ylim(-300, 300)

def update(frame):
    global raw_data, raw_display, filtered_display
    
    # Read everything available sequentially from buffer
    while ser.in_waiting > 0:
        try:
            line = ser.readline().decode('utf-8', errors='ignore').strip()
            if line.isdigit():
                raw_data.append(int(line))
        except:
            pass
            
    # Whenever we accumulate enough new points, process and plot them
    if len(raw_data) >= BATCH_SIZE:
        chunk = np.array(raw_data)
        raw_data = [] # Reset mini-batch
        
        # Apply the SAME filter logic directly from the backend pipeline
        filtered_chunk, sqi_status = dsp_service.process_chunk(chunk)
        
        n = len(chunk)
        if n >= MAX_POINTS:
            raw_display = chunk[-MAX_POINTS:]
            filtered_display = filtered_chunk[-MAX_POINTS:]
        else:
            raw_display = np.roll(raw_display, -n)
            raw_display[-n:] = chunk
            
            filtered_display = np.roll(filtered_display, -n)
            filtered_display[-n:] = filtered_chunk

        line1.set_ydata(raw_display)
        line2.set_ydata(filtered_display)
        
        # Make the chart dynamically scale around the live ECG signals
        ax1.set_ylim(max(0, np.min(raw_display) - 50), min(1024, np.max(raw_display) + 50))
        ax2.set_ylim(np.min(filtered_display) - 50, np.max(filtered_display) + 50)

    return line1, line2

# Set the refresh rate of the plot to 50ms
ani = animation.FuncAnimation(fig, update, interval=50, blit=False, cache_frame_data=False)

plt.tight_layout()
print("Starting Live Desktop UI... Close the window to stop tracking.")
plt.show()
