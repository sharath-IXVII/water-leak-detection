// HydroPulse - Smart Water Pipeline Leak Detection Dashboard Logic

document.addEventListener('DOMContentLoaded', () => {
  // Scenario Buttons
  const simNormalBtn = document.getElementById('simNormalBtn');
  const simRuptureBtn = document.getElementById('simRuptureBtn');
  const simRainBtn = document.getElementById('simRainBtn');
  const simCutBtn = document.getElementById('simCutBtn');
  const triggerBurstBtn = document.getElementById('triggerBurstBtn');

  // Modal elements
  const shareModalBtn = document.getElementById('shareModalBtn');
  const shareModal = document.getElementById('shareModal');
  const closeModalBtn = document.getElementById('closeModalBtn');
  const modalOkBtn = document.getElementById('modalOkBtn');

  // Pipeline Display Elements
  const pinpointMarker = document.getElementById('pinpointMarker');
  const pinpointDot = document.getElementById('pinpointDot');
  const calloutTitle = document.getElementById('calloutTitle');
  const calloutDist = document.getElementById('calloutDist');
  const calloutRef = document.getElementById('calloutRef');
  const calloutTime = document.getElementById('calloutTime');
  const calloutConf = document.getElementById('calloutConf');
  const mainSystemBadge = document.getElementById('mainSystemBadge');
  const pipePressureVal = document.getElementById('pipePressureVal');
  const flowVelocityVal = document.getElementById('flowVelocityVal');
  const estimatedLossVal = document.getElementById('estimatedLossVal');

  // Ring Oscillator & TDR Metrics
  const ringFreqVal = document.getElementById('ringFreqVal');
  const ringTauVal = document.getElementById('ringTauVal');
  const calcDistanceVal = document.getElementById('calcDistanceVal');

  // Telemetry Console & Logic Cards
  const telemetryJsonBox = document.getElementById('telemetryJsonBox');
  const decBoxBurst = document.getElementById('decBoxBurst');
  const decBoxRain = document.getElementById('decBoxRain');
  const decBoxCut = document.getElementById('decBoxCut');
  const logTableBody = document.getElementById('logTableBody');
  const clearLogBtn = document.getElementById('clearLogBtn');

  // Canvas context for light-theme oscilloscope
  const canvas = document.getElementById('tdrCanvas');
  const ctx = canvas.getContext('2d');

  // State
  let currentMode = 'NORMAL'; // 'NORMAL', 'BURST', 'RAIN', 'CUT'
  let targetDistanceM = 4800; // 4.8 km
  let animPhase = 0;
  let animFrameId = null;

  // Format Time
  function getTimeString() {
    return new Date().toTimeString().split(' ')[0];
  }

  // Draw Light-Theme Oscilloscope
  function renderScope() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const w = canvas.width;
    const h = canvas.height;
    const midY = h / 2 + 15;

    // 1. Light Pearl Background Grid
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    for (let x = 0; x < w; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y < h; y += 35) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    // 2. Baseline Center Line
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, midY);
    ctx.lineTo(w, midY);
    ctx.stroke();

    // 3. Stored Dry Baseline Trace (Blue line)
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let x = 0; x < w; x++) {
      let y = midY;
      // Incident launch pulse at start (x ~ 40)
      if (x >= 25 && x <= 55) {
        let diff = (x - 40) / 5;
        y -= Math.exp(-diff * diff) * 65; // +3.3V launch
      }
      // Far end open reflection at x ~ w - 40
      if (x >= w - 55 && x <= w - 25) {
        let diff = (x - (w - 40)) / 5;
        y -= Math.exp(-diff * diff) * 55; // positive reflection for open line
      }
      // Cable micro-ripple
      y += Math.sin(x * 0.12) * 0.6;

      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // 4. Live Trace (Teal for normal, Teal with Dip for wet, or Step for cut)
    ctx.strokeStyle = (currentMode === 'BURST' || currentMode === 'RAIN') ? '#0d9488' : (currentMode === 'CUT' ? '#ea580c' : '#059669');
    ctx.lineWidth = 2.2;
    ctx.beginPath();

    const leakX = 40 + ((targetDistanceM / 10000) * (w - 80));

    for (let x = 0; x < w; x++) {
      let y = midY;
      // Launch pulse
      if (x >= 25 && x <= 55) {
        let diff = (x - 40) / 5;
        y -= Math.exp(-diff * diff) * 65;
      }

      // If Wet (BURST or RAIN), negative reflection dip at leakX
      if (currentMode === 'BURST' || currentMode === 'RAIN') {
        if (x >= leakX - 22 && x <= leakX + 22) {
          let diff = (x - leakX) / 6;
          y += Math.exp(-diff * diff) * 50; // downward reflection (negative Γ)
        }
      }

      // If Cable Cut at 7.2 km (x ~ 72%), large positive reflection earlier
      if (currentMode === 'CUT') {
        const cutX = 40 + (0.72 * (w - 80));
        if (x >= cutX - 22 && x <= cutX + 22) {
          let diff = (x - cutX) / 6;
          y -= Math.exp(-diff * diff) * 70; // large positive reflection from cut break!
        }
      }

      // Far end reflection (only reaches end if not completely cut)
      if (currentMode !== 'CUT') {
        if (x >= w - 55 && x <= w - 25) {
          let diff = (x - (w - 40)) / 5;
          let amp = (currentMode === 'BURST' || currentMode === 'RAIN') ? 35 : 55;
          y -= Math.exp(-diff * diff) * amp;
        }
      }

      // Live trace subtle jitter
      y += Math.cos(x * 0.1 + animPhase) * 0.8;

      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // 5. Differential Spike (Red dashed line) if an event is active
    if (currentMode === 'BURST' || currentMode === 'RAIN' || currentMode === 'CUT') {
      const activeX = (currentMode === 'CUT') ? (40 + 0.72 * (w - 80)) : leakX;
      const diffColor = (currentMode === 'BURST') ? '#dc2626' : (currentMode === 'RAIN' ? '#d97706' : '#ea580c');
      
      ctx.strokeStyle = diffColor;
      ctx.lineWidth = 2.5;
      ctx.setLineDash([4, 3]);
      ctx.beginPath();
      for (let x = 0; x < w; x++) {
        let dy = midY;
        if (x >= activeX - 22 && x <= activeX + 22) {
          let diff = (x - activeX) / 6;
          if (currentMode === 'CUT') {
            dy -= Math.exp(-diff * diff) * 70;
          } else {
            dy += Math.exp(-diff * diff) * 50;
          }
        }
        if (x === 0) ctx.moveTo(x, dy);
        else ctx.lineTo(x, dy);
      }
      ctx.stroke();
      ctx.setLineDash([]);

      // Vertical cursor marker
      ctx.strokeStyle = diffColor;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(activeX, 15);
      ctx.lineTo(activeX, h - 15);
      ctx.stroke();

      // Text annotation
      ctx.fillStyle = diffColor;
      ctx.font = '600 11px JetBrains Mono';
      const labelText = (currentMode === 'CUT') ? 'CABLE CUT @ 7.20 km' : `PEAK REFLECTION @ ${targetDistanceM / 1000} km`;
      ctx.fillText(labelText, activeX - 60, 26);
    }

    animPhase += 0.04;
    animFrameId = requestAnimationFrame(renderScope);
  }

  // Start rendering scope
  renderScope();

  // Reset Highlight Decision Boxes
  function resetDecisionBoxes() {
    decBoxBurst.className = 'decision-box';
    decBoxRain.className = 'decision-box';
    decBoxCut.className = 'decision-box';
  }

  // Update Active Button in Bar
  function setActiveSimBtn(activeBtn) {
    [simNormalBtn, simRuptureBtn, simRainBtn, simCutBtn].forEach(b => b.classList.remove('active'));
    activeBtn.classList.add('active');
  }

  // 1. Scenario: Normal
  function setNormalMode() {
    currentMode = 'NORMAL';
    setActiveSimBtn(simNormalBtn);
    resetDecisionBoxes();

    mainSystemBadge.textContent = 'ALL SYSTEMS NORMAL';
    mainSystemBadge.className = 'system-badge badge-normal';

    pipePressureVal.textContent = '4.20 Bar';
    flowVelocityVal.textContent = '1.45 m/s';
    estimatedLossVal.textContent = '0 L/hr';

    pinpointMarker.style.display = 'none';

    ringFreqVal.textContent = '20.83 MHz (Dry End)';
    ringTauVal.textContent = '24.0 μs';
    calcDistanceVal.textContent = '-- m';

    telemetryJsonBox.textContent = JSON.stringify({
      node_id: "SEC-B_KM10_NODE1",
      status: "NORMAL_STANDBY",
      power_mode: "DEEP_SLEEP_10UA",
      distance_m: 0.0,
      pressure_bar: 4.20,
      cable_impedance_ohm: 100000,
      rain_filter_active: true,
      battery_v: 3.92,
      timestamp: new Date().toISOString()
    }, null, 2);

    addLogRow('NORMAL', 'SEC-B_KM10', 'System reset to normal standby', '--', '100%', 'Telemetry synced with LoRa gateway');
  }

  // 2. Scenario: Confirmed Pipe Burst (4.8 km)
  function setBurstMode() {
    currentMode = 'BURST';
    targetDistanceM = 4800;
    setActiveSimBtn(simRuptureBtn);
    resetDecisionBoxes();
    decBoxBurst.classList.add('highlight-burst');

    mainSystemBadge.textContent = 'CRITICAL: PIPE BURST AT 4.80 KM';
    mainSystemBadge.className = 'system-badge badge-danger';

    pipePressureVal.textContent = '2.65 Bar (-1.55 Bar Drop)';
    pipePressureVal.style.color = '#dc2626';
    flowVelocityVal.textContent = '2.10 m/s (Surge)';
    estimatedLossVal.textContent = '3,200 L/hr';

    // Show Red Pinpoint at 48% along 10km
    pinpointMarker.style.display = 'block';
    pinpointMarker.style.left = '48%';
    pinpointDot.style.background = '#dc2626';
    calloutTitle.textContent = 'PIPE BURST CONFIRMED (RED DOT)';
    calloutTitle.style.color = '#dc2626';
    calloutDist.textContent = '4,800 m (4.80 km)';
    calloutRef.textContent = 'Pit 2 + 800 m';
    calloutTime.textContent = '48.0 μs';
    calloutConf.textContent = '98.8%';
    calloutConf.style.color = '#dc2626';

    // Ring Oscillator calculation: f = v / (4 * d) = 2e8 / (4 * 4800) = 10.42 MHz
    ringFreqVal.textContent = '10.42 MHz (Wet Resonant)';
    ringTauVal.textContent = '24.0 μs (One-Way)';
    calcDistanceVal.textContent = '4,800 m';

    telemetryJsonBox.textContent = JSON.stringify({
      node_id: "SEC-B_KM10_NODE1",
      status: "CONFIRMED_PIPE_BURST",
      alarm_severity: "CRITICAL",
      distance_m: 4800.0,
      ring_freq_mhz: 10.42,
      cable_impedance_ohm: 4800,
      pressure_bar: 2.65,
      pressure_drop_pct: 36.9,
      rain_filter_status: "PASSED_INTERNAL_PRESSURE_DROP",
      action: "SMS_DISPATCH_SENT",
      timestamp: new Date().toISOString()
    }, null, 2);

    addLogRow('BURST', 'SEC-B_KM10', 'CONFIRMED PIPE BURST', '4.80 km (Pit 2 + 800m)', '98.8%', 'SMS & Telegram dispatched to Jal Board engineers');
  }

  // 3. Scenario: Rain / Groundwater Infiltration (The False Alarm Filter!)
  function setRainMode() {
    currentMode = 'RAIN';
    targetDistanceM = 3200;
    setActiveSimBtn(simRainBtn);
    resetDecisionBoxes();
    decBoxRain.classList.add('highlight-rain');

    mainSystemBadge.textContent = 'RAIN DETECTED: FALSE ALARM FILTERED';
    mainSystemBadge.className = 'system-badge badge-warning';

    pipePressureVal.textContent = '4.22 Bar (Nominal)';
    pipePressureVal.style.color = '#059669';
    flowVelocityVal.textContent = '1.44 m/s';
    estimatedLossVal.textContent = '0 L/hr';

    // Show Amber Pinpoint
    pinpointMarker.style.display = 'block';
    pinpointMarker.style.left = '32%';
    pinpointDot.style.background = '#d97706';
    calloutTitle.textContent = 'RAIN INFILTRATION (FILTERED)';
    calloutTitle.style.color = '#d97706';
    calloutDist.textContent = '3,200 m (Soil Moisture)';
    calloutRef.textContent = 'Pit 1 + 1,200 m';
    calloutTime.textContent = '32.0 μs';
    calloutConf.textContent = '100% (No Pipe Leak)';
    calloutConf.style.color = '#059669';

    ringFreqVal.textContent = '15.63 MHz';
    ringTauVal.textContent = '16.0 μs';
    calcDistanceVal.textContent = '3,200 m';

    telemetryJsonBox.textContent = JSON.stringify({
      node_id: "SEC-B_KM10_NODE1",
      status: "ENVIRONMENTAL_RAIN_INFILTRATION",
      alarm_severity: "SUPPRESSED_NO_ALARM",
      cable_impedance_ohm: 12000,
      pressure_bar: 4.22,
      pressure_drop_pct: 0.0,
      decision_rule: "CABLE_WET_BUT_INTERNAL_PRESSURE_STABLE",
      verdict: "FALSE_ALARM_AVOIDED",
      timestamp: new Date().toISOString()
    }, null, 2);

    addLogRow('RAIN', 'SEC-B_KM10', 'Rain Saturation Detected', '3.20 km', '100%', 'Verified intact pipe pressure. False alarm automatically suppressed.');
  }

  // 4. Scenario: Cable Cut / Tamper
  function setCutMode() {
    currentMode = 'CUT';
    targetDistanceM = 7200;
    setActiveSimBtn(simCutBtn);
    resetDecisionBoxes();
    decBoxCut.classList.add('highlight-rain');

    mainSystemBadge.textContent = 'FAULT: CABLE SEVERED AT 7.20 KM';
    mainSystemBadge.className = 'system-badge badge-warning';

    pipePressureVal.textContent = '4.20 Bar (Pipe OK)';
    pipePressureVal.style.color = '#0f172a';
    flowVelocityVal.textContent = '1.45 m/s';
    estimatedLossVal.textContent = '0 L/hr';

    pinpointMarker.style.display = 'block';
    pinpointMarker.style.left = '72%';
    pinpointDot.style.background = '#ea580c';
    calloutTitle.textContent = 'CABLE FAULT / CUT (EOL OPEN)';
    calloutTitle.style.color = '#ea580c';
    calloutDist.textContent = '7,200 m (7.20 km)';
    calloutRef.textContent = 'Pit 3 + 1,200 m';
    calloutTime.textContent = '72.0 μs';
    calloutConf.textContent = '99.2%';
    calloutConf.style.color = '#ea580c';

    ringFreqVal.textContent = '6.94 MHz (Cut Reflection)';
    ringTauVal.textContent = '36.0 μs';
    calcDistanceVal.textContent = '7,200 m';

    telemetryJsonBox.textContent = JSON.stringify({
      node_id: "SEC-B_KM10_NODE1",
      status: "CABLE_SEVERED_FAULT",
      cable_state: "EOL_RESISTOR_DISCONNECTED_OPEN",
      distance_m: 7200.0,
      pressure_bar: 4.20,
      action: "DISPATCH_LINE_REPAIR",
      timestamp: new Date().toISOString()
    }, null, 2);

    addLogRow('FAULT', 'SEC-B_KM10', 'CABLE CUT / TAMPER', '7.20 km (Pit 3 + 1.2km)', '99.2%', 'End-of-line resistor open. Cable break pinpointed for repair.');
  }

  // Add Log Entry
  function addLogRow(type, node, condition, dist, conf, action) {
    const row = document.createElement('tr');
    let pillClass = 'badge-ok';
    if (type === 'BURST') pillClass = 'badge-crit';
    else if (type === 'RAIN' || type === 'FAULT') pillClass = 'badge-warn';

    row.innerHTML = `
      <td>${getTimeString()}</td>
      <td>${node}</td>
      <td><span class="badge-status ${pillClass}">${condition}</span></td>
      <td><strong>${dist}</strong></td>
      <td>${conf}</td>
      <td>${action}</td>
    `;
    logTableBody.insertBefore(row, logTableBody.firstChild);
  }

  // Listeners
  simNormalBtn.addEventListener('click', setNormalMode);
  simRuptureBtn.addEventListener('click', setBurstMode);
  simRainBtn.addEventListener('click', setRainMode);
  simCutBtn.addEventListener('click', setCutMode);
  triggerBurstBtn.addEventListener('click', setBurstMode);

  clearLogBtn.addEventListener('click', () => {
    logTableBody.innerHTML = '';
  });

  // Modal handlers
  shareModalBtn.addEventListener('click', () => {
    shareModal.style.display = 'flex';
  });

  closeModalBtn.addEventListener('click', () => {
    shareModal.style.display = 'none';
  });

  modalOkBtn.addEventListener('click', () => {
    shareModal.style.display = 'none';
  });

  window.addEventListener('click', (e) => {
    if (e.target === shareModal) {
      shareModal.style.display = 'none';
    }
  });
});
