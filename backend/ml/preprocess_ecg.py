import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
from scipy.signal import butter, filtfilt

# Load dataset
data = pd.read_csv("ecg_dataset.csv", header=None)

signal = data[0].values


# Bandpass filter
def bandpass_filter(signal):

    b, a = butter(3, [0.5, 35], fs=200, btype='band')
    return filtfilt(b, a, signal)


filtered = bandpass_filter(signal)

print("Filtered signal ready")


# Plot comparison
plt.figure(figsize=(10,4))

plt.subplot(2,1,1)
plt.title("Raw ECG Signal")
plt.plot(signal)

plt.subplot(2,1,2)
plt.title("Filtered ECG Signal")
plt.plot(filtered)

plt.tight_layout()
plt.show()


# Save filtered data
pd.DataFrame(filtered).to_csv("filtered_ecg_dataset.csv", index=False)