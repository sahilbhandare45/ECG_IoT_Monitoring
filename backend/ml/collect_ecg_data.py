import csv
from backend.gateway.serial_reader import read_serial

with open("ecg_dataset.csv", "a", newline="") as file:

    writer = csv.writer(file)

    for data in read_serial():

        ecg_value = data["ecg"]

        writer.writerow([ecg_value])

        print("Saved:", ecg_value)