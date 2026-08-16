import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ActionMenu } from "./action-menu";

describe("ActionMenu", () => {
  it("renders one responsive three-dot trigger and touch-friendly menu items", async () => {
    const user = userEvent.setup();
    render(<ActionMenu label="จัดการ MAT-001" items={[{ label: "แก้ไข", onClick: vi.fn() }]} />);

    const trigger = screen.getByRole("button", { name: "จัดการ MAT-001" });
    expect(trigger).toHaveClass("h-10", "w-10", "sm:h-8", "sm:w-8");
    expect(trigger.querySelector("svg")).toBeInTheDocument();
    await user.click(trigger);
    expect(screen.getByRole("menuitem", { name: "แก้ไข" })).toHaveClass("min-h-10");
  });

  it("filters hidden actions, separates danger actions, and invokes callbacks", async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn();
    render(
      <ActionMenu
        items={[
          { label: "แก้ไข", onClick: vi.fn() },
          { label: "ซ่อน", hidden: true, onClick: vi.fn() },
          { label: "ลบ", variant: "danger", onClick: onDelete },
        ]}
      />,
    );

    await user.click(screen.getByRole("button", { name: "เมนู" }));
    expect(screen.queryByRole("menuitem", { name: "ซ่อน" })).not.toBeInTheDocument();
    expect(screen.getByRole("separator")).toBeInTheDocument();
    await user.click(screen.getByRole("menuitem", { name: "ลบ" }));
    expect(onDelete).toHaveBeenCalledOnce();
  });
});
