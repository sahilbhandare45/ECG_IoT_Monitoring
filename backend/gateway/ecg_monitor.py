import matplotlib.pyplot as plt
from collections import deque
import numpy as np
import time
from scipy.signal import butter, filtfilt

from backend.gateway.serial_reader import read_serial
from backend.ml.ecg_processing import process_ecg

SAMPLE_RATE = 200
buffer_size = 300

ecg_buffer = deque([0]*buffer_size, maxlen=buffer_size)

# visualization filter
b, a = butter(2, [0.5, 40], fs=SAMPLE_RATE, btype='band')

def bandpass(signal):
    if len(signal) < 30:
        return signal
    try:
        return filtfilt(b, a, signal)
    except:
        return signal

plt.style.use("dark_background")

fig, ax = plt.subplots(figsize=(10,4))

line, = ax.plot([], [], color="lime", linewidth=2)
peak_plot = ax.scatter([], [], color="red", s=40)

ax.set_xlim(0, buffer_size)
ax.set_ylim(-400, 400)

ax.set_xlabel("Samples")
ax.set_ylabel("Amplitude")

# ECG grid
ax.set_xticks(np.arange(0, buffer_size, 50))
ax.set_xticks(np.arange(0, buffer_size, 10), minor=True)

ax.set_yticks(np.arange(-400,400,100))
ax.set_yticks(np.arange(-400,400,20), minor=True)

ax.grid(which="major", color="#333333")
ax.grid(which="minor", color="#222222")

plt.ion()
plt.show()

bpm_value = 0
peaks_global = None

last_draw = time.time()
DRAW_INTERVAL = 0.03


for data in read_serial():

    ecg_value = data["ecg"]

    peaks, bpm = process_ecg(ecg_value)

    if bpm is not None:
        bpm_value = bpm
        peaks_global = peaks

    ecg_buffer.append(ecg_value - 512)

    signal = np.array(ecg_buffer)

    # visualization filtering
    signal = bandpass(signal)

    # baseline removal
    signal = signal - np.mean(signal)

    # small smoothing
    signal = np.convolve(signal, np.ones(3)/3, mode='same')

    if time.time() - last_draw < DRAW_INTERVAL:
        continue

    last_draw = time.time()

    line.set_data(range(len(signal)), signal)

    if peaks_global is not None:
        valid_peaks = [p for p in peaks_global if p < len(signal)]

        if len(valid_peaks) > 0:
            peak_plot.set_offsets(np.c_[valid_peaks, signal[valid_peaks]])
        else:
            peak_plot.set_offsets(np.empty((0,2)))
    else:
        peak_plot.set_offsets(np.empty((0,2)))

    ax.set_title(f"ECG Monitor | BPM: {bpm_value}")

    fig.canvas.draw()
    fig.canvas.flush_events()