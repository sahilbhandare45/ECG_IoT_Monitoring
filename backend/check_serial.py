import serial
import time
import sys
import os

# Add backend directory to path to allow importing the config
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.core.config import settings

PORT = settings.SERIAL_PORT
BAUD = settings.BAUD_RATE

print("========================================")
print(f" SERIAL PORT DIAGNOSTIC TOOL ")
print("========================================")
print(f"Attempting to connect to Arduino on {PORT} at {BAUD} baud...")

try:
    # Open the serial port with a 1-second timeout
    ser = serial.Serial(PORT, BAUD, timeout=1)
    print("-> Port opened successfully. Waiting 2 seconds for Arduino to reset...\n")
    time.sleep(2)
    ser.reset_input_buffer()
except Exception as e:
    print(f"\n[ERROR] Could not open {PORT}.")
    print(f"Details: {e}")
    print("\nPlease verify:")
    print("1. Your Arduino/Sensor is plugged in via USB.")
    print("2. The COM port in app/core/config.py is correct (It is currently set to COM3).")
    print("3. No other program (like Arduino IDE Serial Monitor or desktop_plot.py) is already using the port.")
    sys.exit(1)

print("Listening for incoming data (Press Ctrl+C to stop)...\n")

packet_count = 0
last_warning_time = time.time()

try:
    while True:
        if ser.in_waiting > 0:
            try:
                # Read a line of data, decode it, and strip invisible characters like \r\n
                raw_data = ser.readline().decode('utf-8', errors='ignore').strip()
                
                print(f"[Packet {packet_count}] Received Raw Value: '{raw_data}'", end="")
                if raw_data.isdigit():
                    print(" ✓ (Valid Number)")
                else:
                    print(" ❌ (Not a clean number)")
                    
                packet_count += 1
                last_warning_time = time.time() # Reset the warning timer
            except Exception as e:
                print(f"[Packet {packet_count}] Read error: {e}")
                
        else:
            # If nothing was received for 5 seconds, print a warning
            if time.time() - last_warning_time > 5:
                print("\n[WARNING] Haven't received any data for 5 seconds...")
                print("If the Arduino is powered on, check the sensor connections (A0 pin, 5V, GND).")
                last_warning_time = time.time() # Keep warning every 5 seconds
                
        time.sleep(0.01)

except KeyboardInterrupt:
    print("\n\nDiagnostic tool stopped by user.")
    ser.close()
    sys.exit(0)
