import { expect, test } from "@jest/globals";
import { CombustionBLE } from "../lib/combustion_ble";

const fromHexString = (hexString: String) => Uint8Array.from(hexString.match(/.{1,2}/g)!.map((byte) => parseInt(byte, 16)));

test("Instant mode parse", () => {
    const combustionBLE = new CombustionBLE();
    let result = combustionBLE.parse(fromHexString("00000000c00000006903000000000000000000000001c00000000000000000000000000000000000000000000000000000"));

    expect(result).not.toBeNull();
    expect(result?.mode).toBe(1);
    expect(result?.temps.length).toBe(1);
    expect(result?.temps[0]).toBe(23.65);
});

test("Normal mode parse", () => {
    const combustionBLE = new CombustionBLE();
    const result = combustionBLE.parse(fromHexString("00000000a70100005a436b6c8dac9135ae86d6e01a00e0000000f0ffbf3500000000000000000000000000000000000000"));
    
    expect(result).not.toBeNull();
    expect(result?.mode).toBe(0);
    expect(result?.temps.length).toBe(8);
    expect(result?.temps[7]).toBe(23);
    expect(result?.temps[6]).toBe(22.9);
    expect(result?.temps[5]).toBe(22.75);
    expect(result?.temps[4]).toBe(22.85);
    expect(result?.temps[3]).toBe(22.85);
    expect(result?.temps[2]).toBe(22.95);
    expect(result?.temps[1]).toBe(22.9);
    expect(result?.temps[0]).toBe(22.9);
});