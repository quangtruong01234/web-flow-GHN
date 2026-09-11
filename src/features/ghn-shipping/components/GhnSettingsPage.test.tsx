import { render, screen } from "@testing-library/react";
import { GhnSettingsPage } from "./GhnSettingsPage";

/**
 * This page used to render fake credentials, a "Save settings" button that saved
 * nothing, and an "Auto sync failed deliveries" toggle. The toggle is the one
 * that matters: under GHN-FAIL-NTF-01 a loop over the sync endpoint notifies
 * every buyer whose parcel already failed, so a control inviting exactly that
 * must not sit here waiting for someone to wire it up.
 */
describe("GhnSettingsPage", () => {
  it("offers no auto-sync control and states the policy instead", () => {
    render(<GhnSettingsPage />);

    expect(screen.queryByText(/auto.?sync failed deliveries/i)).not.toBeInTheDocument();
    expect(screen.queryByRole("switch")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /save settings/i })).not.toBeInTheDocument();
    expect(screen.getByText(/there is no auto-sync, and there will not be one/i)).toBeInTheDocument();
  });

  it("shows no carrier credentials", () => {
    render(<GhnSettingsPage />);

    expect(screen.queryByText(/mock-token-not-real/i)).not.toBeInTheDocument();
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    expect(screen.getAllByText(/backend-only — never sent here/i).length).toBeGreaterThan(0);
  });
});
