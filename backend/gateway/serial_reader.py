import serial
import time
from .config import SERIAL_PORT, BAUD_RATE


def read_serial():

    while True:
        try:
            print(f"[SERIAL] Connecting to {SERIAL_PORT} at {BAUD_RATE} baud...")
            ser = serial.Serial(SERIAL_PORT, BAUD_RATE, timeout=1)

            # wait for Arduino reset
            time.sleep(2)

            ser.reset_input_buffer()
            print("[SERIAL] Connected! Listening for data...")

            line_count = 0
            empty_count = 0

            while True:
                try:
                    line = ser.readline().decode(errors="ignore").strip()

                    if not line:
                        empty_count += 1
                        if empty_count % 100 == 0:
                            print(f"[SERIAL] {empty_count} empty reads (no data from Arduino)")
                        continue

                    empty_count = 0
                    line_count += 1

                    if line.isdigit():
                        yield {"ecg": int(line)}
                    else:
                        if line_count <= 10:
                            print(f"[SERIAL] Non-digit data: '{line}'")

                except Exception as e:
                    print(f"[SERIAL] Read error: {e}")
                    continue

        except serial.SerialException as e:

            print("Serial error:", e)
            print("Reconnecting in 2 seconds...")

            try:
                ser.close()
            except:
                pass

            time.sleep(2)