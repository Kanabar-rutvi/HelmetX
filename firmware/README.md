# Smart Safety Helmet Firmware

## Hardware Requirements
- ESP32 Development Board
- DHT11 Temperature & Humidity Sensor
- MQ-2 Gas Sensor
- Push Button (SOS)
- Limit Switch (Helmet Wear Detection)
- Neo-6M GPS Module (Optional, simulated in code)

## Pin Configuration
| Component | ESP32 Pin |
|-----------|-----------|
| DHT11 Data | GPIO 4 |
| Gas Sensor (AO) | GPIO 34 |
| SOS Button | GPIO 15 |
| Helmet Switch | GPIO 5 |

## Setup Instructions
1. Install [Arduino IDE](https://www.arduino.cc/en/software).
2. Install **ESP32 Board Manager**.
3. Install Libraries:
   - `PubSubClient` by Nick O'Leary
   - `DHT sensor library` by Adafruit
4. Update `ssid` and `password` in `esp32_helmet.ino`.
5. Update `mqtt_server` to your backend IP or broker URL.
6. Flash code to ESP32.

## MQTT Topics
- Data: `helmet/{DEVICE_ID}/data`
- Status: `helmet/{DEVICE_ID}/status`
