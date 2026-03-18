import numpy as np
from scipy.signal import butter, filtfilt, find_peaks

SAMPLE_RATE = 200
BUFFER_SECONDS = 6

ecg_buffer = []

# Bandpass filter
b, a = butter(3, [0.5, 40], fs=SAMPLE_RATE, btype='band')

def bandpass(signal):
    if len(signal) < 30:
        return signal
    return filtfilt(b, a, signal)


def process_ecg(ecg_value):

    global ecg_buffer

    # center ADC signal
    ecg_value = ecg_value - 512

    ecg_buffer.append(ecg_value)

    if len(ecg_buffer) > SAMPLE_RATE * BUFFER_SECONDS:
        ecg_buffer.pop(0)

    # wait until buffer filled
    if len(ecg_buffer) < SAMPLE_RATE * 2:
        return None, None

    signal = np.array(ecg_buffer)

    # -----------------------
    # 1. Bandpass filter
    # -----------------------
    filtered = bandpass(signal)

    # -----------------------
    # 2. Derivative
    # -----------------------
    diff = np.diff(filtered)

    # -----------------------
    # 3. Square
    # -----------------------
    squared = diff ** 2

    # -----------------------
    # 4. Moving window integration
    # -----------------------
    window = int(0.12 * SAMPLE_RATE)
    integrated = np.convolve(squared, np.ones(window)/window, mode='same')

    # -----------------------
    # 5. Adaptive threshold
    # -----------------------
    threshold = np.mean(integrated) + 0.5*np.std(integrated)

    peaks, _ = find_peaks(
        integrated,
        height=threshold,
        distance=int(0.35*SAMPLE_RATE)
    )

    if len(peaks) < 2:
        return None, None

    # -----------------------
    # BPM calculation
    # -----------------------
    rr = np.diff(peaks) / SAMPLE_RATE
    bpm = 60 / np.mean(rr)

    bpm = int(bpm)

    # reject unrealistic BPM
    if bpm < 40 or bpm > 180:
        return None, None

    return peaks, bpm