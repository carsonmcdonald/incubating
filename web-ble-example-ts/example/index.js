import { CombustionBLE } from '/lib/combustion_ble.js';

const logOutput = (log) => {
    const logListEl = document.getElementById("log-output");
    const logEntry = document.createElement("li");
    logEntry.textContent = log;
    logListEl.prepend(logEntry);
};

const bufferToHexString = (data) => {
    let hexString = "";
    for (let i = 0; i < data.length; i++) {
      const hex = data[i].toString(16);
      hexString += hex.padStart(2, "0");
    }
    return hexString;
}

const updateDisplayData = (report) => {
    const tempsArea = document.getElementById("temps");
    tempsArea.style.visibility = "visible";
    const readingArea = document.getElementById("reading");
    readingArea.textContent = cToF(report.temps[0]);
    const lastLogSeqArea = document.getElementById("lls");
    lastLogSeqArea.textContent = report.logRangeMax;
    const lastReadingCountArea = document.getElementById("lrc");
    lastReadingCountArea.textContent = report.temps.length;
    const batteryStatusArea = document.getElementById("bsa");
    batteryStatusArea.textContent = report.batteryOk ? "OK" : "LOW";
    const lastUpdateTimeArea = document.getElementById("lut");
    lastUpdateTimeArea.textContent = new Date();
};

const cToF = (c) => Math.round(((c * 9) / 5 + 32) * 10000) / 10000;

var device = null;
const combustionBLE = new CombustionBLE();

export const bleExampleStart = async () => {
    logOutput("Waiting for selection.");

    device = await navigator.bluetooth
                            .requestDevice({
                                optionalServices: [CombustionBLE.STATUS_SERVICE_UUID],
                                filters: [{
                                    manufacturerData: [{
                                        companyIdentifier: CombustionBLE.COMPANY_ID
                                    }]
                                }]
                            });

    logOutput("Connected to device. Attempting GATT connection.");

    const gatt = await device.gatt?.connect();

    logOutput("GATT connection success. Fetching services.");

    const services = await gatt?.getPrimaryServices();

    logOutput(`Service count ${services.length}. Fetching characteristics.`);

    services?.forEach(async (service) => {
        const cts = await service.getCharacteristics();
        
        logOutput(`Found ${cts.length} characteristics. Fetching current values.`);
        
        cts.forEach(async (ch) => {
            logOutput(`Fetching characteristic ${ch.uuid} current value.`);

            const value = await ch.readValue();
            const data = new Uint8Array(value.buffer);

            logOutput(`Characteristic ${ch.uuid} current value length ${value.byteLength} raw data '${bufferToHexString(data)}'.`);

            const report = combustionBLE.parse(data);
            updateDisplayData(report);

            ch.addEventListener('characteristicvaluechanged', (ev) => {
                const ech = ev.target;
                if (ech.value?.buffer) {
                    const data = new Uint8Array(ech.value?.buffer);

                    logOutput(`Characteristic ${ech.uuid} updated. Value length ${ech.value.byteLength} raw data '${bufferToHexString(data)}'.`);

                    const report = combustionBLE.parse(data);
                    updateDisplayData(report);
                }
            });
            ch.startNotifications();
        });
    });
};

export const bleExampleStop = () => {
    if (device != null) {
        device.gatt?.disconnect();
        logOutput(`Disconnected.`);
        device = null;
    }
};
