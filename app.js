// Setup View Switching Controller
function switchView(panelId, element) {
    document.querySelectorAll('.view-panel').forEach(panel => panel.classList.remove('active'));
    document.querySelectorAll('.nav-tab').forEach(tab => tab.classList.remove('active'));
    
    document.getElementById(panelId).classList.add('active');
    element.classList.add('active');
}

// Connect WebSocket directly to live Deriv Production Endpoint
const socket = new WebSocket('wss://ws.derivws.com/websockets/v3?app_id=1089');

let datasetArray = [];
const historyDepth = 100; // Analyzes last 100 ticks like professional configurations

socket.onopen = function() {
    executeAssetSubscription(document.getElementById('market-id').value);
};

function executeAssetSubscription(assetToken) {
    datasetArray = [];
    socket.send(JSON.stringify({ ticks: assetToken }));
}

document.getElementById('market-id').addEventListener('change', function(e) {
    socket.send(JSON.stringify({ forget_all: "ticks" }));
    executeAssetSubscription(e.target.value);
});

socket.onmessage = function(rawPayload) {
    const parsedData = JSON.parse(rawPayload.data);
    
    if (parsedData.tick) {
        const strictPrice = parsedData.tick.quote.toFixed(parsedData.tick.pip_size);
        const resolvedLastDigit = parseInt(strictPrice.slice(-1));
        
        datasetArray.push(resolvedLastDigit);
        if (datasetArray.length > historyDepth) {
            datasetArray.shift();
        }
        
        recalculateStrategyMetrics();
    }
};

function recalculateStrategyMetrics() {
    if (datasetArray.length === 0) return;

    const occurrences = Array(10).fill(0);
    let evenCount = 0;
    let oddCount = 0;
    let underCount = 0; // Digits 0 - 4
    let overCount = 0;  // Digits 5 - 9

    datasetArray.forEach(digit => {
        occurrences[digit]++;
        
        // Strategy metric calculations
        if (digit % 2 === 0) evenCount++; else oddCount++;
        if (digit < 5) underCount++; else overCount++;
    });

    const standardPercentages = occurrences.map(hits => ((hits / datasetArray.length) * 100).toFixed(1));
    const highestPeakVal = Math.max(...standardPercentages);
    const lowestValleyVal = Math.min(...standardPercentages);

    // Update individual circular ring displays
    for (let currentDigit = 0; currentDigit < 10; currentDigit++) {
        const pctIndicator = document.getElementById(`p-${currentDigit}`);
        const structuralRing = document.getElementById(`ring-${currentDigit}`);
        
        pctIndicator.innerText = `${standardPercentages[currentDigit]}%`;
        structuralRing.className = "stat-ring";
        
        if (parseFloat(standardPercentages[currentDigit]) === highestPeakVal && highestPeakVal !== lowestValleyVal) {
            structuralRing.classList.add('highest-hit');
        } else if (parseFloat(standardPercentages[currentDigit]) === lowestValleyVal && highestPeakVal !== lowestValleyVal) {
            structuralRing.classList.add('lowest-hit');
        }
    }

    // Run strategy analytical evaluation engines
    const totalProcessed = datasetArray.length;
    
    // 1. Over/Under Strategy Metrics String
    const overPct = ((overCount / totalProcessed) * 100).toFixed(0);
    const underPct = ((underCount / totalProcessed) * 100).toFixed(0);
    document.getElementById('ou-analytics').innerText = `Overs: ${overPct}% | Unders: ${underPct}%`;

    // 2. Even/Odd Strategy Metrics String
    const evenPct = ((evenCount / totalProcessed) * 100).toFixed(0);
    const oddPct = ((oddCount / totalProcessed) * 100).toFixed(0);
    document.getElementById('eo-analytics').innerText = `Evens: ${evenPct}% | Odds: ${oddPct}%`;
}
