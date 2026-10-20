// Jal Jeevan - Smart Water Pipeline Leak Detection Dashboard Logic
// Complete 2-Node Bi-Directional Architecture & Dual-Cable Engine

document.addEventListener('DOMContentLoaded', () => {
  // Scenario Buttons
  const simNormalBtn = document.getElementById('simNormalBtn');
  const simRuptureBtn = document.getElementById('simRuptureBtn');
  const simMediumBtn = document.getElementById('simMediumBtn');
  const simRainBtn = document.getElementById('simRainBtn');
  const simCutBtn = document.getElementById('simCutBtn');
  const triggerBurstBtn = document.getElementById('triggerBurstBtn');

  // Cable Toggle Buttons
  const btnSelectRibbon = document.getElementById('btnSelectRibbon');
  const btnSelectCoax = document.getElementById('btnSelectCoax');
  const activeCableText = document.getElementById('activeCableText');
  const cableVisualTag = document.getElementById('cableVisualTag');
  const cableCrossSection = document.getElementById('cableCrossSection');
  const compSelectedHead = document.getElementById('compSelectedHead');
  const compOtherHead = document.getElementById('compOtherHead');
  const compTableBody = document.getElementById('compTableBody');

  // Modal elements
  const shareModalBtn = document.getElementById('shareModalBtn');
  const shareModal = document.getElementById('shareModal');
  const closeModalBtn = document.getElementById('closeModalBtn');
  const modalOkBtn = document.getElementById('modalOkBtn');

  // Pipeline Display Elements
  const pinpointMarker = document.getElementById('pinpointMarker');
  const pinpointDot = document.getElementById('pinpointDot');
  const pinpointRipple = document.getElementById('pinpointRipple');
  const calloutTitle = document.getElementById('calloutTitle');
  const calloutDist = document.getElementById('calloutDist');
  const calloutRef = document.getElementById('calloutRef');
  const calloutNodeOffset = document.getElementById('calloutNodeOffset');
  const calloutFreq = document.getElementById('calloutFreq');
  const calloutConf = document.getElementById('calloutConf');
  const calloutRelay = document.getElementById('calloutRelay');
  const mainSystemBadge = document.getElementById('mainSystemBadge');
  const pipePressureVal = document.getElementById('pipePressureVal');
  const flowVelocityVal = document.getElementById('flowVelocityVal');
  const estimatedLossVal = document.getElementById('estimatedLossVal');
  const activeSectorVal = document.getElementById('activeSectorVal');

  // LoRa Relay Waves
  const waveHop1 = document.getElementById('waveHop1');
  const waveHop2 = document.getElementById('waveHop2');

  // Ring Oscillator & TDR Metrics
  const ringFreqVal = document.getElementById('ringFreqVal');
  const ringTauVal = document.getElementById('ringTauVal');
  const calcDistanceVal = document.getElementById('calcDistanceVal');

  // Telemetry Console & Logic Cards
  const telemetryJsonBox = document.getElementById('telemetryJsonBox');
  const decBoxBurst = document.getElementById('decBoxBurst');
  const decBoxMedium = document.getElementById('decBoxMedium');
  const decBoxRain = document.getElementById('decBoxRain');
  const decBoxCut = document.getElementById('decBoxCut');
  const logTableBody = document.getElementById('logTableBody');
  const clearLogBtn = document.getElementById('clearLogBtn');

  // Canvas context for light-theme oscilloscope
  const canvas = document.getElementById('tdrCanvas');
  const ctx = canvas.getContext('2d');

  // System State
  let currentMode = 'NORMAL'; // 'NORMAL', 'BURST', 'MEDIUM', 'RAIN', 'CUT'
  let targetDistanceM = 6800; // 6.8 km default burst
  let activeCableType = 'RIBBON'; // 'RIBBON' or 'COAX'
  let animPhase = 0;
  let animFrameId = null;

  // Signal propagation speed: v ≈ 0.207 m/ns (2.07 x 10^8 m/s)
  const V_PROP = 2.07e8;

  // Format Time
  function getTimeString() {
    return new Date().toTimeString().split(' ')[0];
  }

  // Draw Light-Theme Oscilloscope
  function renderScope() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const w = canvas.width;
    const h = canvas.height;
    const midY = h / 2 + 10;

    // 1. Light Pearl Background Grid
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    for (let x = 0; x < w; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y < h; y += 30) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    // Baseline axis
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, midY);
    ctx.lineTo(w, midY);
    ctx.stroke();

    // 2. Incident Reference Pulse (Blue)
    ctx.strokeStyle = '#93c5fd';
    ctx.lineWidth = 1.8;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    for (let x = 0; x < w; x++) {
      let y = midY;
      // Launch pulse at x = 35
      if (x >= 20 && x <= 50) {
        let diff = (x - 35) / 5;
        y -= Math.exp(-diff * diff) * 60;
      }
      // Far end open reflection at x ~ w - 35
      if (x >= w - 50 && x <= w - 20) {
        let diff = (x - (w - 35)) / 5;
        y -= Math.exp(-diff * diff) * 55;
      }
      y += Math.sin(x * 0.12) * 0.6;
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.setLineDash([]);

    // 3. Live Trace (Teal for normal, Red/Teal with Dip for wet, or Step for cut)
    if (currentMode === 'BURST') ctx.strokeStyle = '#dc2626';
    else if (currentMode === 'MEDIUM') ctx.strokeStyle = '#ea580c';
    else if (currentMode === 'RAIN') ctx.strokeStyle = '#0d9488';
    else if (currentMode === 'CUT') ctx.strokeStyle = '#f59e0b';
    else ctx.strokeStyle = '#059669';

    ctx.lineWidth = 2.2;
    ctx.beginPath();

    const leakX = 35 + ((targetDistanceM / 10000) * (w - 70));
    const dipDepth = (activeCableType === 'RIBBON') ? 54 : 26; // Ribbon gives 85% dip vs 30% coax!

    for (let x = 0; x < w; x++) {
      let y = midY;
      // Launch pulse
      if (x >= 20 && x <= 50) {
        let diff = (x - 35) / 5;
        y -= Math.exp(-diff * diff) * 60;
      }

      // If Wet (BURST, MEDIUM, or RAIN)
      if (currentMode === 'BURST' || currentMode === 'MEDIUM' || currentMode === 'RAIN') {
        let spread = (currentMode === 'RAIN') ? 28 : (currentMode === 'MEDIUM' ? 9 : 6);
        let depth = (currentMode === 'RAIN') ? 18 : (currentMode === 'MEDIUM' ? dipDepth * 0.7 : dipDepth);

        if (x >= leakX - (spread * 3) && x <= leakX + (spread * 3)) {
          let diff = (x - leakX) / spread;
          y += Math.exp(-diff * diff) * depth; // Downward reflection (Negative Γ)
        }
      }

      // If Cable Cut at 8.2 km (x ~ 82%)
      if (currentMode === 'CUT') {
        const cutX = 35 + (0.82 * (w - 70));
        if (x >= cutX - 20 && x <= cutX + 20) {
          let diff = (x - cutX) / 6;
          y -= Math.exp(-diff * diff) * 65; // Positive reflection from cut!
        }
      }

      // Far end reflection (only reaches end if line intact)
      if (currentMode !== 'CUT') {
        if (x >= w - 50 && x <= w - 20) {
          let diff = (x - (w - 35)) / 5;
          let amp = (currentMode === 'BURST') ? 18 : (currentMode === 'MEDIUM' ? 32 : 55);
          y -= Math.exp(-diff * diff) * amp;
        }
      }

      // Live trace subtle jitter
      y += Math.cos(x * 0.1 + animPhase) * 0.7;

      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // 4. Differential Signal Trace (Red line showing ΔΓ)
    if (currentMode === 'BURST' || currentMode === 'MEDIUM') {
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      for (let x = 0; x < w; x++) {
        let y = midY;
        if (x >= leakX - 25 && x <= leakX + 25) {
          let diff = (x - leakX) / 6;
          let dAmp = (currentMode === 'BURST') ? 50 : 35;
          y += Math.exp(-diff * diff) * dAmp;
        }
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }

    // Callout text on canvas
    if (currentMode !== 'NORMAL') {
      ctx.fillStyle = '#0f172a';
      ctx.font = '600 11px JetBrains Mono';
      let labelText = (currentMode === 'BURST') ? 'ΔΓ = -0.85 (Impedance Collapse 15Ω)' :
                      (currentMode === 'MEDIUM') ? 'ΔΓ = -0.58 (Medium Joint Seep)' :
                      (currentMode === 'RAIN') ? 'ΔΓ = -0.22 (Diffuse Rain Soil Moisture)' : 'ΔΓ = +1.0 (Open Circuit Severed)';
      ctx.fillText(labelText, Math.max(40, Math.min(w - 280, leakX - 80)), 28);
    }

    animPhase += 0.04;
    animFrameId = requestAnimationFrame(renderScope);
  }

  // Start rendering scope
  renderScope();

  // Reset Highlight Decision Boxes
  function resetDecisionBoxes() {
    decBoxBurst.className = 'decision-box';
    decBoxMedium.className = 'decision-box';
    decBoxRain.className = 'decision-box';
    decBoxCut.className = 'decision-box';
    waveHop1.classList.remove('active');
    waveHop2.classList.remove('active');
  }

  // Update Active Button in Bar
  function setActiveSimBtn(activeBtn) {
    [simNormalBtn, simRuptureBtn, simMediumBtn, simRainBtn, simCutBtn].forEach(b => b.classList.remove('active'));
    activeBtn.classList.add('active');
  }

  // Add Log Entry
  function addLogRow(severity, sectorNode, condition, dist, confidence, actionText) {
    const tr = document.createElement('tr');
    let badgeClass = 'badge-ok';
    if (severity === 'BURST') badgeClass = 'badge-danger';
    else if (severity === 'MEDIUM') badgeClass = 'badge-warning';
    else if (severity === 'RAIN') badgeClass = 'badge-ok';
    else if (severity === 'CUT') badgeClass = 'badge-warning';

    tr.innerHTML = `
      <td>${getTimeString()}</td>
      <td><strong>${sectorNode}</strong></td>
      <td><span class="badge-status ${badgeClass}">${condition}</span></td>
      <td>${dist}</td>
      <td>${actionText}</td>
      <td><strong>${confidence}</strong></td>
    `;
    logTableBody.insertBefore(tr, logTableBody.firstChild);
  }

  // 1. Scenario: Normal Standby
  function setNormalMode() {
    currentMode = 'NORMAL';
    setActiveSimBtn(simNormalBtn);
    resetDecisionBoxes();

    mainSystemBadge.textContent = 'ALL SYSTEMS NORMAL';
    mainSystemBadge.className = 'system-badge badge-normal';

    pipePressureVal.textContent = '4.20 Bar';
    pipePressureVal.style.color = 'var(--text-main)';
    flowVelocityVal.textContent = '1.45 m/s';
    estimatedLossVal.textContent = '0 L/hr';
    activeSectorVal.textContent = 'All Normal (PoT 24V Active)';

    pinpointMarker.style.display = 'none';

    ringFreqVal.textContent = '20.70 kHz (Dry End)';
    ringTauVal.textContent = '12.08 μs';
    calcDistanceVal.textContent = '-- m';

    telemetryJsonBox.textContent = JSON.stringify({
      network: "JAL_JEEVAN_LORA_865",
      gateway_node: "NODE_0_HEADWORKS",
      reporting_nodes: ["FIELD_NODE_1_KM2.5", "FIELD_NODE_2_KM7.5"],
      active_sectors: ["SECTOR_1_0_TO_5KM", "SECTOR_2_5_TO_10KM"],
      power_architecture: "POWER_OVER_TRENCH_24V",
      ups_battery_status: "FLOAT_CHARGED_3.65V",
      pressure_bar: 4.20,
      active_cable: activeCableType === 'RIBBON' ? "FLAT_GEOTEXTILE_RIBBON" : "DIY_POROUS_COAXIAL",
      status: "NORMAL_STANDBY",
      timestamp: new Date().toISOString()
    }, null, 2);

    addLogRow('NORMAL', 'SECTOR 1 & 2', 'Heartbeat Normal', '--', '100%', 'Power-over-Trench 24V verified. Telemetry synced with LoRa gateway.');
  }

  // 2. Scenario: Critical Pipe Burst at 6.80 km (Sector 2 - Node 2 Left Port)
  function setBurstMode() {
    currentMode = 'BURST';
    targetDistanceM = 6800; // 6.8 km
    setActiveSimBtn(simRuptureBtn);
    resetDecisionBoxes();
    decBoxBurst.classList.add('highlight-burst');

    // Activate LoRa Multi-Hop Relay animation: Node 2 -> Node 1 -> Gateway
    waveHop2.classList.add('active');
    waveHop1.classList.add('active');

    mainSystemBadge.textContent = 'CRITICAL: PIPE BURST AT 6.80 KM (SECTOR 2)';
    mainSystemBadge.className = 'system-badge badge-danger';

    pipePressureVal.textContent = '2.45 Bar (-1.75 Bar Collapse)';
    pipePressureVal.style.color = '#dc2626';
    flowVelocityVal.textContent = '2.25 m/s (Surge)';
    estimatedLossVal.textContent = '4,800 L/hr';
    activeSectorVal.textContent = 'SECTOR 2 (km 5.0 to 10.0)';

    // Position pinpoint marker at 68%
    pinpointMarker.style.display = 'block';
    pinpointMarker.style.left = '68%';
    pinpointDot.style.background = '#dc2626';
    pinpointRipple.style.borderColor = '#dc2626';

    calloutTitle.textContent = 'PIPE BURST CONFIRMED (RED DOT)';
    calloutTitle.style.color = '#dc2626';
    calloutDist.textContent = '6,800 m (km 6.80)';
    calloutRef.textContent = 'Sector 2 (Node 2 Left Port)';
    calloutNodeOffset.textContent = '700 m West of Node 2 (km 7.5)';
    calloutFreq.textContent = '73.93 kHz';
    calloutConf.textContent = '99.4%';
    calloutConf.style.color = '#059669';
    calloutRelay.textContent = 'Node 2 → Node 1 → Gateway 0';

    // Ring-Oscillator Calculation: local distance = 700m
    // f = v / (4 * d) = 2.07e8 / (4 * 700) = 73,928 Hz = 73.93 kHz
    ringFreqVal.textContent = '73.93 kHz (Wet Resonant)';
    ringTauVal.textContent = '3.38 μs (One-Way)';
    calcDistanceVal.textContent = '6,800 m (Pit 2 - 700m)';

    telemetryJsonBox.textContent = JSON.stringify({
      network: "JAL_JEEVAN_LORA_865",
      alarm_severity: "CRITICAL_BURST",
      detecting_node: "FIELD_NODE_2 (km 7.5)",
      sensing_channel: "PORT_A_LEFT_WEST",
      local_offset_m: 700.0,
      global_pipeline_m: 6800.0,
      ring_oscillator_freq_khz: 73.93,
      pressure_bar: 2.45,
      pressure_drop_pct: 41.7,
      cable_type: activeCableType === 'RIBBON' ? "FLAT_GEOTEXTILE_RIBBON" : "DIY_POROUS_COAXIAL",
      relay_hops: ["NODE_2 (km 7.5)", "NODE_1 (km 2.5)", "GATEWAY_0 (km 0.0)"],
      action: "EMERGENCY_SMS_DISPATCH_SENT",
      timestamp: new Date().toISOString()
    }, null, 2);

    addLogRow('BURST', 'SECTOR 2 (N2)', 'PIPE BURST CONFIRMED', '6.80 km (Pit 2 - 700m)', '99.4%', 'LoRa Multi-Hop relayed via Node 1 to Gateway 0. SMS sent to repair engineers.');
  }

  // 3. Scenario: Medium Joint Leak at 3.40 km (Sector 1 - Node 1 Right Port)
  function setMediumMode() {
    currentMode = 'MEDIUM';
    targetDistanceM = 3400; // 3.4 km
    setActiveSimBtn(simMediumBtn);
    resetDecisionBoxes();
    decBoxMedium.classList.add('highlight-medium');

    // Hop 1 active (Node 1 -> Gateway)
    waveHop1.classList.add('active');

    mainSystemBadge.textContent = 'WARNING: MEDIUM JOINT LEAK AT 3.40 KM';
    mainSystemBadge.className = 'system-badge badge-warning';

    pipePressureVal.textContent = '3.65 Bar (-0.55 Bar Drop)';
    pipePressureVal.style.color = '#ea580c';
    flowVelocityVal.textContent = '1.70 m/s';
    estimatedLossVal.textContent = '1,200 L/hr';
    activeSectorVal.textContent = 'SECTOR 1 (km 0.0 to 5.0)';

    // Position pinpoint marker at 34%
    pinpointMarker.style.display = 'block';
    pinpointMarker.style.left = '34%';
    pinpointDot.style.background = '#ea580c';
    pinpointRipple.style.borderColor = '#ea580c';

    calloutTitle.textContent = 'MEDIUM JOINT LEAK LOCATED';
    calloutTitle.style.color = '#ea580c';
    calloutDist.textContent = '3,400 m (km 3.40)';
    calloutRef.textContent = 'Sector 1 (Node 1 Right Port)';
    calloutNodeOffset.textContent = '900 m East of Node 1 (km 2.5)';
    calloutFreq.textContent = '57.50 kHz';
    calloutConf.textContent = '97.8%';
    calloutConf.style.color = '#059669';
    calloutRelay.textContent = 'Node 1 → Gateway 0 (Direct)';

    // local distance = 900m
    // f = 2.07e8 / (4 * 900) = 57,500 Hz = 57.50 kHz
    ringFreqVal.textContent = '57.50 kHz';
    ringTauVal.textContent = '4.35 μs (One-Way)';
    calcDistanceVal.textContent = '3,400 m (Pit 1 + 900m)';

    telemetryJsonBox.textContent = JSON.stringify({
      network: "JAL_JEEVAN_LORA_865",
      alarm_severity: "MEDIUM_JOINT_LEAK",
      detecting_node: "FIELD_NODE_1 (km 2.5)",
      sensing_channel: "PORT_B_RIGHT_EAST",
      local_offset_m: 900.0,
      global_pipeline_m: 3400.0,
      ring_oscillator_freq_khz: 57.50,
      pressure_bar: 3.65,
      pressure_drop_pct: 13.1,
      cable_type: activeCableType === 'RIBBON' ? "FLAT_GEOTEXTILE_RIBBON" : "DIY_POROUS_COAXIAL",
      relay_hops: ["NODE_1 (km 2.5)", "GATEWAY_0 (km 0.0)"],
      action: "HIGH_PRIORITY_MAINTENANCE_DISPATCH",
      timestamp: new Date().toISOString()
    }, null, 2);

    addLogRow('MEDIUM', 'SECTOR 1 (N1)', 'Joint Leak Located', '3.40 km (Pit 1 + 900m)', '97.8%', 'Direct LoRa packet sent to Gateway. Maintenance team notified.');
  }

  // 4. Scenario: Monsoon Rain Filter (Suppressed False Alarm)
  function setRainMode() {
    currentMode = 'RAIN';
    targetDistanceM = 1500; // 1.5 km
    setActiveSimBtn(simRainBtn);
    resetDecisionBoxes();
    decBoxRain.classList.add('highlight-rain');

    mainSystemBadge.textContent = 'RAIN DETECTED: FALSE ALARM FILTERED';
    mainSystemBadge.className = 'system-badge badge-warning';

    pipePressureVal.textContent = '4.22 Bar (Nominal & Stable)';
    pipePressureVal.style.color = '#059669';
    flowVelocityVal.textContent = '1.45 m/s';
    estimatedLossVal.textContent = '0 L/hr';
    activeSectorVal.textContent = 'SECTOR 1 (Soil Saturated)';

    pinpointMarker.style.display = 'block';
    pinpointMarker.style.left = '15%';
    pinpointDot.style.background = '#d97706';
    pinpointRipple.style.borderColor = '#d97706';

    calloutTitle.textContent = 'MONSOON RAIN (FALSE ALARM FILTERED)';
    calloutTitle.style.color = '#d97706';
    calloutDist.textContent = '1,500 m (Ground Moisture)';
    calloutRef.textContent = 'Diffuse Soil Saturation (> 800m)';
    calloutNodeOffset.textContent = 'Internal Line Pressure 100% Intact';
    calloutFreq.textContent = 'Broad Wave Slope';
    calloutConf.textContent = '100% (No Pipe Leak)';
    calloutConf.style.color = '#059669';
    calloutRelay.textContent = 'Alert Suppressed (Logged Only)';

    ringFreqVal.textContent = 'Broad Gradient Slope';
    ringTauVal.textContent = 'Diffuse Reflection';
    calcDistanceVal.textContent = 'No Point Fault';

    telemetryJsonBox.textContent = JSON.stringify({
      network: "JAL_JEEVAN_LORA_865",
      alarm_severity: "SUPPRESSED_NO_ALARM",
      event_type: "ENVIRONMENTAL_MONSOON_RAIN",
      spatial_spread_m: 850.0,
      pressure_bar: 4.22,
      pressure_drop_pct: 0.0,
      decision_rule: "CABLE_WET_BUT_INTERNAL_PRESSURE_STABLE",
      verdict: "FALSE_ALARM_AUTOMATICALLY_SUPPRESSED",
      timestamp: new Date().toISOString()
    }, null, 2);

    addLogRow('RAIN', 'SECTOR 1', 'Rain Saturation Detected', '1.50 km', '100%', 'Groundwater soaking detected over 850m. Pipe pressure intact. False alarm suppressed.');
  }

  // 5. Scenario: Cable Cut / Tamper
  function setCutMode() {
    currentMode = 'CUT';
    targetDistanceM = 8200; // 8.2 km
    setActiveSimBtn(simCutBtn);
    resetDecisionBoxes();
    decBoxCut.classList.add('highlight-medium');

    mainSystemBadge.textContent = 'FAULT: SENSING LINE SEVERED AT 8.20 KM';
    mainSystemBadge.className = 'system-badge badge-warning';

    pipePressureVal.textContent = '4.20 Bar (Pipe OK)';
    pipePressureVal.style.color = 'var(--text-main)';
    flowVelocityVal.textContent = '1.45 m/s';
    estimatedLossVal.textContent = '0 L/hr';
    activeSectorVal.textContent = 'SECTOR 2 (Line Break)';

    pinpointMarker.style.display = 'block';
    pinpointMarker.style.left = '82%';
    pinpointDot.style.background = '#f59e0b';
    pinpointRipple.style.borderColor = '#f59e0b';

    calloutTitle.textContent = 'CABLE CUT / TAMPER LOCATED';
    calloutTitle.style.color = '#d97706';
    calloutDist.textContent = '8,200 m (km 8.20)';
    calloutRef.textContent = 'Sector 2 (Node 2 Right Port)';
    calloutNodeOffset.textContent = '700 m East of Node 2 (km 7.5)';
    calloutFreq.textContent = 'Open Circuit (Γ = +1.0)';
    calloutConf.textContent = '99.5%';
    calloutConf.style.color = '#059669';
    calloutRelay.textContent = 'Node 2 → Node 1 → Gateway';

    ringFreqVal.textContent = '73.93 kHz (Open Edge)';
    ringTauVal.textContent = '3.38 μs';
    calcDistanceVal.textContent = '8,200 m (Cable Cut)';

    telemetryJsonBox.textContent = JSON.stringify({
      network: "JAL_JEEVAN_LORA_865",
      alarm_severity: "CABLE_SEVERED_FAULT",
      detecting_node: "FIELD_NODE_2 (km 7.5)",
      sensing_channel: "PORT_B_RIGHT_EAST",
      reflection_type: "POSITIVE_EDGE_OPEN_CIRCUIT",
      local_offset_m: 700.0,
      global_cut_location_m: 8200.0,
      pipe_pressure_bar: 4.20,
      action: "CABLE_REPAIR_CREW_NOTIFIED",
      timestamp: new Date().toISOString()
    }, null, 2);

    addLogRow('CUT', 'SECTOR 2 (N2)', 'Cable Cut / Tamper', '8.20 km (Pit 2 + 700m)', '99.5%', 'Open circuit positive reflection detected. Dispatched technician to splice wire.');
  }

  // Dual-Cable Toggle Functions
  function updateCableComparator(type) {
    activeCableType = type;
    if (type === 'RIBBON') {
      btnSelectRibbon.classList.add('active');
      btnSelectCoax.classList.remove('active');
      activeCableText.textContent = 'Flat Geotextile Ribbon (< ₹6/m)';
      cableVisualTag.textContent = 'Flat Porous Geotextile Ribbon (Strapped to pipe invert at 6 o\'clock)';

      cableCrossSection.innerHTML = `
        <div class="cable-art ribbon-art">
          <div class="geotextile-strip">
            <div class="cca-wire wire-1" title="CCA Wire 1 (0.6mm)"></div>
            <span class="spacing-indicator">8 mm Spacing (High Impedance Z₀ ≈ 180Ω)</span>
            <div class="cca-wire wire-2" title="CCA Wire 2 (0.6mm)"></div>
          </div>
          <div class="pipe-contact-label">Flat Flush Contact with Pipe Bottom Invert (6 o'clock) — Catches 100% of Drips!</div>
        </div>
      `;

      compSelectedHead.textContent = 'Flat Geotextile Ribbon (Primary)';
      compOtherHead.textContent = 'DIY Porous Coaxial (Benchmark)';

      compTableBody.innerHTML = `
        <tr>
          <td><strong>Material Cost per Meter</strong></td>
          <td class="highlight-good"><strong>₹5.50 / meter</strong></td>
          <td>₹28.00 / meter</td>
        </tr>
        <tr>
          <td><strong>10 km Cable Total Cost</strong></td>
          <td class="highlight-good"><strong>₹55,000 Total</strong></td>
          <td>₹2,80,000 Total</td>
        </tr>
        <tr>
          <td><strong>Pipe Invert Surface Contact</strong></td>
          <td class="highlight-good"><strong>Wide Flat Flush (20 mm)</strong></td>
          <td>Hairline Tangent (Round cylinder)</td>
        </tr>
        <tr>
          <td><strong>Drip Capture Speed</strong></td>
          <td class="highlight-good"><strong>Instant Capillary Wicking (&lt; 2s)</strong></td>
          <td>Requires Puddle Accumulation</td>
        </tr>
        <tr>
          <td><strong>Impedance Reflection Drop</strong></td>
          <td class="highlight-good"><strong>180Ω → 15Ω (85% Dip!)</strong></td>
          <td>50Ω → 25Ω (30% Dip)</td>
        </tr>
        <tr>
          <td><strong>Corrosion Resistance</strong></td>
          <td class="highlight-good"><strong>100% Rust-Proof (Polypropylene)</strong></td>
          <td>Good (Tinned Copper)</td>
        </tr>
      `;
    } else {
      btnSelectCoax.classList.add('active');
      btnSelectRibbon.classList.remove('active');
      activeCableText.textContent = 'DIY Porous Coaxial (₹28/m)';
      cableVisualTag.textContent = 'DIY Porous Coaxial Cable (Traditional Shielded RF Benchmark)';

      cableCrossSection.innerHTML = `
        <div class="cable-art coax-art" style="text-align: center;">
          <div style="display: inline-block; width: 64px; height: 64px; border-radius: 50%; border: 3px dashed #94a3b8; background: #e2e8f0; position: relative; padding: 10px;">
            <div style="width: 38px; height: 38px; border-radius: 50%; background: #ffffff; border: 2px solid #cbd5e1; margin: 3px auto; position: relative;">
              <div style="width: 14px; height: 14px; border-radius: 50%; background: #b45309; margin: 10px auto;"></div>
            </div>
          </div>
          <div style="font-size: 0.72rem; color: #475569; font-weight: 600; margin-top: 0.35rem;">
            Circular Concentric Coax (Inner Copper + Wicking Core + Outer Shield)
          </div>
          <div class="pipe-contact-label" style="color: #64748b;">
            Hairline Tangent Contact with Pipe Invert (Benchmark Reference)
          </div>
        </div>
      `;

      compSelectedHead.textContent = 'DIY Porous Coaxial (Selected)';
      compOtherHead.textContent = 'Flat Geotextile Ribbon (Alternative)';

      compTableBody.innerHTML = `
        <tr>
          <td><strong>Material Cost per Meter</strong></td>
          <td>₹28.00 / meter</td>
          <td class="highlight-good"><strong>₹5.50 / meter</strong></td>
        </tr>
        <tr>
          <td><strong>10 km Cable Total Cost</strong></td>
          <td>₹2,80,000 Total</td>
          <td class="highlight-good"><strong>₹55,000 Total</strong></td>
        </tr>
        <tr>
          <td><strong>Pipe Invert Surface Contact</strong></td>
          <td>Hairline Tangent (Round cylinder)</td>
          <td class="highlight-good"><strong>Wide Flat Flush (20 mm)</strong></td>
        </tr>
        <tr>
          <td><strong>Drip Capture Speed</strong></td>
          <td>Requires Puddle Accumulation</td>
          <td class="highlight-good"><strong>Instant Capillary Wicking (&lt; 2s)</strong></td>
        </tr>
        <tr>
          <td><strong>Impedance Reflection Drop</strong></td>
          <td>50Ω → 25Ω (30% Dip)</td>
          <td class="highlight-good"><strong>180Ω → 15Ω (85% Dip!)</strong></td>
        </tr>
        <tr>
          <td><strong>Corrosion Resistance</strong></td>
          <td>Good (Tinned Copper)</td>
          <td class="highlight-good"><strong>100% Rust-Proof (Polypropylene)</strong></td>
        </tr>
      `;
    }
  }

  // =========================================================
  // Interactive Node & Chamber Inspector
  // =========================================================
  const nodeInspectorTray = document.getElementById('nodeInspectorTray');
  const inspBadge = document.getElementById('inspBadge');
  const inspTitle = document.getElementById('inspTitle');
  const inspBody = document.getElementById('inspBody');
  const nodeTabBtns = document.querySelectorAll('.node-tab-btn');
  const nodePins = document.querySelectorAll('.node-marker');
  const rulerTicks = document.querySelectorAll('.clickable-tick');

  const nodeData = {
    'G0': {
      title: 'Central Gateway Node 0 (km 0.0) — Headworks Solar Master Station',
      badge: 'CENTRAL MASTER GATEWAY',
      enclosure: 'IP66 Weatherproof Mast Cabinet (Above Ground at Pump Station)',
      rf: 'ESP32-S3 Master + SX1276 LoRa 865 MHz + SIM7600 4G LTE Modem',
      power: '50W Solar Panel + 12V 20Ah LiFePO4 Battery + 24V DC Trench Power Injector',
      coverage: 'Central Uplink Coordinator: Receives LoRa telemetry from 10 km network, forwards to Cloud MQTT Broker, and triggers automated SMS/WhatsApp alerts.',
      ports: 'Master Station (0.0 km Line Origin) · 24V Trench Power Source · Cloud Relay'
    },
    'N1': {
      title: 'Field Node 1 (Pit 1 at km 2.50) — Bi-Directional TDR Unit',
      badge: 'SECTOR 1 BI-DIRECTIONAL NODE',
      enclosure: 'IP68 Hermetically Sealed Chamber (Submersible to 2m, Underground Pit 1)',
      rf: 'ESP32 240MHz + 74LVC14 Schmitt Inverter Ring-Oscillator + ADG902 RF Switch + SX1276 LoRa',
      power: '24V DC Power-over-Trench Input with Buck Converter + 3.65V LiFePO4 Micro-UPS (30-Day Backup)',
      coverage: 'Sector 1 (0.0 to 5.0 km): Port A monitors West 0–2.5 km; Port B monitors East 2.5–5.0 km.',
      ports: 'Direct 1-Hop LoRa Link to Gateway 0 (2.5 km LOS, RSSI -82 dBm) · Packet Relay for Node 2'
    },
    'MID': {
      title: 'Pipeline Midpoint (Pit 3 at km 5.00) — Passive Sector Boundary',
      badge: 'PASSIVE JUNCTION CHAMBER',
      enclosure: 'Underground Valve Chamber with Passive Gel-Filled Junction Splice Box',
      rf: 'Passive RF Demarcation (Zero Active Electronics Required — 100% Maintenance Free)',
      power: 'Continuous 24V DC Power-over-Trench Pass-Through Line',
      coverage: 'Demarcates Sector 1 (0 to 5 km) from Sector 2 (5 to 10 km). Isolates TDR reflection pulses so Sector 1 and Sector 2 never collide or interfere.',
      ports: 'Passive Splice Box · Pressure Transducer Port · Midline Bleeder Valve'
    },
    'N2': {
      title: 'Field Node 2 (Pit 4 at km 7.50) — Bi-Directional TDR Unit',
      badge: 'SECTOR 2 BI-DIRECTIONAL NODE',
      enclosure: 'IP68 Hermetically Sealed Chamber (Submersible to 2m, Underground Pit 4)',
      rf: 'ESP32 240MHz + 74LVC14 Schmitt Inverter Ring-Oscillator + ADG902 RF Switch + SX1276 LoRa',
      power: '24V DC Power-over-Trench Input + 3.65V LiFePO4 Micro-UPS (30-Day Backup Buffer)',
      coverage: 'Sector 2 (5.0 to 10.0 km): Port A monitors West 5.0–7.5 km; Port B monitors East 7.5–10.0 km.',
      ports: 'LoRa Multi-Hop Forwarder: Transmits packets to Node 1 (km 2.5), which forwards them to Gateway 0 (km 0.0)'
    },
    'TAIL': {
      title: 'Tail End Terminal (Pit 5 at km 10.00) — Line Termination Pit',
      badge: 'LINE TERMINATION & TEST POINT',
      enclosure: 'Terminal Inspection Valve Pit at 10.0 km Distribution Boundary',
      rf: 'Passive 180Ω Characteristic Impedance Terminator (or Open Circuit Reference)',
      power: '24V Auxiliary Power Line Termination Resistor / Loop Test Point',
      coverage: 'Provides fixed baseline reflection reference for calibration and terminal pressure monitoring.',
      ports: 'Terminal Calibration Ref · Manual Drain Valve · End-of-Line Test Port'
    }
  };

  function selectNodeInspector(nodeKey) {
    const data = nodeData[nodeKey];
    if (!data) return;

    inspBadge.textContent = data.badge;
    inspTitle.textContent = data.title;

    inspBody.innerHTML = `
      <div class="insp-grid">
        <div class="insp-col">
          <div class="insp-col-title">Chamber & Enclosure</div>
          <div class="insp-col-value">${data.enclosure}</div>
          <div class="insp-col-desc">Industrial waterproof sealing for harsh underground road trench conditions.</div>
        </div>
        <div class="insp-col">
          <div class="insp-col-title">RF & Sensing Engine</div>
          <div class="insp-col-value">${data.rf}</div>
          <div class="insp-col-desc">Solid-state high-speed RF multiplexer + sub-nanosecond Schmitt trigger delay loop.</div>
        </div>
        <div class="insp-col">
          <div class="insp-col-title">Power Architecture</div>
          <div class="insp-col-value">${data.power}</div>
          <div class="insp-col-desc">Continuous 24V DC auxiliary line eliminates battery deaths; micro-UPS buffers blackouts.</div>
        </div>
        <div class="insp-col">
          <div class="insp-col-title">Coverage & Telemetry Link</div>
          <div class="insp-col-value">${data.coverage}</div>
          <div class="insp-col-desc"><strong>RF Link:</strong> ${data.ports}</div>
        </div>
      </div>
    `;

    nodeTabBtns.forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-node') === nodeKey);
    });
  }

  nodeTabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      selectNodeInspector(btn.getAttribute('data-node'));
    });
  });

  nodePins.forEach(pin => {
    pin.addEventListener('click', () => {
      const nodeKey = pin.getAttribute('data-node');
      selectNodeInspector(nodeKey);
    });
  });

  rulerTicks.forEach(tick => {
    tick.addEventListener('click', () => {
      const nodeKey = tick.getAttribute('data-node');
      selectNodeInspector(nodeKey);
    });
  });

  // =========================================================
  // Interactive End-to-End Architecture & Data Flow Chain
  // =========================================================
  const flowBlocks = document.querySelectorAll('.flow-block');
  const flowDetailDrawer = document.getElementById('flowDetailDrawer');

  const flowData = {
    '1': {
      title: 'Stage 1: Invert Water Drip (Gravity Dynamics at 6 o\'clock)',
      tag: 'FLUID MECHANICS',
      desc: 'Pressurized water escaping from cracks or faulty gasket joints adheres to the pipe circumference and drains down to the lowest invert point (6 o\'clock) under gravity. Even micro-leaks (under 50 L/hr) accumulate here within seconds before permeating surrounding soil.',
      specs: [
        ['Pipe Geometry', 'HDPE / DI / PVC Trunk (Ø 200 mm)'],
        ['Gravity Drainage Invert', '6 o\'clock Bottom Position (360° drip collection)'],
        ['Accumulation Time', '< 2 seconds to saturate invert ribbon']
      ]
    },
    '2': {
      title: 'Stage 2: Flat Porous Geotextile Ribbon (Dielectric Permittivity Jump)',
      tag: 'MATERIAL PHYSICS',
      desc: 'The porous non-woven polypropylene geotextile ribbon has 20 mm wide flush contact with the pipe invert. Escaping water wicks into the dielectric core. Water\'s relative permittivity (εᵣ ≈ 80) dwarfs dry soil (εᵣ ≈ 2.1), causing characteristic impedance to collapse from 180Ω to 15Ω, triggering an 85% inverted reflection (Γ = -0.85).',
      specs: [
        ['Substrate', 'Non-Woven Porous Polypropylene (Rot-Proof)'],
        ['Conductors', 'Dual Parallel 0.6 mm Copper-Clad Aluminum (CCA)'],
        ['Impedance Drop', '180Ω (Dry) → 15Ω (Wet) — 85% Signal Dip']
      ]
    },
    '3': {
      title: 'Stage 3: ADG902 Solid-State RF Port Switch (Bi-Directional Sweep)',
      tag: 'RF MULTIPLEXING',
      desc: 'High-frequency TDR pulses experience line attenuation over 2.5+ km. Instead of doubling node count, an ADG902 high-isolation CMOS RF switch alternates every 30 seconds between Port A (West 2.5 km) and Port B (East 2.5 km), allowing 1 single field node to inspect 5.0 km of pipeline!',
      specs: [
        ['Switching Component', 'Analog Devices ADG902 (Wideband RF CMOS)'],
        ['Isolation', '> 40 dB at 100 MHz'],
        ['Node Reach', '2.5 km Left + 2.5 km Right = 5.0 km Total Coverage']
      ]
    },
    '4': {
      title: 'Stage 4: ₹50 Schmitt Inverter Ring-Oscillator Timing Engine',
      tag: 'TIMING INNOVATION',
      desc: 'Conventional TDR requires ₹30,000+ picosecond oscilloscopes or specialized TDC chips. Our solution: A single 74LVC14 Schmitt trigger inverter (₹15) feeds the reflected pulse back into its input, creating a self-sustaining resonant delay loop. Cable propagation delay is transformed directly into an oscillating frequency: f = v / (4 · d).',
      specs: [
        ['Inverter Chip', '74LVC14 Hex Schmitt-Trigger (₹15)'],
        ['Propagation Speed (v)', '2.07 × 10⁸ m/s (0.69 c in Polypropylene)'],
        ['Localization Precision', '±1.0 meter repeatable accuracy']
      ]
    },
    '5': {
      title: 'Stage 5: ESP32 Hardware Pulse Counter (PCNT Peripheral)',
      tag: 'EMBEDDED FIRMWARE',
      desc: 'An ESP32 microcontroller cannot sample nanosecond edges via ADC. However, its dedicated silicon Pulse Counter (PCNT) peripheral counts frequencies up to 40 MHz completely in hardware with zero CPU load. It reads the resonant ring frequency, averages 1,000 pulses, and calculates pinpoint distance in 100 milliseconds.',
      specs: [
        ['MCU', 'ESP32 Dual-Core Xtensa LX6 (240 MHz)'],
        ['Hardware Peripheral', 'PCNT (Pulse Counter up to 40 MHz)'],
        ['Measurement Time', '100 ms gate time (High precision averaging)']
      ]
    },
    '6': {
      title: 'Stage 6: SX1276 LoRa Transceiver (865 MHz Telemetry)',
      tag: 'LONG-RANGE RF',
      desc: 'When an anomaly is validated, the node packs a compact 12-byte binary payload containing NodeID, fault status, pinpoint distance, line pressure, and battery voltage. It transmits over the license-free 865–867 MHz India band at +14 dBm with Spreading Factor SF10, ensuring deep underground pit penetration.',
      specs: [
        ['Frequency Band', '865.0 – 867.0 MHz (India License-Free Band)'],
        ['Payload Size', '12 Bytes Packed Binary (Ultra-Low Airtime)'],
        ['Link Budget', '+148 dB (Penetrates heavy soil & cast iron pit covers)']
      ]
    },
    '7': {
      title: 'Stage 7: Autonomous LoRa Multi-Hop Mesh Relay',
      tag: 'NETWORK PROTOCOL',
      desc: 'Underground radio signals from Node 2 (km 7.5) cannot reach Gateway 0 (km 0.0) directly due to heavy terrain path loss. Node 2 uses a lightweight ad-hoc multi-hop forwarding protocol: Node 2 sends packets to Node 1 (km 2.5), which forwards them to Central Gateway 0 (km 0.0).',
      specs: [
        ['Hop 1', 'Node 2 (km 7.5) → Node 1 (km 2.5) — 5.0 km Link'],
        ['Hop 2', 'Node 1 (km 2.5) → Gateway 0 (km 0.0) — 2.5 km Link'],
        ['Packet Reliability', '> 99.8% end-to-end packet delivery']
      ]
    },
    '8': {
      title: 'Stage 8: Power-over-Trench (24V DC SELV + 30-Day Micro-UPS)',
      tag: 'POWER ARCHITECTURE',
      desc: 'Buried batteries die after 6–12 months, causing underground blind spots. Jal Jeevan runs an inexpensive 24V DC wire along the pipe trench from the Gateway\'s central solar station. Each node features a step-down buck converter and a 3.65V LiFePO4 micro-UPS providing 30 days of backup operation during trench maintenance.',
      specs: [
        ['Central Power', '50W Solar Mast + 12V LiFePO4 Station at Gateway'],
        ['Trench Line', '24V DC SELV (Safety Extra Low Voltage, Non-Hazardous)'],
        ['Internal Backup', '3.65V LiFePO4 Micro-UPS (30-day autonomous buffer)']
      ]
    },
    '9': {
      title: 'Stage 9: Cloud SCADA Dashboard & Field Crew Automated Dispatch',
      tag: 'MUNICIPAL OPERATIONS',
      desc: 'The Gateway connects to Cloud MQTT Broker over 4G LTE/Wi-Fi. The live dashboard updates instantly with leak global mark, hydraulic pressure drop, and map coordinates. Automated alerts are dispatched via SMS & WhatsApp to local repair crews with exact excavation coordinates (±1 m).',
      specs: [
        ['Cloud Protocol', 'MQTT / WebSockets Real-Time Stream'],
        ['Dispatch Interface', 'Automated SMS / WhatsApp API to Field Plumbers'],
        ['Excavation Footprint', 'Targeted 2-meter trench spot dig (Zero road destruction)']
      ]
    }
  };

  function selectFlowBlock(stageId) {
    const data = flowData[stageId];
    if (!data) return;

    flowBlocks.forEach(b => b.classList.toggle('active', b.getAttribute('data-flow') === stageId));

    let specsHtml = data.specs.map(s => `<li><span>${s[0]}:</span> <strong>${s[1]}</strong></li>`).join('');

    flowDetailDrawer.innerHTML = `
      <div class="drawer-header">
        <h4 class="drawer-title">${data.title}</h4>
        <span class="drawer-tag">${data.tag}</span>
      </div>
      <div class="drawer-grid">
        <div class="drawer-desc">
          <p>${data.desc}</p>
        </div>
        <div class="drawer-specs">
          <ul>${specsHtml}</ul>
        </div>
      </div>
    `;
  }

  flowBlocks.forEach(b => {
    b.addEventListener('click', () => {
      selectFlowBlock(b.getAttribute('data-flow'));
    });
  });

  // =========================================================
  // 4-Step Technical Walkthrough Tabs
  // =========================================================
  const wtTabBtns = document.querySelectorAll('.wt-tab-btn');
  const walkthroughContent = document.getElementById('walkthroughContent');

  const walkthroughData = {
    '1': {
      title: 'Step 1: Invert Placement & The Permittivity Jump (Maxwell\'s Physics)',
      body: `
        <p>In water distribution networks, underground pipes operate at 2 to 6 Bar pressure. When a rupture, joint slip, or pinhole leak occurs, water jets outward and—guided by gravity—accumulates at the <strong>bottom invert (6 o'clock position)</strong> of the pipe.</p>
        <p>Jal Jeevan straps a 20 mm wide non-woven porous geotextile ribbon directly against this invert line. The micro-capillary fibers wick escaping water instantly (< 2s). When water contacts the conductors, the dielectric constant jumps dramatically:</p>
        <div class="wt-formula-card">
          εᵣ (Dry Air / Soil) ≈ 2.1 &nbsp;⟶&nbsp; εᵣ (Escaping Water) ≈ 80.4<br>
          Z₀ = 180 Ω (Dry) &nbsp;⟶&nbsp; Z_L ≈ 15 Ω (Wet)<br>
          Reflection Coefficient: Γ = (Z_L − Z₀) / (Z_L + Z₀) = (15 − 180) / (15 + 180) = −0.846
        </div>
        <p>This 85% negative reflection pulse is the massive physical signature detected by our TDR engine.</p>
      `,
      header: 'CABLE PHYSICS ADVANTAGES',
      features: [
        '20 mm wide contact area catches 100% of downward drips',
        'Capillary wicking draws moisture even during low water pressure',
        'Polypropylene fabric is rot-proof, acid-proof, and microbial-resistant',
        'Sub-₹6/meter material cost enables 10 km deployment for ₹55,000'
      ]
    },
    '2': {
      title: 'Step 2: The ₹50 Schmitt Inverter Ring-Oscillator Timing Engine',
      body: `
        <p>A pulse traveling along our ribbon travels at <em>v</em> ≈ 0.207 m/ns (69% speed of light). For a leak 1,000 meters away, the round-trip time delay is just 9.66 microseconds. Measuring nanosecond delays usually demands ₹30,000+ laboratory oscilloscopes or expensive Time-to-Digital Converter (TDC) chips.</p>
        <p>Jal Jeevan replaces all complex timing instruments with a single <strong>74LVC14 Schmitt trigger inverter IC (₹15)</strong>. The reflected pulse from the leak recirculates through the inverter to form an active resonant oscillator loop:</p>
        <div class="wt-formula-card">
          Resonant Frequency: f = v / (4 · d)<br>
          Distance to Leak: d = v / (4 · f)
        </div>
        <p>The ESP32 microcontroller measures this frequency directly using its built-in hardware <strong>Pulse Counter (PCNT)</strong> peripheral up to 40 MHz with zero CPU overhead, achieving meter-level pinpoint localization!</p>
      `,
      header: 'TIMING ENGINE HIGHLIGHTS',
      features: [
        'Total circuit BOM cost under ₹50 (1x 74LVC14 + resistors/caps)',
        'Zero high-speed ADCs or picosecond timing chips required',
        'ESP32 PCNT counts up to 40 MHz purely in hardware',
        'Provides repeatable ±1.0 meter pinpoint distance accuracy'
      ]
    },
    '3': {
      title: 'Step 3: Bi-Directional RF Switching (5.0 km per Node)',
      body: `
        <p>High-frequency pulses experience progressive attenuation and skin-effect dispersion over long cable runs. Reliable pulse reflections in high-loss soil environments degrade beyond 2.5 kilometers of continuous wire.</p>
        <p>Rather than adding nodes every 1 km (which would require 10–20 pits), Jal Jeevan introduces <strong>Bi-Directional Multiplexing</strong>. By placing each node at the geographic center of a 5 km sector and using an ADG902 high-speed solid-state RF switch, a single node monitors:</p>
        <div class="wt-formula-card">
          Port A (Left / West): 0.0 km to 2.5 km &nbsp;+&nbsp; Port B (Right / East): 2.5 km to 5.0 km<br>
          Total Sector Reach = 5.0 km per Field Node!
        </div>
        <p>As a result, a 10 km municipal trunk line is fully protected with <strong>only 2 underground field nodes</strong> (Node 1 at km 2.5 and Node 2 at km 7.5)!</p>
      `,
      header: 'TOPOLOGY ADVANTAGES',
      features: [
        'Cuts field node count by 80% compared to unidirectional TDR',
        'Only 2 underground pits to construct and maintain over 10 km',
        'Solid-state RF switch has no moving parts or contact degradation',
        'Passive midpoint boundary pit ensures zero pulse collision between sectors'
      ]
    },
    '4': {
      title: 'Step 4: LoRa Multi-Hop Mesh & 24V Power-over-Trench',
      body: `
        <p>Underground IoT deployments in India face two fatal failure modes: <strong>RF attenuation through soil</strong> and <strong>dead batteries underground</strong>. Jal Jeevan solves both with robust first-principles engineering:</p>
        <p><strong>1. Multi-Hop LoRa Relay:</strong> Node 2 (km 7.5) cannot reliably punch through 7.5 km of wet ground to reach Gateway 0. It automatically forwards its 12-byte telemetry packet to Node 1 (km 2.5), which re-transmits it to Gateway 0 (km 0.0).</p>
        <div class="wt-formula-card">
          Packet Relay Path: Node 2 (km 7.5) ⟶ Node 1 (km 2.5) ⟶ Gateway 0 (km 0.0)
        </div>
        <p><strong>2. Power-over-Trench:</strong> To prevent batteries dying and blinding the system, a safe 24V DC SELV wire is laid in the same trench alongside the pipe from the Gateway solar station. Each node features a 3.65V LiFePO4 micro-UPS buffer providing 30 days of autonomous power during grid cuts.</p>
      `,
      header: 'INFRASTRUCTURE RESILIENCE',
      features: [
        'Zero dead batteries underground — continuous solar power delivery',
        'Safe 24V SELV line carries zero electrocution risk',
        'Internal LiFePO4 micro-UPS provides 30-day power during trench cuts',
        'Multi-hop LoRa ensures 99.8% packet delivery across full 10 km line'
      ]
    }
  };

  function selectWalkthroughStep(stepId) {
    const data = walkthroughData[stepId];
    if (!data) return;

    wtTabBtns.forEach(btn => btn.classList.toggle('active', btn.getAttribute('data-step') === stepId));

    let featureListHtml = data.features.map(f => `<li>${f}</li>`).join('');

    walkthroughContent.innerHTML = `
      <div class="wt-step-grid">
        <div>
          <h3 class="wt-step-title">${data.title}</h3>
          <div class="wt-step-body">${data.body}</div>
        </div>
        <div class="wt-graphic-card">
          <div class="wt-graphic-header">${data.header}</div>
          <ul class="wt-feature-list">${featureListHtml}</ul>
        </div>
      </div>
    `;
  }

  wtTabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      selectWalkthroughStep(btn.getAttribute('data-step'));
    });
  });

  // =========================================================
  // Interactive Scalability & BOM Calculator
  // =========================================================
  const pipelineDistSlider = document.getElementById('pipelineDistSlider');
  const sliderDistVal = document.getElementById('sliderDistVal');
  const calcNodeCount = document.getElementById('calcNodeCount');
  const calcGatewayCount = document.getElementById('calcGatewayCount');
  const calcRibbonLen = document.getElementById('calcRibbonLen');
  const calcTotalCost = document.getElementById('calcTotalCost');
  const bomPerMeterBadge = document.getElementById('bomPerMeterBadge');
  const bomTableBody = document.getElementById('bomTableBody');
  const cbarTraceTekVal = document.getElementById('cbarTraceTekVal');
  const cbarDmaVal = document.getElementById('cbarDmaVal');
  const cbarJalJeevanVal = document.getElementById('cbarJalJeevanVal');
  const cbarFillJalJeevan = document.getElementById('cbarFillJalJeevan');
  const savingsPctText = document.getElementById('savingsPctText');

  function updateBomCalculator(distKm) {
    sliderDistVal.textContent = `${distKm}.0 km`;

    const nodesNeeded = Math.ceil(distKm / 5);
    const ribbonMeters = distKm * 1000;
    const ribbonCost = ribbonMeters * 5.50; // ₹5.50/m
    const powerCableCost = distKm * 1000 * 4.00; // ₹4.00/m 24V trench line
    const nodeHardwareCost = nodesNeeded * 4600; // ₹4600 per node (IP68 box + ESP32 + LoRa + Schmitt + UPS)
    const gatewayCost = 8000; // 50W Solar + ESP32-S3 + SIM7600 + Mast

    const totalCost = ribbonCost + powerCableCost + nodeHardwareCost + gatewayCost;
    const costPerMeter = totalCost / ribbonMeters;

    calcNodeCount.textContent = `${nodesNeeded} Field Node${nodesNeeded > 1 ? 's' : ''}`;
    calcGatewayCount.textContent = '1 Gateway Station';
    calcRibbonLen.textContent = `${ribbonMeters.toLocaleString()} meters`;
    calcTotalCost.textContent = `₹${totalCost.toLocaleString()}`;
    bomPerMeterBadge.textContent = `₹${costPerMeter.toFixed(2)} / meter All-Inclusive`;

    // Table rows
    bomTableBody.innerHTML = `
      <tr>
        <td>Flat Geotextile Ribbon (6 o'clock Invert)</td>
        <td>${ribbonMeters.toLocaleString()} m</td>
        <td>₹5.50</td>
        <td>₹${ribbonCost.toLocaleString()}</td>
      </tr>
      <tr>
        <td>24V DC Trench Power Auxiliary Line</td>
        <td>${ribbonMeters.toLocaleString()} m</td>
        <td>₹4.00</td>
        <td>₹${powerCableCost.toLocaleString()}</td>
      </tr>
      <tr>
        <td>Bi-Directional Field Nodes (IP68 + ESP32 + UPS)</td>
        <td>${nodesNeeded} Units</td>
        <td>₹4,600</td>
        <td>₹${nodeHardwareCost.toLocaleString()}</td>
      </tr>
      <tr>
        <td>Central Gateway Mast (Solar + 4G + LoRa)</td>
        <td>1 Unit</td>
        <td>₹8,000</td>
        <td>₹${gatewayCost.toLocaleString()}</td>
      </tr>
      <tr style="border-top: 2px solid #cbd5e1; font-weight: 700; background: #f8fafc;">
        <td><strong>TOTAL SYSTEM CAPITAL COST</strong></td>
        <td><strong>${distKm} km Line</strong></td>
        <td><strong>₹${costPerMeter.toFixed(2)}/m</strong></td>
        <td style="color: #1d4ed8;"><strong>₹${totalCost.toLocaleString()}</strong></td>
      </tr>
    `;

    // Conventional Comparisons
    const traceTekCost = ribbonMeters * 5000; // ₹5,000/m
    const dmaCost = Math.max(1, Math.round(distKm / 10)) * 1500000; // ₹15 Lakh per 10km DMA zone

    cbarTraceTekVal.textContent = `₹${(traceTekCost / 10000000).toFixed(1)} Cr`;
    cbarDmaVal.textContent = `₹${(dmaCost / 100000).toFixed(0)} Lakh`;
    cbarJalJeevanVal.textContent = `₹${totalCost.toLocaleString()}`;

    const fillPct = Math.min(100, Math.max(2, (totalCost / dmaCost) * 100));
    cbarFillJalJeevan.style.width = `${fillPct.toFixed(1)}%`;

    const savingsPct = (((dmaCost - totalCost) / dmaCost) * 100).toFixed(1);
    savingsPctText.textContent = `${savingsPct}% Municipal Budget Savings!`;
  }

  pipelineDistSlider.addEventListener('input', (e) => {
    updateBomCalculator(parseInt(e.target.value, 10));
  });

  // Event Listeners for Simulation Buttons
  simNormalBtn.addEventListener('click', setNormalMode);
  simRuptureBtn.addEventListener('click', setBurstMode);
  simMediumBtn.addEventListener('click', setMediumMode);
  simRainBtn.addEventListener('click', setRainMode);
  simCutBtn.addEventListener('click', setCutMode);
  triggerBurstBtn.addEventListener('click', setBurstMode);

  // Cable Toggle Listeners
  btnSelectRibbon.addEventListener('click', () => updateCableComparator('RIBBON'));
  btnSelectCoax.addEventListener('click', () => updateCableComparator('COAX'));

  // Clear Log Table
  clearLogBtn.addEventListener('click', () => {
    logTableBody.innerHTML = '';
    addLogRow('NORMAL', 'SECTOR 1 & 2', 'Log Cleared', '--', '100%', 'Event log buffer reset by user.');
  });

  // Modal Listeners
  shareModalBtn.addEventListener('click', () => {
    shareModal.style.display = 'flex';
  });
  closeModalBtn.addEventListener('click', () => {
    shareModal.style.display = 'none';
  });
  modalOkBtn.addEventListener('click', () => {
    shareModal.style.display = 'none';
  });
  shareModal.addEventListener('click', (e) => {
    if (e.target === shareModal) shareModal.style.display = 'none';
  });

  // Initialize
  setNormalMode();
  updateCableComparator('RIBBON');
  selectNodeInspector('N1');
  selectFlowBlock('4');
  selectWalkthroughStep('1');
  updateBomCalculator(10);
});

