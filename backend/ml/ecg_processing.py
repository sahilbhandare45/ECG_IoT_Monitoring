import numpy as np
from collections import deque
from scipy.signal import butter, filtfilt, find_peaks

SAMPLE_RATE = 200
BUFFER_SECONDS = 6

# Use deque with maxlen for O(1) append/evict instead of list.pop(0) which is O(n)
ecg_buffer = deque(maxlen=SAMPLE_RATE * BUFFER_SECONDS)

# Bandpass filter
b, a = butter(3, [0.5, 40], fs=SAMPLE_RATE, btype='band')

def bandpass(signal):
    if len(signal) < 30:
        return signal
    return filtfilt(b, a, signal)


def process_ecg_batch(chunk):
    """
    Process an entire batch of ECG samples at once for BPM.
    Much faster than calling per-sample since DSP runs once per batch.
    """
    global ecg_buffer

    # Center ADC signal and add entire chunk to buffer
    centered = chunk - 512
    ecg_buffer.extend(centered)

    # Wait until buffer has enough data
    if len(ecg_buffer) < SAMPLE_RATE * 2:
        return None, None

    signal = np.array(ecg_buffer)

    # 1. Bandpass filter
    filtered = bandpass(signal)

    # 2. Derivative
    diff = np.diff(filtered)

    # 3. Square
    squared = diff ** 2

    # 4. Moving window integration
    window = int(0.12 * SAMPLE_RATE)
    integrated = np.convolve(squared, np.ones(window)/window, mode='same')

    # 5. Adaptive threshold
    threshold = np.mean(integrated) + 0.5*np.std(integrated)

    peaks, _ = find_peaks(
        integrated,
        height=threshold,
        distance=int(0.35*SAMPLE_RATE)
    )

    if len(peaks) < 2:
        return None, None

    # BPM calculation
    rr = np.diff(peaks) / SAMPLE_RATE
    bpm = 60 / np.mean(rr)

    bpm = int(bpm)

    # reject unrealistic BPM
    if bpm < 40 or bpm > 180:
        return None, None

    return peaks, bpm


# Keep backward compatibility
def process_ecg(ecg_value):
    """Legacy per-sample wrapper — prefer process_ecg_batch()."""
    return process_ecg_batch(np.array([ecg_value]))