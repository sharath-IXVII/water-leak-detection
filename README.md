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

### 1. Flat Porous Geotextile Twin-Lead Cable (< ₹6/meter)
* **Conductors:** Dual parallel 0.6 mm Copper-Clad Aluminum (CCA) wires (optimized for the RF Skin Effect at 20–40 MHz, giving identical high-frequency wave propagation at 1/3 the copper cost).
* **Carrier & Dielectric:** Needle-punched non-woven polypropylene geotextile ribbon (rot-proof, high tensile strength, rapid capillary wicking).
* **Geometry:** Flat 20 mm wide ribbon strapped to the pipe invert (6 o'clock position), maximizing water drip contact area compared to round coaxial cables.
* **Physics:** Water has a relative permittivity of $\varepsilon_r \approx 80$ vs dry $\varepsilon_r \approx 1.8$. Water wicking collapses characteristic impedance from $Z_0 \approx 180\ \Omega$ down to $\approx 15\ \Omega$, creating an intense negative reflection coefficient ($\Gamma \approx -0.85$).

### 2. The ₹50 "Ring-Oscillator" TDR (Replaces ₹30,000 Timing Chips)
* Instead of costly picosecond time-to-digital converters or lab oscilloscopes, a single **74LVC14 Schmitt trigger inverter IC (₹15)** recirculates the reflected pulse into a resonant delay loop:
  $$f = \frac{v}{4 \cdot d} \iff d = \frac{v}{4 \cdot f}$$
* The **ESP32 built-in hardware Pulse Counter (PCNT)** measures the oscillating frequency directly up to 40 MHz with zero CPU overhead, pinpointing distance to the exact meter!

### 3. "Rain Infiltration vs. Pipe Burst" Multi-Sensor Fusion
* **The Challenge:** Handling ground moisture from environmental rain.
* **The Solution:** Dual-sensor cross-correlation:
  * **Cable Wet + Internal Pressure Drop** $\implies$ **CONFIRMED PIPE BURST** (Red Dot triggered, emergency dispatch sent).
  * **Cable Wet + Internal Pressure Normal** $\implies$ **RAIN / GROUNDWATER INFILTRATION** (False alarm automatically suppressed!).

### 4. Dual-Mode Sleep-Wake Power (2.8 Years Battery Life)
* **99.9% of the time:** ESP32 remains in ultra-low-power Deep Sleep ($< 10\ \mu\text{A}$).
* Once every 10 seconds, it wakes for 1 millisecond to run a **polarity-reversing microsecond pulse check** (eliminating galvanic copper electrolysis).
* Active TDR and LoRa transmission trigger **only upon event detection**, powered by a single 18650 cell + solar panel.

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
