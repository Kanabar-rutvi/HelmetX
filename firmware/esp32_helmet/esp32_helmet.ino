// #include <WiFi.h>
// #include <PubSubClient.h>
// #include <Wire.h>
// #include <DHT.h>
// #include <TinyGPSPlus.h>
// #include <Adafruit_Sensor.h>
// #include <Adafruit_ADXL345_U.h>
// #include <ArduinoJson.h>

// /* ========== WIFI CREDENTIALS ========== */
// const char* ssid = "Rutvi";
// const char* password = "Rutvi123";

// /* ========== MQTT CONFIG ========== */
// const char* mqtt_server = "test.mosquitto.org";
// const int mqtt_port = 1883;
// const char* deviceId = "ESP32_001";
// const char* topic_data = "helmet/ESP32_001/data";
// const char* topic_status = "helmet/ESP32_001/status";

// /* ========== PIN DEFINITIONS ========== */
// #define DHTPIN 4
// #define DHTTYPE DHT11
// #define IR_PIN 27         // Helmet wearing detection (IR Sensor)
// #define MQ135_PIN 34      // Gas Sensor
// #define LED_PIN 26        // Alert LED
// #define BUZZER_PIN 25     // Alert Buzzer
// #define SOS_PIN 15        // SOS Button

// /* ========== SENSOR OBJECTS ========== */
// WiFiClient espClient;
// PubSubClient client(espClient);
// DHT dht(DHTPIN, DHTTYPE);
// Adafruit_ADXL345_Unified accel = Adafruit_ADXL345_Unified(12345);
// TinyGPSPlus gps;
// HardwareSerial gpsSerial(2); // GPS TX=17, RX=16

// /* ========== THRESHOLDS ========== */
// #define ACCIDENT_THRESHOLD 28.0
// #define GAS_THRESHOLD 2500
// #define TEMP_THRESHOLD 40
// #define HUMIDITY_THRESHOLD 85.0

// /* ========== GLOBAL VARIABLES ========== */
// bool sosPressed = false;

// /* ========== WIFI SETUP ========== */
// void setup_wifi() {
//   Serial.print("Connecting to WiFi");
//   WiFi.begin(ssid, password);

//   int retries = 0;
//   while (WiFi.status() != WL_CONNECTED && retries < 20) {
//     delay(500);
//     Serial.print(".");
//     retries++;
//   }
  
//   if(WiFi.status() == WL_CONNECTED) {
//     Serial.println("\n✅ WiFi Connected");
//     Serial.print("IP: ");
//     Serial.println(WiFi.localIP());
//   } else {
//     Serial.println("\n❌ WiFi Connection Failed (Continuing Offline)");
//   }
// }

// /* ========== MQTT RECONNECT ========== */
// void reconnect() {
//   if (WiFi.status() != WL_CONNECTED) return; // Don't try if no WiFi
  
//   if (!client.connected()) {
//     Serial.print("Connecting to MQTT...");
//     if (client.connect(deviceId)) {
//       Serial.println("connected");
//       client.publish(topic_status, "{\"status\":\"online\"}", true);
//     } else {
//       Serial.print("failed, rc=");
//       Serial.print(client.state());
//     }
//   }
// }

// /* ========== SETUP ========== */
// void setup() {
//   Serial.begin(115200);

//   // Initialize Pins
//   pinMode(IR_PIN, INPUT);
//   pinMode(SOS_PIN, INPUT_PULLUP);
//   pinMode(LED_PIN, OUTPUT);
//   pinMode(BUZZER_PIN, OUTPUT);
//   pinMode(MQ135_PIN, INPUT);

//   // Initialize Sensors
//   dht.begin();
//   gpsSerial.begin(9600, SERIAL_8N1, 16, 17);

//   if (!accel.begin()) {
//     Serial.println("⚠️ ADXL345 not detected (Check wiring)");
//   } else {
//     accel.setRange(ADXL345_RANGE_16_G);
//   }

//   // Initialize Network
//   setup_wifi();
//   client.setServer(mqtt_server, mqtt_port);
// }

// /* ========== MAIN LOOP ========== */
// void loop() {
//   // MQTT Maintenance
//   if (WiFi.status() == WL_CONNECTED && !client.connected()) {
//     reconnect();
//   }
//   client.loop();

//   /* ===== READ ACCELEROMETER ===== */
//   float ax = 0, ay = 0, az = 0, totalAcc = 0;
//   bool accident = false;
//   sensors_event_t event;
//   if (accel.getEvent(&event)) {
//     ax = event.acceleration.x;
//     ay = event.acceleration.y;
//     az = event.acceleration.z;
//     totalAcc = sqrt(ax*ax + ay*ay + az*az);
//     accident = totalAcc > ACCIDENT_THRESHOLD;
//   }

//   /* ===== READ SENSORS ===== */
//   // Helmet IR Sensor (Active LOW usually means object detected/worn)
//   int helmetRaw = digitalRead(IR_PIN);
//   bool helmetOn = (helmetRaw == LOW); 

//   // Gas Sensor
//   int gas = analogRead(MQ135_PIN);

//   // DHT Sensor
//   float temp = dht.readTemperature();
//   float hum = dht.readHumidity();

//   // SOS Button
//   bool sos = (digitalRead(SOS_PIN) == LOW);

//   /* ===== READ GPS ===== */
//   while (gpsSerial.available()) {
//     gps.encode(gpsSerial.read());
//   }
//   float lat = gps.location.isValid() ? gps.location.lat() : 0.0;
//   float lng = gps.location.isValid() ? gps.location.lng() : 0.0;

//   /* ===== ALERTS ===== */
//   // Only trigger alerts on valid readings
//   bool alert = accident || (gas > GAS_THRESHOLD) || (!isnan(temp) && temp > TEMP_THRESHOLD) || (!isnan(hum) && hum > HUMIDITY_THRESHOLD) || sos;
//   digitalWrite(LED_PIN, alert ? HIGH : LOW);
//   digitalWrite(BUZZER_PIN, alert ? HIGH : LOW);

//   /* ===== PREPARE DATA PACKET ===== */
//   StaticJsonDocument<512> doc;
//   doc["deviceId"] = deviceId;
//   doc["heartRate"] = 0; // Heart rate sensor not connected
//   doc["temperature"] = isnan(temp) ? 0.0 : temp;
//   doc["humidity"] = isnan(hum) ? 0.0 : hum;
//   doc["gasLevel"] = gas;
//   doc["totalAcceleration"] = totalAcc;
//   doc["helmetOn"] = helmetOn;
//   doc["battery"] = 0; // Battery monitoring not connected
//   doc["lat"] = lat;
//   doc["lng"] = lng;
//   doc["sos"] = sos;
//   doc["fall"] = accident;
//   doc["alert"] = alert;

//   char payload[512];
//   serializeJson(doc, payload);

//   /* ===== SEND DATA ===== */
//   // 1. Send via Serial (for Local Dashboard/COM Port)
//   Serial.println(payload);

//   // 2. Send via MQTT (for Cloud Dashboard)
//   if (client.connected()) {
//     client.publish(topic_data, payload);
//   }

//   delay(1000); // Update every second
// }


#include <WiFi.h>
#include <PubSubClient.h>
#include <Wire.h>
#include <DHT.h>
#include <TinyGPSPlus.h>
#include <Adafruit_Sensor.h>
#include <Adafruit_ADXL345_U.h>
#include <ArduinoJson.h>

/* ========== WIFI CREDENTIALS ========== */
const char* ssid = "Rutvi";
const char* password = "Rutvi123";

/* ========== MQTT CONFIG ========== */
const char* mqtt_server = "test.mosquitto.org";
const int mqtt_port = 1883;
const char* deviceId = "ESP32_001";
const char* topic_data = "helmet/ESP32_001/data";
const char* topic_status = "helmet/ESP32_001/status";

/* ========== PIN DEFINITIONS ========== */
#define DHTPIN 4
#define DHTTYPE DHT11
#define IR_PIN 27         // Helmet wearing detection (IR Sensor)
#define MQ135_PIN 34      // Gas Sensor
#define LED_PIN 26        // Alert LED
#define BUZZER_PIN 25     // Alert Buzzer
#define SOS_PIN 15        // SOS Button

/* ========== SENSOR OBJECTS ========== */
WiFiClient espClient;
PubSubClient client(espClient);
DHT dht(DHTPIN, DHTTYPE);
Adafruit_ADXL345_Unified accel = Adafruit_ADXL345_Unified(12345);
TinyGPSPlus gps;
HardwareSerial gpsSerial(2); // GPS TX=17, RX=16

/* ========== THRESHOLDS ========== */
#define ACCIDENT_THRESHOLD 28.0
#define GAS_THRESHOLD 2500
#define TEMP_THRESHOLD 40
#define HUMIDITY_THRESHOLD 85.0

/* ========== GLOBAL VARIABLES ========== */
bool sosPressed = false;

/* ========== WIFI SETUP ========== */
void setup_wifi() {
  Serial.print("Connecting to WiFi");
  WiFi.begin(ssid, password);

  int retries = 0;
  while (WiFi.status() != WL_CONNECTED && retries < 20) {
    delay(500);
    Serial.print(".");
    retries++;
  }
  
  if(WiFi.status() == WL_CONNECTED) {
    Serial.println("\n✅ WiFi Connected");
    Serial.print("IP: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("\n❌ WiFi Connection Failed (Continuing Offline)");
  }
}

/* ========== MQTT RECONNECT ========== */
void reconnect() {
  if (WiFi.status() != WL_CONNECTED) return; // Don't try if no WiFi
  
  if (!client.connected()) {
    Serial.print("Connecting to MQTT...");
    if (client.connect(deviceId)) {
      Serial.println("connected");
      client.publish(topic_status, "{\"status\":\"online\"}", true);
    } else {
      Serial.print("failed, rc=");
      Serial.print(client.state());
    }
  }
}

/* ========== SETUP ========== */
void setup() {
  Serial.begin(115200);

  // Initialize Pins
  pinMode(IR_PIN, INPUT);
  pinMode(SOS_PIN, INPUT_PULLUP);
  pinMode(LED_PIN, OUTPUT);
  pinMode(BUZZER_PIN, OUTPUT);
  pinMode(MQ135_PIN, INPUT);

  // Initialize Sensors
  dht.begin();
  gpsSerial.begin(9600, SERIAL_8N1, 16, 17);

  if (!accel.begin()) {
    Serial.println("⚠️ ADXL345 not detected (Check wiring)");
  } else {
    accel.setRange(ADXL345_RANGE_16_G);
  }

  // Initialize Network
  setup_wifi();
  client.setServer(mqtt_server, mqtt_port);
}

/* ========== MAIN LOOP ========== */
void loop() {
  // MQTT Maintenance
  if (WiFi.status() == WL_CONNECTED && !client.connected()) {
    reconnect();
  }
  client.loop();

  /* ===== READ ACCELEROMETER ===== */
  float ax = 0, ay = 0, az = 0, totalAcc = 0;
  bool accident = false;
  sensors_event_t event;
  if (accel.getEvent(&event)) {
    ax = event.acceleration.x;
    ay = event.acceleration.y;
    az = event.acceleration.z;
    totalAcc = sqrt(ax*ax + ay*ay + az*az);
    accident = totalAcc > ACCIDENT_THRESHOLD;
  }

  /* ===== READ SENSORS ===== */
  // Helmet IR Sensor (Active LOW usually means object detected/worn)
  int helmetRaw = digitalRead(IR_PIN);
  bool helmetOn = (helmetRaw == LOW); 

  // Gas Sensor
  int gas = analogRead(MQ135_PIN);

  // DHT Sensor
  float temp = dht.readTemperature();
  float hum = dht.readHumidity();

  // SOS Button
  bool sos = (digitalRead(SOS_PIN) == LOW);

  /* ===== READ GPS ===== */
  while (gpsSerial.available()) {
    gps.encode(gpsSerial.read());
  }
  float lat = gps.location.isValid() ? gps.location.lat() : 0.0;
  float lng = gps.location.isValid() ? gps.location.lng() : 0.0;

  /* ===== ALERTS ===== */
  // Only trigger alerts on valid readings
  bool alert = accident || (gas > GAS_THRESHOLD) || (!isnan(temp) && temp > TEMP_THRESHOLD) || (!isnan(hum) && hum > HUMIDITY_THRESHOLD) || sos;
  digitalWrite(LED_PIN, alert ? HIGH : LOW);
  digitalWrite(BUZZER_PIN, alert ? HIGH : LOW);

  /* ===== PREPARE DATA PACKET ===== */
  StaticJsonDocument<512> doc;
  doc["deviceId"] = deviceId;
  doc["heartRate"] = 0; // Heart rate sensor not connected
  doc["temperature"] = isnan(temp) ? 0.0 : temp;
  doc["humidity"] = isnan(hum) ? 0.0 : hum;
  doc["gasLevel"] = gas;
  doc["totalAcceleration"] = totalAcc;
  doc["helmetOn"] = helmetOn;
  doc["battery"] = 0; // Battery monitoring not connected
  doc["lat"] = lat;
  doc["lng"] = lng;
  doc["sos"] = sos;
  doc["fall"] = accident;
  doc["alert"] = alert;

  char payload[512];
  serializeJson(doc, payload);

  /* ===== SEND DATA ===== */
  // 1. Send via Serial (for Local Dashboard/COM Port)
  Serial.println(payload);

  // 2. Send via MQTT (for Cloud Dashboard)
  if (client.connected()) {
    client.publish(topic_data, payload);
  }

  delay(1000); // Update every second
}
