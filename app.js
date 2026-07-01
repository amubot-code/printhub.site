// Connect to the Deriv WebSocket API
const ws = new WebSocket('wss://ws.derivws.com/websockets/v3?app_id=1089'); // Using default app_id for testing

ws.onopen = function(evt) {
    console.log("WebSocket connection opened.");
    // Example: Subscribe to Volatility 100 (1s) Index ticks
    ws.send(JSON.stringify({
        ticks: "1HZ10V"
    }));
};

ws.onmessage = function(msg) {
    const data = JSON.parse(msg.data);
    if (data.tick) {
        const tickPrice = data.tick.quote;
        // Update the HTML element on your phone screen
        document.getElementById('tick-stream').innerText = `Tick Price: ${tickPrice}`;
    }
};

ws.onclose = function(evt) {
    console.log("Connection closed.");
    document.getElementById('tick-stream').innerText = "Connection Closed";
};

ws.onerror = function(err) {
    console.error("WebSocket Error:", err);
};
