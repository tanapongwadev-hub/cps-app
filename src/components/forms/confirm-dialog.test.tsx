import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ConfirmDialog } from "./confirm-dialog";

describe("ConfirmDialog", () => {
  it("keeps long reason content and mobile actions viewport safe without changing DOM order", () => {
    const description =
      "เหตุผลที่ยาวมากสำหรับรายการ CCI-20260809-001-VERY-LONG-IDENTIFIER-WITHOUT-SPACES";

    render(
      <ConfirmDialog
        open
        onOpenChange={vi.fn()}
        title="ยกเลิกการรับเข้า"
        description={
          <div className="space-y-3">
            <p>{description}</p>
            <textarea aria-label="เหตุผลในการยกเลิก" className="w-full" />
          </div>
        }
        confirmText="ยกเลิกการรับเข้า"
        onConfirm={vi.fn()}
      />,
    );

    expect(screen.getByRole("dialog")).toHaveClass(
      "w-[calc(100vw-1rem)]",
      "max-h-[calc(100dvh-1rem)]",
      "p-4",
      "sm:p-6",
    );

    const descriptionWrapper = screen.getByText(description).closest("[id]");
    expect(descriptionWrapper).toHaveClass("min-w-0", "break-words");
    expect(screen.getByRole("textbox", { name: "เหตุผลในการยกเลิก" })).toHaveClass("w-full");

    const cancelButton = screen.getByRole("button", { name: "ยกเลิก", exact: true });
    const confirmButton = screen.getByRole("button", {
      name: "ยกเลิกการรับเข้า",
      exact: true,
    });
    expect(cancelButton).toHaveClass("w-full", "sm:w-auto");
    expect(confirmButton).toHaveClass("w-full", "sm:w-auto");

    const footer = cancelButton.parentElement;
    expect(footer).toHaveClass("flex-col-reverse", "sm:flex-row");
    expect(cancelButton.compareDocumentPosition(confirmButton)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );
  });
});
