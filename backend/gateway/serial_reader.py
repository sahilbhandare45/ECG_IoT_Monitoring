import serial
import time
from .config import SERIAL_PORT, BAUD_RATE


def read_serial():

    while True:
        try:
            ser = serial.Serial(SERIAL_PORT, BAUD_RATE, timeout=1)

            # wait for Arduino reset
            time.sleep(2)

            ser.reset_input_buffer()

            while True:
                try:
                    line = ser.readline().decode(errors="ignore").strip()

                    if line.isdigit():
                        yield {"ecg": int(line)}

                except Exception:
                    continue

        except serial.SerialException as e:

            print("Serial error:", e)
            print("Reconnecting in 2 seconds...")

            try:
                ser.close()
            except:
                pass

            time.sleep(2)