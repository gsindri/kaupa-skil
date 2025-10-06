import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { QuantityStepper } from "./QuantityStepper";
import { BasketContext } from "@/contexts/BasketProviderUtils";

function renderWithCart(
  ui: React.ReactElement,
  overrides: Partial<React.ContextType<typeof BasketContext>> = {}
) {
  const defaultValue = {
    items: [],
    addItem: vi.fn(),
    updateQuantity: vi.fn(),
    removeItem: vi.fn(),
    clearBasket: vi.fn(),
    clearCart: vi.fn(),
    restoreItems: vi.fn(),
    getTotalItems: () => 0,
    getTotalPrice: () => 0,
    getMissingPriceCount: () => 0,
    isDrawerOpen: false,
    setIsDrawerOpen: vi.fn(),
    isDrawerPinned: false,
    setIsDrawerPinned: vi.fn(),
    cartPulseSignal: 0,
  } satisfies React.ContextType<typeof BasketContext>;

  const value = { ...defaultValue, ...overrides };

  return render(<BasketContext.Provider value={value}>{ui}</BasketContext.Provider>);
}

describe("QuantityStepper", () => {
  it("calls onRemove when the quantity is decremented to zero", async () => {
    const removeItem = vi.fn();
    renderWithCart(
      <QuantityStepper
        supplierItemId="item-1"
        quantity={1}
        label="Test item"
      />,
      { removeItem },
    );

    await userEvent.click(screen.getByRole("button", { name: /remove test item from cart/i }));

    expect(removeItem).toHaveBeenCalledWith("item-1");
  });

  it("respects the max value when incrementing", async () => {
    const updateQuantity = vi.fn();
    renderWithCart(
      <QuantityStepper
        supplierItemId="item-2"
        quantity={3}
        label="Another item"
        max={3}
      />,
      { updateQuantity },
    );

    const increaseButton = screen.getByRole("button", { name: /increase quantity of another item/i });
    expect(increaseButton).toBeDisabled();

    await userEvent.click(increaseButton);

    expect(updateQuantity).not.toHaveBeenCalled();
  });
});
