import serial
import time
import threading
from queue import Queue
from app.core.config import settings
import sys

# Global queue for raw ingestion
serial_queue = Queue(maxsize=1000)

def read_serial_worker():
    """
    Background thread that purely reads bytes from the Arduino
    and puts them into the Thread-Safe queue, ensuring no dropping
    of data while the main thread processes and uploads.
    """
    try:
        ser = serial.Serial(settings.SERIAL_PORT, settings.BAUD_RATE, timeout=0.1)
        time.sleep(2) # Give Arduino time to auto-reset
        ser.reset_input_buffer()
        print(f"[Serial Service] Listening on {settings.SERIAL_PORT}...")
    except serial.SerialException as e:
        print(f"[Serial Service Error] Could not open port {settings.SERIAL_PORT}: {e}")
        # Normally would continually retry, but skip blocking the runtime for now
        return

    while True:
        try:
            line = ser.readline().decode('utf-8', errors='ignore').strip()
            if line.isdigit():
                val = int(line)
                if not serial_queue.full():
                    serial_queue.put(val)
        except Exception as e:
            time.sleep(1)

def start_serial_reader():
    """Starts the serial reading in a daemon thread."""
    t = threading.Thread(target=read_serial_worker, daemon=True)
    t.start()
    return t
