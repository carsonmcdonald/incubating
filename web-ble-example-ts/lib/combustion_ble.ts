import { Parser } from "binary-parser";

export type CombustionStatus = {
  logRangeMin: number;
  logRangeMax: number;
  temps: number[];
  mode: number;
  batteryOk: boolean;
};

const rawTempToC = (value: number): number => Math.round((value * 0.05 - 20) * 10000) / 10000;

export class CombustionBLE {
  public static readonly COMPANY_ID: number = 0x09c7;
  public static readonly STATUS_SERVICE_UUID: string = "00000100-caab-3792-3d44-97ae51c1407a";

  parser = new Parser()
    .uint32le("logRangeMin") // 4 bytes
    .uint32le("logRangeMax") // 4 bytes
    .wrapped("temps", {
      length: 13,
      wrapper: (buffer) => buffer.reverse(),
      type: Parser.start()
        .bit13("thermistor8", { formatter: rawTempToC }) // 92-104 Thermistor 8 raw reading
        .bit13("thermistor7", { formatter: rawTempToC }) // 79-91  Thermistor 7 raw reading
        .bit13("thermistor6", { formatter: rawTempToC }) // 66-78  Thermistor 6 raw reading
        .bit13("thermistor5", { formatter: rawTempToC }) // 53-65  Thermistor 5 raw reading
        .bit13("thermistor4", { formatter: rawTempToC }) // 40-52  Thermistor 4 raw reading
        .bit13("thermistor3", { formatter: rawTempToC }) // 27-39  Thermistor 3 raw reading
        .bit13("thermistor2", { formatter: rawTempToC }) // 14-26  Thermistor 2 raw reading
        .bit13("thermistor1", { formatter: rawTempToC }), // 1-13   Thermistor 1 raw reading
    })
    .bit3("probeId") // 6-8 Probe identifier # (IDs 1-8)
    .bit3("colorId") // 3-5 Color ID (8 total)
    .bit2("mode") // 1-2 Mode: 0: Normal, 1: Instant Read, 2: Reserved, 3: Error
    .bit2("virtualAmbient") // 6-7 Virtual Ambient Sensor: 0: T5 Sensor ... 3: T8 Sensor
    .bit2("virtualSurface") // 4-5 Virtual Surface Sensor: 0: T4 Sensor ... 3: T7 Sensor
    .bit3("virtualCore") // 1-3 Virtual Core Sensor: 0: T1 Sensor (tip) ... 5: T6 Sensor
    .bit1("batteryStatus"); // bit 1 Battery Status: 0: Battery OK 1: Low battery

  constructor() {}

  public parse(data: Uint8Array): CombustionStatus | null {
    const parsedValue = this.parser.parse(data);
    if (parsedValue) {
      let temps = [];
      temps.push(parsedValue.temps.thermistor1 as number);
      if (parsedValue.mode == 0) {
        temps.push(parsedValue.temps.thermistor2 as number);
        temps.push(parsedValue.temps.thermistor3 as number);
        temps.push(parsedValue.temps.thermistor4 as number);
        temps.push(parsedValue.temps.thermistor5 as number);
        temps.push(parsedValue.temps.thermistor6 as number);
        temps.push(parsedValue.temps.thermistor7 as number);
        temps.push(parsedValue.temps.thermistor8 as number);
      }
      return {
        logRangeMin: parsedValue.logRangeMin as number,
        logRangeMax: parsedValue.logRangeMax as number,
        temps: temps,
        mode: parsedValue.mode as number,
        batteryOk: parsedValue.batteryStatus == 1,
      };
    } else {
      return null;
    }
  }
};