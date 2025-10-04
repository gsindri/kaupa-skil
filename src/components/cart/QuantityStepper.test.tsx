import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { QuantityStepper } from "./QuantityStepper";

describe("QuantityStepper", () => {
  it("calls onRemove when the quantity is decremented to zero", async () => {
    const onRemove = vi.fn();
    render(
      <QuantityStepper
        quantity={1}
        onChange={() => {}}
        label="Test item"
        onRemove={onRemove}
      />,
    );

    await userEvent.click(screen.getByRole("button", { name: /decrease quantity of test item/i }));

    expect(onRemove).toHaveBeenCalledTimes(1);
  });

  it("respects the max value when incrementing", async () => {
    const onChange = vi.fn();
    render(
      <QuantityStepper
        quantity={3}
        onChange={onChange}
        label="Another item"
        max={3}
      />,
    );

    const increaseButton = screen.getByRole("button", { name: /increase quantity of another item/i });
    expect(increaseButton).toBeDisabled();

    await userEvent.click(increaseButton);

    expect(onChange).not.toHaveBeenCalled();
  });
});
