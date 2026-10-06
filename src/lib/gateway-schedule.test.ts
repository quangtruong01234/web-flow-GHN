import { minutesUntilGatewayClose } from "./gateway-schedule";

// Every instant is written with an explicit offset, so the result cannot depend
// on the zone of the machine running the tests.
const at = (iso: string) => minutesUntilGatewayClose(new Date(iso));

describe("minutesUntilGatewayClose", () => {
  it("stays quiet before 18:45 ICT", () => {
    expect(at("2026-10-06T18:44:59+07:00")).toBeNull();
    expect(at("2026-10-06T14:00:00+07:00")).toBeNull();
  });

  it("opens the warning window at 18:45 ICT", () => {
    expect(at("2026-10-06T18:45:00+07:00")).toBe(15);
  });

  it("rounds the remaining time up to whole minutes", () => {
    expect(at("2026-10-06T18:59:00+07:00")).toBe(1);
    expect(at("2026-10-06T18:59:59+07:00")).toBe(1);
    expect(at("2026-10-06T18:50:30+07:00")).toBe(10);
  });

  it("closes the window at 19:00 ICT", () => {
    expect(at("2026-10-06T19:00:00+07:00")).toBeNull();
    expect(at("2026-10-06T23:30:00+07:00")).toBeNull();
  });

  // The same instant seen from other zones: 18:50 ICT is 11:50 UTC and 07:50
  // the same morning in New York. 18:50 UTC is 01:50 ICT the next day.
  it("reads ICT regardless of the zone an instant is written in", () => {
    expect(at("2026-10-06T11:50:00Z")).toBe(10);
    expect(at("2026-10-06T07:50:00-04:00")).toBe(10);
    expect(at("2026-10-06T18:50:00Z")).toBeNull();
  });
});
