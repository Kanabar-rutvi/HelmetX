const mqtt = require('mqtt');

const client = mqtt.connect('mqtt://test.mosquitto.org');
const deviceId = 'ESP32_001';

client.on('connect', () => {
  console.log('Simulator Connected to MQTT Broker');

  // 1. Publish Status Online
  const statusPayload = JSON.stringify({
    status: 'online',
    battery: 98
  });
  client.publish(`helmet/${deviceId}/status`, statusPayload);
  console.log('Sent Status: Online');

  let baseLat = 28.6139;
  let baseLng = 77.2090;

  // 2. Publish Sensor Data Loop
  setInterval(() => {
    // Add small random movement
    baseLat += (Math.random() - 0.5) * 0.001;
    baseLng += (Math.random() - 0.5) * 0.001;

    const dataPayload = JSON.stringify({
      heartRate: Math.floor(Math.random() * (100 - 60) + 60),
      temperature: (Math.random() * (38 - 36) + 36).toFixed(1),
      gasLevel: Math.floor(Math.random() * 100),
      helmetOn: true,
      battery: Math.floor(Math.random() * (100 - 80) + 80),
      lat: baseLat,
      lng: baseLng
    });
    
    client.publish(`helmet/${deviceId}/data`, dataPayload);
    console.log('Sent Sensor Data:', dataPayload);

    // Randomly send an alert (less frequent)
    if (Math.random() > 0.95) {
        const sosPayload = JSON.stringify({
            sos: true,
            helmetOn: true,
            lat: baseLat,
            lng: baseLng,
            heartRate: 120, // Stress
            temperature: 37.5,
            gasLevel: 50,
            battery: 85
        });
        client.publish(`helmet/${deviceId}/data`, sosPayload);
        console.log('Sent SOS ALERT!');
    }

  }, 3000);
});
