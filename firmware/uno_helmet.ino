#include <Wire.h>
#include <DHT.h>
#include <Adafruit_Sensor.h>
#include <Adafruit_ADXL345_U.h>
#include <ArduinoJson.h>

/* ========== PIN DEFINITIONS (Arduino Uno) ========== */
#define DHTPIN 4
#define DHTTYPE DHT11
#define IR_PIN 7          // Helmet wearing detection (Digital)
#define MQ135_PIN A0      // Gas Sensor (Analog)
#define LED_PIN 13        // Alert LED
#define BUZZER_PIN 8      // Alert Buzzer
#define SOS_PIN 2         // SOS Button

/* ========== SENSOR OBJECTS ========== */
DHT dht(DHTPIN, DHTTYPE);
Adafruit_ADXL345_Unified accel = Adafruit_ADXL345_Unified(12345);

/* ========== THRESHOLDS ========== */
#define ACCIDENT_THRESHOLD 28.0
#define GAS_THRESHOLD 400
#define TEMP_THRESHOLD 40

const char* deviceId = "UNO_001";

void setup() {
  Serial.begin(115200); // Higher baud rate for JSON

  pinMode(IR_PIN, INPUT);
  pinMode(SOS_PIN, INPUT_PULLUP);
  pinMode(LED_PIN, OUTPUT);
  pinMode(BUZZER_PIN, OUTPUT);
  pinMode(MQ135_PIN, INPUT);

  dht.begin();
  
  if (!accel.begin()) {
    Serial.println("Warning: ADXL345 not detected");
  } else {
    accel.setRange(ADXL345_RANGE_16_G);
  }
}

void loop() {
  /* ===== SENSORS ===== */
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

  int helmetRaw = digitalRead(IR_PIN);
  bool helmetOn = (helmetRaw == LOW); 
  
  int gas = analogRead(MQ135_PIN);
  float temp = dht.readTemperature();
  float hum = dht.readHumidity();
  bool sos = (digitalRead(SOS_PIN) == LOW);

  bool alert = accident || (gas > GAS_THRESHOLD) || (!isnan(temp) && temp > TEMP_THRESHOLD) || sos;
  digitalWrite(LED_PIN, alert);
  digitalWrite(BUZZER_PIN, alert);

  /* ===== JSON PAYLOAD ===== */
  StaticJsonDocument<256> doc;
  doc["deviceId"] = deviceId;
  doc["heartRate"] = 0; // No sensor
  doc["temperature"] = isnan(temp) ? 0.0 : temp;
  doc["gasLevel"] = gas;
  doc["helmetOn"] = helmetOn;
  doc["battery"] = 0; // No sensor
  doc["sos"] = sos;
  doc["fall"] = accident;
  doc["alert"] = alert;
  
  // No GPS on standard Uno usually
  doc["lat"] = 0.0; 
  doc["lng"] = 0.0;

  serializeJson(doc, Serial);
  Serial.println();

  delay(1000);
}
