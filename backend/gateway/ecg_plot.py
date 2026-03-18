import matplotlib.pyplot as plt
from collections import deque
from backend.gateway.serial_reader import read_serial

# Keep last 300 samples
buffer_size = 300
ecg_buffer = deque([0]*buffer_size, maxlen=buffer_size)

plt.ion()
fig, ax = plt.subplots()

while True:
    for data in read_serial():

        ecg_value = data["ecg"]

        ecg_buffer.append(ecg_value)

        ax.clear()
        ax.plot(ecg_buffer)
        ax.set_title("Live ECG Signal")
        ax.set_ylabel("Amplitude")
        ax.set_xlabel("Samples")

        plt.pause(0.01)