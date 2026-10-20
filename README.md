# 💧 HydroPulse — Smart Water Pipeline Leak Detection & Localization

[![SIH 2024-2025](https://img.shields.io/badge/Smart%20India%20Hackathon-SIH%202024--2025-orange.svg)](https://sih.gov.in)
[![Jal Jeevan Mission](https://img.shields.io/badge/National%20Mission-Jal%20Jeevan%20Mission-blue.svg)](https://jaljeevanmission.gov.in)
[![Hardware](https://img.shields.io/badge/Hardware-ESP32%20%7C%20LoRa%20865MHz%20%7C%20TDR-green.svg)](#hardware-architecture)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

> **Live Interactive Dashboard:** [https://sharath-ixvii.github.io/water-leak-detection/](https://sharath-ixvii.github.io/water-leak-detection/)

An indigenous, ultra-low-cost, high-efficiency water pipeline leak detection and localization system designed for rural and urban distribution pipelines in India. Combines an **indigenous dielectric sensing cable**, **Time-Domain Reflectometry (TDR)**, **ESP32**, and **LoRa 865 MHz** long-range telemetry.

---

## 📌 Problem Statement (SIH)

In India, **Non-Revenue Water (NRW)** losses range from **35% to 50%** in rural water supply schemes (*Jal Jeevan Mission*). Undetected underground leaks run for weeks before surfacing, wasting treated drinking water, causing ground subsidence, and allowing soil pathogens to enter distribution mains.

### Why Conventional Solutions Fail:
1. **Flowmeters (Inlet − Outlet):** Only calculate total volume loss in a zone; **cannot pinpoint where** the leak is located along a 10 km line.
2. **Acoustic Leak Loggers:** Completely fail on plastic (**HDPE/PVC**) pipes because plastic dampens acoustic sound waves. Over 90% of rural JJM pipelines are HDPE/PVC!
3. **Commercial Sensing Cables:** Imported systems (e.g., TraceTek) cost **₹5,000 to ₹10,000 per meter** with proprietary closed locators, making widespread rural adoption impossible.

---

## 🚀 The HydroPulse Breakthrough

HydroPulse introduces four guaranteed buildable innovations:

### 1. Indigenous Porous Composite Sensing Cable (< ₹28/meter)
* Core: 0.8 mm tinned solid copper wire.
* Dielectric: Loose spiral hydrophilic wicking material (dry permittivity $\varepsilon_r \approx 1.8$).
* Shield: Braided copper return conductor.
* Outer Jacket: Porous expandable PET mesh.
* **Physics:** Water has a relative permittivity of $\varepsilon_r \approx 80$. When water wicks into the cable, characteristic impedance $Z_0 = \sqrt{L/C}$ drops sharply, generating a negative reflection coefficient ($\Gamma < 0$).

### 2. The ₹50 "Ring-Oscillator" TDR (Replaces ₹30,000 Timing Chips)
* Instead of costly picosecond time-to-digital converters or lab oscilloscopes, a single **74LVC14 Schmitt trigger inverter IC (₹15)** recirculates the reflected pulse into a resonant delay loop:
  $$f = \frac{v}{4 \cdot d} \iff d = \frac{v}{4 \cdot f}$$
* The **ESP32 built-in hardware Pulse Counter (PCNT)** measures the oscillating frequency directly up to 40 MHz with zero CPU overhead, pinpointing distance to the exact meter!

### 3. "Rain Infiltration vs. Pipe Burst" Multi-Sensor Fusion
* **The Jury Question:** *"What if monsoon rain wets the soil?"*
* **The Solution:** Dual-sensor cross-correlation:
  * **Cable Wet + Internal Pressure Drop** $\implies$ **CONFIRMED PIPE BURST** (Red Dot triggered, emergency dispatch sent).
  * **Cable Wet + Internal Pressure Normal** $\implies$ **RAIN / GROUNDWATER INFILTRATION** (False alarm automatically suppressed!).

### 4. Dual-Mode Sleep-Wake Power (2.8 Years Battery Life)
* **99.9% of the time:** ESP32 remains in ultra-low-power Deep Sleep ($< 10\ \mu\text{A}$).
* Once every 10 seconds, it wakes for 1 millisecond to run a **polarity-reversing microsecond pulse check** (eliminating galvanic copper electrolysis).
* Active TDR and LoRa transmission trigger **only upon event detection**, powered by a single 18650 cell + ₹150 solar panel.

---

## 📡 LoRa 865 MHz Telemetry (10 km Sector Range)

Field nodes monitor pipeline sectors and transmit an ultra-dense **12-byte binary payload** over the license-free 865–867 MHz India band:

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
* **Automated Maintenance Dispatch** simulating instant SMS/Telegram alerts to local *Jal Board* engineers.

---

## 🛠️ Repository Files

* [`index.html`](index.html) — Professional Light-Theme Dashboard UI.
* [`style.css`](style.css) — Clean government/enterprise CSS stylesheet.
* [`app.js`](app.js) — Real-time waveform simulator, Ring-Oscillator frequency engine, and event handler.

---

## 👨‍💻 Author & Team

* **Lead:** [Sharath (sharath-IXVII)](https://github.com/sharath-IXVII)
* **Initiative:** Smart India Hackathon (SIH 2024–2025)
* **Theme:** Smart Water Management / Jal Jeevan Mission
