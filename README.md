# 💧 Jal Jeevan — Smart Water Pipeline Leak Detection & Localization

[![Hardware](https://img.shields.io/badge/Hardware-ESP32%20%7C%20LoRa%20865MHz%20%7C%20TDR-green.svg)](#hardware-architecture)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

> **Live Interactive Dashboard:** [https://sharath-ixvii.github.io/water-leak-detection/](https://sharath-ixvii.github.io/water-leak-detection/)

A low-cost, high-efficiency water pipeline leak detection and localization system designed for distribution pipelines. Combines a **dielectric sensing cable**, **Time-Domain Reflectometry (TDR)**, **ESP32**, and **LoRa 865 MHz** long-range telemetry.

---

## 📌 Problem Statement

In water distribution systems, non-revenue water losses range from **35% to 50%**. Undetected underground leaks run for weeks before surfacing, wasting treated drinking water, causing ground subsidence, and allowing contaminants to enter distribution mains.

### Why Conventional Solutions Fail:
1. **Flowmeters (Inlet − Outlet):** Only calculate total volume loss in a zone; **cannot pinpoint where** the leak is located along a pipeline.
2. **Acoustic Leak Loggers:** Fail on plastic (**HDPE/PVC**) pipes because plastic dampens acoustic sound waves.
3. **Commercial Sensing Cables:** Imported systems cost **₹5,000 to ₹10,000 per meter** with proprietary closed locators, making widespread deployment unfeasible.

---

## 🚀 Key Innovations

Jal Jeevan introduces four practical engineering innovations:

### 1. Dual-Cable Sensing Options (Ribbon & Coaxial)
* **Primary (Flat Geotextile Ribbon - < ₹6/meter):** Dual parallel 0.6 mm Copper-Clad Aluminum (CCA) wires on a 20 mm wide non-woven polypropylene ribbon. Sits flat under the pipe invert (6 o'clock position), wicks drips immediately, and triggers an 85% impedance reflection dip.
* **Secondary (DIY Porous Coaxial - ₹28/meter):** Inner copper core + porous cellulose dielectric + braided/slotted copper return shield. Serves as a traditional shielded RF benchmark.

### 2. The ₹50 "Ring-Oscillator" TDR (Replaces ₹30,000 Timing Chips)
* Instead of costly picosecond time-to-digital converters or lab oscilloscopes, a single **74LVC14 Schmitt trigger inverter IC (₹15)** recirculates the reflected pulse into a resonant delay loop:
  $$f = \frac{v}{4 \cdot d} \iff d = \frac{v}{4 \cdot f}$$
* The **ESP32 built-in hardware Pulse Counter (PCNT)** measures the oscillating frequency directly up to 40 MHz with zero CPU overhead, pinpointing distance to the exact meter!

### 3. "Rain Infiltration vs. Pipe Burst" Multi-Sensor Fusion
* **The Challenge:** Handling ground moisture from environmental rain.
* **The Solution:** Dual-sensor cross-correlation:
  * **Cable Wet + Internal Pressure Drop** $\implies$ **CONFIRMED PIPE BURST** (Red Dot triggered, emergency dispatch sent).
  * **Cable Wet + Internal Pressure Normal** $\implies$ **RAIN / GROUNDWATER INFILTRATION** (False alarm automatically suppressed!).

### 4. 2-Node Bi-Directional Architecture & Dedicated Power
* **Bi-Directional 5 km Coverage:** Node 1 (at km 2.5) monitors 2.5 km Left + 2.5 km Right = **5 km**. Node 2 (at km 7.5) monitors 2.5 km Left + 2.5 km Right = **5 km**. The entire 10 km pipeline requires **only 2 field nodes**!
* **Power-Over-Trench with Micro-UPS:** Each node is powered via a continuous 24V DC SELV auxiliary wire laid in the pipe trench from the Gateway's central solar station, backed by an internal 3.65V LiFePO4 micro-UPS buffer (30-day backup), completely eliminating dead-battery risks underground.
* **Above-Ground Gateway:** The central LoRa receiver gateway (at the headworks pump station or village water tank) is powered by solar / 230V mains.

---

## 📡 LoRa 865 MHz Telemetry (10 km Sector Range)

Field nodes monitor pipeline sectors and transmit an ultra-dense **12-byte binary payload** over the 865–867 MHz band:

```
[2 Bytes: NodeID] [1 Byte: StatusCode] [2 Bytes: Distance_m] 
[2 Bytes: Pressure_bar] [2 Bytes: Battery_mV] [1 Byte: Confidence%] [2 Bytes: CRC16]
```

A central LoRa Gateway receives the packet and pushes it to the Web Dashboard via MQTT/Wi-Fi.

---

## 🖥️ Live Dashboard Preview

The dashboard features:
* **Interactive 10 km Pipeline Spatial Track** with simulated water flow, valve inspection pits, and the **Red Dot** pinpoint marker.
* **Light-Theme Digital Oscilloscope** displaying dry baseline, live trace, and differential reflection dip ($\Delta\Gamma$).
* **Real-Time LoRa JSON Packet Terminal** with live RSSI, SNR, and pressure metrics.
* **Automated Maintenance Dispatch** simulating instant alerts to field technicians.

---

## 🛠️ Repository Files

* [`index.html`](index.html) — Professional Light-Theme Dashboard UI.
* [`style.css`](style.css) — Clean CSS stylesheet.
* [`app.js`](app.js) — Real-time waveform simulator, Ring-Oscillator frequency engine, and event handler.

---

## 👨‍💻 Author & Team

* **Lead:** [Sharath (sharath-IXVII)](https://github.com/sharath-IXVII)
* **Domain:** Smart Water Infrastructure
* **Architecture:** TDR Dielectric Sensing + ESP32 LoRa 865 MHz
